"use client";

import { useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { createIceMaterial } from "./materials/iceMaterial";
import { updateMorphTargets } from "./animation/morphLoop";
import { setupIceLighting } from "./lighting/iceLighting";
import { createMaskedCompositeRenderer } from "./render/maskedComposite";
import { frameCameraToModel, getVisibleMeshBounds } from "./utils/modelFraming";
import {
  applyInitialOrbitAngles,
  applyOrbitControlsProfile,
  createInitialOrbitNudge,
  updateInitialOrbitNudge,
  updateOrbitEdgeSmoothing,
} from "./controls/orbitProfiles";
import styles from "../../LandingPage.module.css";

import { motion } from "framer-motion";

import Text from "@/components/Text/Text";
import { DeviceContext } from "@/context/DeviceContext";

export default function Scene({ createEnvironmentScene, lightsEnabled = true, activeSection, modelPath, setView }) {
  const { isTouch } = useContext(DeviceContext);
  const [status, setStatus] = useState("Loading...");
  const [copied, setCopied] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const mountRef = useRef(null);
  const rotationDebugRef = useRef(null);

  const handleTextClick = () => {
    setView("text");
  };
  const handleCopyDebug = async () => {
    if (!rotationDebugRef.current?.textContent) return;
    try {
      await navigator.clipboard.writeText(rotationDebugRef.current.textContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // No-op: clipboard may be unavailable in some contexts.
    }
  };

  const sectionKeyPositionStyle = {
    left: "50%",
    right: "auto",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  };
  useEffect(() => {
    if (!mountRef.current) return;

    setStatus?.("Loading model...");
    setModelLoaded(false);

    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090b0f);

    const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const arcticEnvironment = createEnvironmentScene();
    const environmentMap = pmremGenerator.fromScene(arcticEnvironment.scene, 0.06).texture;
    scene.environment = environmentMap;
    scene.background = environmentMap;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(0, 0, 5);

    const maskedComposite = createMaskedCompositeRenderer();

    const controls = new OrbitControls(camera, renderer.domElement);
    const maxTextureAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const isModel13 = modelPath === "/assets/models/13/13-optimized.glb";
    const isModel16 = modelPath === "/assets/models/16/16-optimized.glb";
    const orbitProfileState = applyOrbitControlsProfile(controls, modelPath, { isTouch: Boolean(isTouch) });
    let initialOrbitNudge = null;
    const cancelInitialOrbitNudge = () => {
      initialOrbitNudge = null;
    };
    renderer.domElement.addEventListener("pointerdown", cancelInitialOrbitNudge, { passive: true });
    renderer.domElement.addEventListener("wheel", cancelInitialOrbitNudge, { passive: true });
    renderer.domElement.addEventListener("touchstart", cancelInitialOrbitNudge, { passive: true });
    const getModelFillRatio = (clientWidth = window.innerWidth) => {
      const isMobile = clientWidth <= 900;
      if (isModel16) return 3.2;
      if (isModel13) return isMobile ? 1.8 : 1.067;
      return 1.6;
    };

    const { rimLight, rimTarget } = setupIceLighting(scene, lightsEnabled);

    let fittedModelSize = null;
    let fittedModelCenter = new THREE.Vector3();
    let modelRoot = null;
    const morphTargets = [];
    const clock = new THREE.Clock();

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        modelRoot = model;
        if (modelPath === "/assets/models/14/14-optimized.glb") {
          model.rotation.x = Math.PI / 2;
        }
        scene.add(model);

        model.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = false;
          object.receiveShadow = false;

          if (Array.isArray(object.material)) {
            object.material = object.material.map((material) =>
              createIceMaterial(material, { anisotropy: maxTextureAnisotropy }),
            );
          } else {
            object.material = createIceMaterial(object.material, { anisotropy: maxTextureAnisotropy });
          }

          if (!object.morphTargetDictionary || !object.morphTargetInfluences) return;
          const indices = Object.entries(object.morphTargetDictionary)
            .sort((a, b) => a[1] - b[1])
            .map((entry) => entry[1]);
          if (indices.length < 2) return;

          object.morphTargetInfluences.fill(0);
          morphTargets.push({
            influences: object.morphTargetInfluences,
            indices,
          });
        });

        const initialBounds = getVisibleMeshBounds(model);
        if (!initialBounds) {
          setStatus?.("Model loaded, but no visible meshes were found.");
          return;
        }

        const size = initialBounds.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z);
        if (maxAxis > 0) {
          const scale = 2.3 / maxAxis;
          model.scale.setScalar(scale);

          const scaledBounds = getVisibleMeshBounds(model);
          if (!scaledBounds) {
            setStatus?.("Model loaded, but bounds could not be computed.");
            return;
          }

          const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
          model.position.sub(scaledCenter);

          const centeredBounds = getVisibleMeshBounds(model);
          if (!centeredBounds) {
            setStatus?.("Model loaded, but centered bounds could not be computed.");
            return;
          }

          fittedModelSize = centeredBounds.getSize(new THREE.Vector3());
          fittedModelCenter = centeredBounds.getCenter(new THREE.Vector3());
          frameCameraToModel({
            camera,
            controls,
            rimLight,
            rimTarget,
            size: fittedModelSize,
            center: fittedModelCenter,
            fillRatio: getModelFillRatio(mount.clientWidth),
          });
          applyInitialOrbitAngles(controls, orbitProfileState);
          initialOrbitNudge = createInitialOrbitNudge(controls, orbitProfileState, { isTouch: Boolean(isTouch) });
        }

        setStatus?.("");
        setModelLoaded(true);
      },
      undefined,
      (error) => {
        console.error(error);
        setStatus?.(`Failed to load ${modelPath}`);
      },
    );

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      if (!clientWidth || !clientHeight) return;

      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      maskedComposite.setSize(clientWidth, clientHeight);

      // Keep the original framing fixed across viewport resizes.
      // Reframing here changes effective zoom because fit distance depends on aspect ratio.
    };

    resize();
    window.addEventListener("resize", resize);

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      updateMorphTargets(morphTargets, clock.getElapsedTime());
      updateOrbitEdgeSmoothing(controls, orbitProfileState);
      initialOrbitNudge = updateInitialOrbitNudge(controls, initialOrbitNudge, performance.now())
        ? initialOrbitNudge
        : null;

      if (rotationDebugRef.current) {
        const azimuthDeg = THREE.MathUtils.radToDeg(controls.getAzimuthalAngle());
        const polarDeg = THREE.MathUtils.radToDeg(controls.getPolarAngle() - Math.PI / 2);
        const modelRotX = modelRoot ? THREE.MathUtils.radToDeg(modelRoot.rotation.x) : 0;
        const modelRotY = modelRoot ? THREE.MathUtils.radToDeg(modelRoot.rotation.y) : 0;
        const modelRotZ = modelRoot ? THREE.MathUtils.radToDeg(modelRoot.rotation.z) : 0;
        const camX = camera.position.x;
        const camY = camera.position.y;
        const camZ = camera.position.z;
        const targetX = controls.target.x;
        const targetY = controls.target.y;
        const targetZ = controls.target.z;

        rotationDebugRef.current.textContent =
          `Orbit X (left/right): ${azimuthDeg.toFixed(1)}° | ` +
          `Orbit Y (up/down): ${polarDeg.toFixed(1)}° | ` +
          `Model rot (x,y,z): ${modelRotX.toFixed(1)}°, ${modelRotY.toFixed(1)}°, ${modelRotZ.toFixed(1)}° | ` +
          `Camera pos (x,y,z): ${camX.toFixed(4)}, ${camY.toFixed(4)}, ${camZ.toFixed(4)} | ` +
          `Target (x,y,z): ${targetX.toFixed(4)}, ${targetY.toFixed(4)}, ${targetZ.toFixed(4)}`;
      }

      controls.update();
      if (modelRoot) {
        maskedComposite.renderMasked(renderer, scene, camera);
      } else {
        renderer.setRenderTarget(null);
        renderer.clear(true, true, true);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", cancelInitialOrbitNudge);
      renderer.domElement.removeEventListener("wheel", cancelInitialOrbitNudge);
      renderer.domElement.removeEventListener("touchstart", cancelInitialOrbitNudge);
      controls.dispose();
      environmentMap.dispose();
      pmremGenerator.dispose();
      maskedComposite.dispose();
      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }

      scene.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose();
      });
      arcticEnvironment.dispose();
    };
  }, [createEnvironmentScene, lightsEnabled, modelPath, isTouch]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: modelLoaded ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: "easeOut" }}
    >
      <Text
        onClick={handleTextClick}
        className={styles.sectionKey}
        style={sectionKeyPositionStyle}
        text={activeSection?.sectionKey}
        typo="h2"
      />
      {
        // <div className={styles.rotationDebug}>
        // <span ref={rotationDebugRef} className={styles.rotationDebugText} />
        // <button type="button" className={styles.rotationDebugCopy} onClick={handleCopyDebug}>
        // {copied ? "Copied" : "Copy"}
        //</button>
        // </div>
      }
      <div ref={mountRef} className={styles.canvas} />
    </motion.div>
  );
}
