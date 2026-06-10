import * as THREE from "three";

function refineTexture(texture, options = {}) {
  if (!texture) return null;
  const { anisotropy = 16, colorSpace = THREE.NoColorSpace } = options;

  texture.generateMipmaps = true;
  // Trilinear filtering avoids visible mip-step pixel blocks on grazing angles.
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = anisotropy;
  texture.colorSpace = colorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createIceMaterial(sourceMaterial, options = {}) {
  const { anisotropy = 16 } = options;
  const map = refineTexture(sourceMaterial?.map ?? null, { anisotropy, colorSpace: THREE.SRGBColorSpace });
  const normalMap = refineTexture(sourceMaterial?.normalMap ?? null, { anisotropy });
  const roughnessMap = refineTexture(sourceMaterial?.roughnessMap ?? null, { anisotropy });
  const metalnessMap = refineTexture(sourceMaterial?.metalnessMap ?? null, { anisotropy });
  const aoMap = refineTexture(sourceMaterial?.aoMap ?? null, { anisotropy });
  const displacementMap = refineTexture(sourceMaterial?.displacementMap ?? null, { anisotropy });
  const alphaMap = refineTexture(sourceMaterial?.alphaMap ?? null, { anisotropy });

  const material = new THREE.MeshPhysicalMaterial({
    map,
    normalMap,
    roughnessMap,
    metalnessMap,
    aoMap,
    displacementMap,
    alphaMap,
    normalScale: new THREE.Vector2(2.2, 2.2),
    transmission: 1,
    thickness: 1.8,
    roughness: 0.6,
    metalness: 0,
    envMapIntensity: 1.5,
    clearcoat: 0.21,
    clearcoatRoughness: 0.14,
    clearcoatNormalMap: normalMap,
    clearcoatNormalScale: new THREE.Vector2(2.8, 2.8),
    ior: 1.5,
    transparent: true,
  });

  return material;
}
