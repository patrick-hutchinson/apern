import * as THREE from "three";

const MODEL_PROFILES = {
  "/assets/models/13/13-optimized.glb": {
    limits: {
      minAzimuth: -167.5,
      maxAzimuth: -16.6,
      minOrbitY: -23.9,
      maxOrbitY: 10.0,
    },
    initial: {
      azimuth: -73.7,
      orbitY: -20.0,
    },
  },
  "/assets/models/01/01-optimized.glb": {
    limits: {
      minAzimuth: -50,
      maxAzimuth: 50,
      minOrbitY: -50,
      maxOrbitY: 50,
    },
  },
  "/assets/models/14/14-optimized.glb": {
    limits: {
      minAzimuth: 43.2,
      maxAzimuth: 117.6,
      minOrbitY: -28.4,
      maxOrbitY: 15.4,
    },
    initial: {
      azimuth: 76.9,
      orbitY: 7.2,
    },
  },
  "/assets/models/16/16-optimized.glb": {
    limits: {
      minAzimuth: -72.0,
      maxAzimuth: -19.3,
      minOrbitY: -36.5,
      maxOrbitY: 25.6,
    },
    initial: {
      azimuth: -48.25,
      orbitY: -5.45,
    },
  },
};

const DEFAULTS = {
  // Easier drag + shorter glide on release.
  rotateSpeed: 0.14,
  baseDamping: 0.04,
  edgeDamping: 0.02,
};

const TOUCH_DEFAULTS = {
  // Keep touch easier than desktop but reduce post-drag slide.
  rotateSpeed: 0.52,
  baseDamping: 0.024,
  edgeDamping: 0.024,
};

function orbitYToPolar(orbitYDeg) {
  return THREE.MathUtils.degToRad(90 + orbitYDeg);
}

export function setOrbitAngles(controls, azimuthRad, polarRad) {
  if (typeof controls.setAzimuthalAngle === "function" && typeof controls.setPolarAngle === "function") {
    controls.setAzimuthalAngle(azimuthRad);
    controls.setPolarAngle(polarRad);
    controls.update();
    return;
  }

  const target = controls.target;
  const radius = Math.max(controls.object.position.distanceTo(target), 1e-6);
  const sinPhiRadius = Math.sin(polarRad) * radius;

  controls.object.position.set(
    target.x + sinPhiRadius * Math.sin(azimuthRad),
    target.y + Math.cos(polarRad) * radius,
    target.z + sinPhiRadius * Math.cos(azimuthRad),
  );
  controls.object.lookAt(target);
  controls.update();
}

export function getModelOrbitProfile(modelPath) {
  return MODEL_PROFILES[modelPath] ?? null;
}

export function applyOrbitControlsProfile(controls, modelPath, options = {}) {
  const { isTouch = false } = options;
  const profile = getModelOrbitProfile(modelPath);
  const interaction = isTouch ? TOUCH_DEFAULTS : DEFAULTS;

  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.rotateSpeed = interaction.rotateSpeed;
  controls.dampingFactor = interaction.baseDamping;

  if (!profile) {
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    return null;
  }

  if (!profile.limits) {
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    return {
      ...interaction,
      limits: null,
      initial: profile.initial ?? null,
    };
  }

  controls.minAzimuthAngle = THREE.MathUtils.degToRad(profile.limits.minAzimuth);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(profile.limits.maxAzimuth);
  controls.minPolarAngle = orbitYToPolar(profile.limits.minOrbitY);
  controls.maxPolarAngle = orbitYToPolar(profile.limits.maxOrbitY);

  return {
    ...interaction,
    limits: profile.limits,
    initial: profile.initial ?? null,
  };
}

export function applyInitialOrbitAngles(controls, profileState) {
  if (!profileState?.initial) return;
  setOrbitAngles(
    controls,
    THREE.MathUtils.degToRad(profileState.initial.azimuth),
    orbitYToPolar(profileState.initial.orbitY),
  );
}

export function updateOrbitEdgeSmoothing(controls, profileState) {
  if (!profileState?.limits) return;
  // Keep interaction uniformly heavy across the entire allowed range.
  controls.rotateSpeed = profileState.rotateSpeed;
  controls.dampingFactor = profileState.baseDamping;
}
