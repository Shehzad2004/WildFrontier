import * as THREE from 'three';
import { TimeOfDay, WeatherType } from '../types/game';

export class EnvironmentManager {
  public scene: THREE.Scene;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public campfireLight: THREE.PointLight;
  public fog: THREE.FogExp2;

  // Rain particles
  private rainParticles: THREE.Points | null = null;
  // Fireflies
  private fireflies: THREE.Points | null = null;

  public currentTime: TimeOfDay = 'noon';
  public currentWeather: WeatherType = 'clear';
  public timeCycleSeconds = 240; // 4 minutes full cycle
  private timeAccumulator = 60; // start at noon

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Atmosphere Fog
    this.fog = new THREE.FogExp2(0x8fa88a, 0.0035);
    this.scene.fog = this.fog;

    // 2. Hemisphere Light (warm sky, cool ground reflection)
    this.hemiLight = new THREE.HemisphereLight(0xbad2e0, 0x3d4a2d, 0.7);
    this.scene.add(this.hemiLight);

    // 3. Directional Sun/Moon Light with soft shadows
    this.dirLight = new THREE.DirectionalLight(0xfffae6, 1.8);
    this.dirLight.position.set(120, 240, 90);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 600;
    const shadowD = 120;
    this.dirLight.shadow.camera.left = -shadowD;
    this.dirLight.shadow.camera.right = shadowD;
    this.dirLight.shadow.camera.top = shadowD;
    this.dirLight.shadow.camera.bottom = -shadowD;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // 4. Base Campfire light
    this.campfireLight = new THREE.PointLight(0xff6600, 2.0, 25);
    this.campfireLight.position.set(0, 1.2, 0);
    this.scene.add(this.campfireLight);

    // 5. Sky Dome with smooth gradient
    this.setupSkyDome();

    // 6. Rain System
    this.setupRainSystem();

    // 7. Fireflies System
    this.setupFireflies();

    this.setTimeOfDay('noon');
  }

  private setupSkyDome() {
    const skyGeom = new THREE.SphereGeometry(650, 24, 16);
    skyGeom.scale(-1, 1, 1);

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1a3c5a');
    grad.addColorStop(0.5, '#73959c');
    grad.addColorStop(1, '#a6b89e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const skyMat = new THREE.MeshBasicMaterial({ map: texture, depthWrite: false });
    const sky = new THREE.Mesh(skyGeom, skyMat);
    sky.name = 'SkyDome';
    this.scene.add(sky);
  }

  private setupRainSystem() {
    const count = 2500;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = Math.random() * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xbed6db,
      size: 0.25,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.rainParticles = new THREE.Points(geom, mat);
    this.scene.add(this.rainParticles);
  }

  private setupFireflies() {
    const count = 120;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = 1 + Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x99ff33,
      size: 0.45,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.fireflies = new THREE.Points(geom, mat);
    this.scene.add(this.fireflies);
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.currentTime = time;

    if (time === 'dawn') {
      this.dirLight.color.setHex(0xffaa55);
      this.dirLight.intensity = 1.3;
      this.dirLight.position.set(-180, 80, -90);
      this.hemiLight.color.setHex(0xcca38f);
      this.hemiLight.groundColor.setHex(0x35281b);
      this.hemiLight.intensity = 0.5;
      this.fog.color.setHex(0xbfa58e);
      this.fog.density = 0.005;
      if (this.fireflies) (this.fireflies.material as THREE.PointsMaterial).opacity = 0.2;
    } else if (time === 'noon') {
      this.dirLight.color.setHex(0xfffae6);
      this.dirLight.intensity = 1.8;
      this.dirLight.position.set(80, 260, 60);
      this.hemiLight.color.setHex(0xbad2e0);
      this.hemiLight.groundColor.setHex(0x3d4a2d);
      this.hemiLight.intensity = 0.7;
      this.fog.color.setHex(0x8fa88a);
      this.fog.density = 0.003;
      if (this.fireflies) (this.fireflies.material as THREE.PointsMaterial).opacity = 0;
    } else if (time === 'sunset') {
      this.dirLight.color.setHex(0xff6e33);
      this.dirLight.intensity = 1.4;
      this.dirLight.position.set(180, 70, 90);
      this.hemiLight.color.setHex(0xd47a52);
      this.hemiLight.groundColor.setHex(0x281912);
      this.hemiLight.intensity = 0.55;
      this.fog.color.setHex(0xa66854);
      this.fog.density = 0.0045;
      if (this.fireflies) (this.fireflies.material as THREE.PointsMaterial).opacity = 0.4;
    } else {
      // Night
      this.dirLight.color.setHex(0x4a6a99);
      this.dirLight.intensity = 0.35;
      this.dirLight.position.set(50, 160, -70);
      this.hemiLight.color.setHex(0x19283d);
      this.hemiLight.groundColor.setHex(0x0a100d);
      this.hemiLight.intensity = 0.25;
      this.fog.color.setHex(0x0c151c);
      this.fog.density = 0.0065;
      if (this.fireflies) (this.fireflies.material as THREE.PointsMaterial).opacity = 0.85;
    }
  }

  public setWeather(weather: WeatherType) {
    this.currentWeather = weather;

    if (weather === 'rain') {
      this.fog.density = 0.008;
      this.dirLight.intensity *= 0.6;
      if (this.rainParticles) (this.rainParticles.material as THREE.PointsMaterial).opacity = 0.65;
    } else if (weather === 'mist') {
      this.fog.density = 0.012;
      if (this.rainParticles) (this.rainParticles.material as THREE.PointsMaterial).opacity = 0;
    } else {
      this.setTimeOfDay(this.currentTime);
      if (this.rainParticles) (this.rainParticles.material as THREE.PointsMaterial).opacity = 0;
    }
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    // Dynamic sun position follow around player
    this.dirLight.target.position.copy(playerPos);
    this.dirLight.target.updateMatrixWorld();

    // Campfire ember light flicker
    this.campfireLight.intensity = 1.8 + Math.sin(Date.now() * 0.008) * 0.4 + Math.random() * 0.2;

    // Follow player with rain particles
    if (this.rainParticles && this.currentWeather === 'rain') {
      this.rainParticles.position.x = playerPos.x;
      this.rainParticles.position.z = playerPos.z;
      const pos = this.rainParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - 45 * delta;
        if (y < 0) y = 60;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // Fireflies hovering around player in dark
    if (this.fireflies && (this.currentTime === 'night' || this.currentTime === 'sunset')) {
      this.fireflies.position.x = playerPos.x;
      this.fireflies.position.z = playerPos.z;
      const t = Date.now() * 0.001;
      const pos = this.fireflies.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const ox = pos.getX(i);
        const oy = pos.getY(i);
        const oz = pos.getZ(i);
        pos.setY(i, Math.max(1, oy + Math.sin(t + i) * 0.02));
      }
      pos.needsUpdate = true;
    }
  }
}
