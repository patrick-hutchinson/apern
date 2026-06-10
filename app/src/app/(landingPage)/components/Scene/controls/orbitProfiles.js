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

const INITIAL_NUDGE = {
  desktopAzimuth: 15,
  touchAzimuth: 21,
  dampingMultiplier: 1 / 3,
  desktopDurationMs: 4800,
  touchDurationMs: 5400,
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

export function createInitialOrbitNudge(controls, profileState, options = {}) {
  if (!profileState?.limits) return null;

  const { isTouch = false } = options;
  const currentAzimuth = THREE.MathUtils.radToDeg(controls.getAzimuthalAngle());
  const requestedOffset = isTouch ? INITIAL_NUDGE.touchAzimuth : INITIAL_NUDGE.desktopAzimuth;
  const roomRight = profileState.limits.maxAzimuth - currentAzimuth;
  const roomLeft = currentAzimuth - profileState.limits.minAzimuth;
  const direction = roomRight >= requestedOffset || roomRight >= roomLeft ? 1 : -1;
  const availableOffset = direction > 0 ? roomRight : roomLeft;
  const azimuthOffset = Math.min(requestedOffset, availableOffset);

  if (azimuthOffset < 1) return null;

  return {
    startedAt: null,
    targetAzimuth: currentAzimuth + direction * azimuthOffset,
    polar: controls.getPolarAngle(),
    damping: profileState.baseDamping * INITIAL_NUDGE.dampingMultiplier,
    maxDurationMs: isTouch ? INITIAL_NUDGE.touchDurationMs : INITIAL_NUDGE.desktopDurationMs,
  };
}

export function updateInitialOrbitNudge(controls, nudge, nowMs) {
  if (!nudge) return false;
  if (nudge.startedAt === null) {
    nudge.startedAt = nowMs;
  }

  const elapsedMs = nowMs - nudge.startedAt;
  const currentAzimuth = THREE.MathUtils.radToDeg(controls.getAzimuthalAngle());
  const remainingAzimuth = nudge.targetAzimuth - currentAzimuth;

  if (elapsedMs >= nudge.maxDurationMs || Math.abs(remainingAzimuth) < 0.05) {
    return false;
  }

  const nextAzimuth = currentAzimuth + remainingAzimuth * nudge.damping;
  setOrbitAngles(controls, THREE.MathUtils.degToRad(nextAzimuth), nudge.polar);
  return true;
}

export function updateOrbitEdgeSmoothing(controls, profileState) {
  if (!profileState?.limits) return;
  // Keep interaction uniformly heavy across the entire allowed range.
  controls.rotateSpeed = profileState.rotateSpeed;
  controls.dampingFactor = profileState.baseDamping;
}
