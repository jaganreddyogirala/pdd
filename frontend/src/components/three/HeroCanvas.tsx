'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { formatAssetUrl } from '@/services/api';

interface HeroCanvasProps {
  modelUrl?: string;
}

export function HeroCanvas({ modelUrl }: HeroCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 3.2);

    // 3. WebGL Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Lighting & Environment Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);

    const accentLight = new THREE.PointLight(0x06b6d4, 1.8);
    accentLight.position.set(0, -1, 2);
    scene.add(accentLight);

    // 5. Soft Ground Shadow Plane
    const planeGeo = new THREE.PlaneGeometry(20, 20);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(planeGeo, planeMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.0;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 6. Load Real 3D Furniture Model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const targetUrl = formatAssetUrl(modelUrl || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb');

    const loader = new GLTFLoader();
    loader.load(
      targetUrl,
      (gltf) => {
        const model = gltf.scene;

        // Auto-center and normalize bounding volume
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center geometry
        model.position.x -= center.x;
        model.position.y -= box.min.y; // Align bottom with floor
        model.position.z -= center.z;

        // Auto-scale to fit hero viewport (target height ~2.0 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredScale = 2.0 / (maxDim || 1);
        model.scale.set(desiredScale, desiredScale, desiredScale);

        // Adjust shadow plane height to model bottom
        shadowPlane.position.y = 0;

        // Enable shadow casting & receiving across all meshes
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        modelGroup.add(model);
      },
      undefined,
      (err) => {
        console.warn('Failed to load 3D GLTF model:', err);
      }
    );

    // 7. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.8;
    controls.target.set(0, 0.8, 0);

    // 8. Render Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  return <div ref={containerRef} className="w-full h-full min-h-[450px]" />;
}

export default HeroCanvas;

