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
      azimuth: -117.8,
      orbitY: -9.8,
    },
    fixedDistance: 2.0296,
  },
  "/assets/models/01/01-optimized.glb": {
    limits: {
      minAzimuth: -50,
      maxAzimuth: 50,
      minOrbitY: -50,
      maxOrbitY: 50,
    },
  },
  "/assets/models/14/model.glb": {
    limits: {
      minAzimuth: 131.5,
      maxAzimuth: -111.2,
      minOrbitY: -11.0,
      maxOrbitY: 74.8,
    },
    initial: {
      azimuth: -164.5,
      orbitY: 25.8,
      target: {
        x: -0.0506,
        y: 0.125,
        z: -0.0288,
      },
    },
    fixedDistance: 1.6737,
  },
  "/assets/models/16/16-optimized.glb": {
    limits: {
      minAzimuth: -69.7,
      maxAzimuth: 25.1,
      minOrbitY: -34.8,
      maxOrbitY: 51.3,
    },
    initial: {
      azimuth: -22.3,
      orbitY: 8.25,
    },
    fixedDistance: 2.319,
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

export function setOrbitAngles(controls, azimuthRad, polarRad, radiusOverride) {
  if (typeof controls.setAzimuthalAngle === "function" && typeof controls.setPolarAngle === "function") {
    if (typeof radiusOverride === "number" && Number.isFinite(radiusOverride)) {
      const offset = controls.object.position.clone().sub(controls.target);
      const currentRadius = Math.max(offset.length(), 1e-6);
      offset.multiplyScalar(radiusOverride / currentRadius);
      controls.object.position.copy(controls.target).add(offset);
    }
    controls.setAzimuthalAngle(azimuthRad);
    controls.setPolarAngle(polarRad);
    controls.update();
    return;
  }

  const target = controls.target;
  const radius = Math.max(radiusOverride ?? controls.object.position.distanceTo(target), 1e-6);
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
  controls.enableZoom = true;
  controls.enablePan = true;
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
      fixedDistance: profile.fixedDistance ?? null,
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
    fixedDistance: profile.fixedDistance ?? null,
  };
}

export function applyInitialOrbitAngles(controls, profileState) {
  if (!profileState?.initial) return;
  if (profileState.initial.target) {
    controls.target.set(
      profileState.initial.target.x,
      profileState.initial.target.y,
      profileState.initial.target.z,
    );
  }
  setOrbitAngles(
    controls,
    THREE.MathUtils.degToRad(profileState.initial.azimuth),
    orbitYToPolar(profileState.initial.orbitY),
    profileState.fixedDistance ?? undefined,
  );
}

export function createInitialOrbitNudge(controls, profileState, options = {}) {
  if (!profileState?.limits) return null;
  if (profileState.limits.minAzimuth > profileState.limits.maxAzimuth) return null;

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
