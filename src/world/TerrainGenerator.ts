import * as THREE from 'three';

export interface TerrainConfig {
  size: number;
  segments: number;
  waterLevel: number;
}

export class TerrainGenerator {
  public readonly size = 1200;
  public readonly segments = 128;
  public readonly waterLevel = 1.6;

  // Key POIs
  public readonly POIs = {
    camp: { name: 'Hunter Base Camp', pos: new THREE.Vector3(0, 0, 0), desc: 'Cabin, supply crates, vehicle depot' },
    watchtower: { name: 'High Lookout Tower', pos: new THREE.Vector3(45, 0, -50), desc: 'Panoramic view of northern canopy' },
    riverCrossing: { name: 'River Ford Crossing', pos: new THREE.Vector3(-120, 0, 160), desc: 'Shallow crossing suitable for vehicles' },
    ruins: { name: 'Overgrown Jungle Ruins', pos: new THREE.Vector3(260, 0, -220), desc: 'Ancient stone temple, tiger territory' },
    highland: { name: 'Frontier Ridge Crest', pos: new THREE.Vector3(-280, 0, -240), desc: 'High elevation rocky overlook' },
    crocLagoon: { name: 'Mangrove Crocodile Shallows', pos: new THREE.Vector3(180, 0, 240), desc: 'Murky waters, dangerous predators' },
  };

  constructor() {
    // Update Y coordinates of POIs to match terrain
    for (const key of Object.keys(this.POIs) as (keyof typeof this.POIs)[]) {
      const poi = this.POIs[key];
      poi.pos.y = this.getHeight(poi.pos.x, poi.pos.z);
    }
  }

  /**
   * Fast, analytical height calculation at any (x, z)
   */
  public getHeight(x: number, z: number): number {
    // Base rolling hills
    const d0 = Math.sin(x * 0.005) * Math.cos(z * 0.005) * 14;
    const d1 = Math.sin(x * 0.012 + 1.2) * Math.cos(z * 0.015 - 0.4) * 7;
    const d2 = Math.sin(x * 0.03 + 2.1) * Math.cos(z * 0.028 + 1.8) * 3;

    // Highland ridge in South-West (x < -100, z < -100)
    const distToHighland = Math.hypot(x - (-280), z - (-240));
    const highlandBoost = Math.max(0, (1 - distToHighland / 220)) * 32;

    // Ruins hill in North-East (x ~ 260, z ~ -220)
    const distToRuins = Math.hypot(x - 260, z - (-220));
    const ruinsBoost = Math.max(0, (1 - distToRuins / 180)) * 18;

    // Meandering riverbed from North-West down to South-East
    // River path equation: x_river = sin(z * 0.008) * 140 - 20
    const riverCenter = Math.sin(z * 0.007) * 160 - 30;
    const distToRiver = Math.abs(x - riverCenter);
    let riverCarve = 0;
    if (distToRiver < 55) {
      const riverFactor = Math.cos((distToRiver / 55) * (Math.PI / 2));
      riverCarve = riverFactor * 16;
    }

    // Hunter camp clearing flatness at (0, 0)
    const distToCamp = Math.hypot(x, z);
    const campFlatten = Math.min(1, distToCamp / 80);

    let rawHeight = (d0 + d1 + d2 + highlandBoost + ruinsBoost) * campFlatten - riverCarve;

    // Prevent deep holes under water level
    if (rawHeight < this.waterLevel - 3.5) {
      rawHeight = this.waterLevel - 3.5;
    }

    return rawHeight;
  }

  /**
   * Compute surface normal at (x, z)
   */
  public getNormal(x: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
    const eps = 0.5;
    const hL = this.getHeight(x - eps, z);
    const hR = this.getHeight(x + eps, z);
    const hD = this.getHeight(x, z - eps);
    const hU = this.getHeight(x, z + eps);

    out.set(hL - hR, 2 * eps, hD - hU).normalize();
    return out;
  }

  /**
   * Check if position is in water and return depth
   */
  public getWaterDepth(x: number, z: number): number {
    const groundH = this.getHeight(x, z);
    if (groundH < this.waterLevel) {
      return this.waterLevel - groundH;
    }
    return 0;
  }

  /**
   * Determine surface biome type at (x, z)
   */
  public getSurfaceType(x: number, z: number): 'grass' | 'mud' | 'rock' | 'water' {
    const depth = this.getWaterDepth(x, z);
    if (depth > 0.1) return 'water';

    // Steep slope = rock
    const norm = this.getNormal(x, z);
    if (norm.y < 0.72) return 'rock';

    // Near river edge or vehicle trails = mud
    const riverCenter = Math.sin(z * 0.007) * 160 - 30;
    const distToRiver = Math.abs(x - riverCenter);
    if (distToRiver < 65) return 'mud';

    // Base camp dirt track
    const distToCamp = Math.hypot(x, z);
    if (distToCamp < 35) return 'mud';

    return 'grass';
  }

  /**
   * Generate procedural PBR terrain textures via Canvas
   */
  public createTerrainTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base lush jungle ground
    ctx.fillStyle = '#2c431b';
    ctx.fillRect(0, 0, 1024, 1024);

    // Layered procedural detail
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const d = imgData.data;

    for (let py = 0; py < 1024; py++) {
      const zWorld = (py / 1024 - 0.5) * this.size;
      for (let px = 0; px < 1024; px++) {
        const xWorld = (px / 1024 - 0.5) * this.size;
        const i = (py * 1024 + px) * 4;

        const surface = this.getSurfaceType(xWorld, zWorld);
        const noise = (Math.sin(px * 0.1) * Math.cos(py * 0.1) + Math.random() * 0.5) * 20;

        if (surface === 'water' || surface === 'mud') {
          // Wet dark mud & river silt
          d[i] = Math.min(255, 68 + noise * 0.8);
          d[i + 1] = Math.min(255, 48 + noise * 0.6);
          d[i + 2] = Math.min(255, 32 + noise * 0.5);
        } else if (surface === 'rock') {
          // Grey granite & jungle moss
          d[i] = Math.min(255, 85 + noise);
          d[i + 1] = Math.min(255, 90 + noise);
          d[i + 2] = Math.min(255, 78 + noise * 0.8);
        } else {
          // Lush tropical rainforest grass & fallen leaves
          const leafVariation = (Math.sin(px * 0.05) + Math.cos(py * 0.05)) * 15;
          d[i] = Math.min(255, 36 + leafVariation + noise * 0.3);
          d[i + 1] = Math.min(255, 72 + leafVariation * 1.2 + noise * 0.5);
          d[i + 2] = Math.min(255, 24 + leafVariation * 0.5 + noise * 0.2);
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Build the 3D terrain mesh geometry
   */
  public buildTerrainMesh(): THREE.Mesh {
    const geom = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeight(x, z);
      pos.setY(i, y);
    }
    geom.computeVertexNormals();

    const texture = this.createTerrainTexture();
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.08,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geom, material);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.name = 'TerrainMesh';
    return mesh;
  }

  /**
   * Build flowing jungle river mesh
   */
  public buildWaterMesh(): THREE.Mesh {
    const geom = new THREE.PlaneGeometry(this.size, this.size, 64, 64);
    geom.rotateX(-Math.PI / 2);

    // River water material with tropical turquoise / emerald depth and high specularity
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a6b68,
      roughness: 0.12,
      metalness: 0.15,
      transparent: true,
      opacity: 0.82,
    });

    const mesh = new THREE.Mesh(geom, material);
    mesh.position.y = this.waterLevel;
    mesh.receiveShadow = true;
    mesh.name = 'WaterMesh';
    return mesh;
  }
}
