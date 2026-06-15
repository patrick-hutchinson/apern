import * as THREE from "three";

export function createHDRI() {
  const scene = new THREE.Scene();

  const skyGeometry = new THREE.SphereGeometry(30, 64, 64);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      // Black-dominant grayscale palette.
      topColor: { value: new THREE.Color(0xb2b2b2) },
      horizonColor: { value: new THREE.Color(0x5a5a5a) },
      bottomColor: { value: new THREE.Color(0x080808) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      void main() {
        float h = normalize(vWorldPosition).y * 0.5 + 0.5;
        vec3 dir = normalize(vWorldPosition);
        vec3 color = mix(bottomColor, horizonColor, smoothstep(0.02, 0.5, h));
        color = mix(color, topColor, smoothstep(0.5, 1.0, h));

        // Add bright spot clusters for higher-contrast, glacial-feeling highlights.
        float spotA = smoothstep(0.82, 1.0, hash(dir * 18.0));
        float spotB = smoothstep(0.88, 1.0, hash(dir.yzx * 31.0));
        float spotMask = clamp(spotA * 0.95 + spotB * 1.15, 0.0, 1.0);
        float horizonBoost = smoothstep(0.25, 0.9, h);
        color += vec3(1.12) * spotMask * horizonBoost;

        // Slight contrast push while keeping dark dominance.
        color = clamp((color - 0.5) * 1.1 + 0.5, 0.0, 1.0);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);

  const iceGeo = new THREE.IcosahedronGeometry(1, 1);
  const iceMat = new THREE.MeshStandardMaterial({
    color: 0x7f7f7f,
    metalness: 0,
    roughness: 0.35,
    emissive: 0x0a0a0a,
    emissiveIntensity: 0.08,
  });
  const greyIceMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0,
    roughness: 0.5,
    emissive: 0x030303,
    emissiveIntensity: 0.03,
  });

  const iceCluster = new THREE.Group();
  const icePositions = [
    [3.2, -0.7, -4.2, 1.2],
    [-4.1, -1.1, -3.6, 1.35],
    [0.8, -1.6, -5.0, 1.6],
    [-2.0, -0.4, 4.1, 1.0],
    [2.8, -1.2, 3.5, 1.25],
    [0.0, -1.9, 2.9, 1.1],
  ];
  const greyIcePositions = [
    [0.86, 4.25, 0.81, 1.08],
    [2.1, 2.75, -0.55, 1.16],
  ];

  const addIceMesh = ([x, y, z, s], material) => {
    const m = new THREE.Mesh(iceGeo, material);
    m.position.set(x, y, z);
    m.scale.setScalar(s);
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    iceCluster.add(m);
  };

  icePositions.forEach((position) => addIceMesh(position, iceMat));
  greyIcePositions.forEach((position) => addIceMesh(position, greyIceMat));
  scene.add(iceCluster);

  const envKey = new THREE.DirectionalLight(0xffffff, 4.8);
  envKey.position.set(3, 6, 2);
  scene.add(envKey);

  const envFill = new THREE.HemisphereLight(0xbdbdbd, 0x070707, 0.95);
  scene.add(envFill);

  const dispose = () => {
    sky.geometry.dispose();
    sky.material.dispose();
    iceGeo.dispose();
    iceMat.dispose();
    greyIceMat.dispose();
  };

  return { scene, dispose };
}
