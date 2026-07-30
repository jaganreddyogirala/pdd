'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Product } from '@/types';
import { ApiService, formatAssetUrl } from '@/services/api';
import { Camera, RotateCw, ZoomIn, ZoomOut, Trash2, CheckCircle2, Smartphone, Eye, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface RoomSimulatorProps {
  products: Product[];
}

export function RoomSimulatorCanvas({ products }: RoomSimulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const loadedModelRef = useRef<THREE.Group | null>(null);
  const reticleRef = useRef<THREE.Mesh | null>(null);
  const hitTestSourceRef = useRef<any>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null);
  const [isPlaced, setIsPlaced] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // WebXR AR States
  const [webxrSupported, setWebxrSupported] = useState<boolean>(false);
  const [isArActive, setIsArActive] = useState<boolean>(false);
  const [arStatusMsg, setArStatusMsg] = useState<string | null>(null);

  // Touch gesture tracking for WebXR / 3D Canvas
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartAngleRef = useRef<number | null>(null);

  // Check WebXR Immersive-AR support on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'xr' in navigator && (navigator as any).xr) {
      (navigator as any).xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setWebxrSupported(supported);
      }).catch(() => setWebxrSupported(false));
    }
  }, []);

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 650;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // 3. Renderer with WebXR enabled
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 5. Grid Helper (hidden during AR active session)
    const gridHelper = new THREE.GridHelper(20, 20, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -0.01;
    gridHelper.name = 'gridHelper';
    scene.add(gridHelper);

    // 6. Model Loading
    if (isPlaced && selectedProduct) {
      const loader = new GLTFLoader();
      const modelTargetUrl = formatAssetUrl(selectedProduct.model_display_url || selectedProduct.model_url);
      loader.load(
        modelTargetUrl,
        (gltf) => {
          const model = gltf.scene;
          const finalScale = scale * (selectedProduct.scale || 1.0);
          model.scale.set(finalScale, finalScale, finalScale);
          model.rotation.y = (rotation * Math.PI) / 180;
          model.position.set(0, 0, 0);
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          scene.add(model);
          loadedModelRef.current = model;
        },
        undefined,
        (err) => {
          console.warn('Failed to load 3D GLTF model:', err);
        }
      );
    }

    // 7. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 12;

    // 8. Animation & WebXR Frame Loop
    renderer.setAnimationLoop((time, frame) => {
      controls.update();

      // WebXR Hit Testing for AR Surface Detection
      if (renderer.xr.isPresenting && frame) {
        const refSpace = renderer.xr.getReferenceSpace();
        if (refSpace && hitTestSourceRef.current) {
          const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(refSpace);
            if (pose && reticleRef.current) {
              reticleRef.current.visible = true;
              reticleRef.current.matrix.fromArray(pose.transform.matrix);
            }
          } else if (reticleRef.current) {
            reticleRef.current.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    });

    // 9. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isPlaced, selectedProduct, scale, rotation]);

  // Place Model helper function for WebXR tap or button click
  const placeModelAtTransform = useCallback(
    async (matrix?: THREE.Matrix4) => {
      if (!selectedProduct || !sceneRef.current) return;
      setIsPlaced(true);

      const loader = new GLTFLoader();
      const modelTargetUrl = formatAssetUrl(selectedProduct.model_display_url || selectedProduct.model_url);
      loader.load(modelTargetUrl, (gltf) => {
        const model = gltf.scene;
        const finalScale = scale * (selectedProduct.scale || 1.0);
        model.scale.set(finalScale, finalScale, finalScale);

        if (matrix) {
          model.position.setFromMatrixPosition(matrix);
          model.quaternion.setFromRotationMatrix(matrix);
        } else {
          model.position.set(0, 0, 0);
        }

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        sceneRef.current?.add(model);
        loadedModelRef.current = model;
      });

      const newSessionId = await ApiService.startSession(
        selectedProduct.product_id,
        selectedProduct.name,
        selectedProduct.model_url,
        scale
      );
      setSessionId(newSessionId);
    },
    [selectedProduct, scale]
  );

  const handlePlace = () => {
    placeModelAtTransform();
  };

  // Launch WebXR Immersive-AR Session
  const startWebXRAR = async () => {
    if (typeof window === 'undefined' || !(navigator as any).xr || !selectedProduct) return;

    try {
      setArStatusMsg('Requesting WebXR Camera Passthrough...');
      const session = await (navigator as any).xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'local-floor'],
        domOverlay: containerRef.current ? { root: containerRef.current } : undefined,
      });

      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      if (!renderer || !scene) return;

      renderer.xr.enabled = true;
      await renderer.xr.setSession(session);
      setIsArActive(true);
      setArStatusMsg('Point phone camera at floor plane to detect surface');

      // Hide grid helper in AR mode
      const grid = scene.getObjectByName('gridHelper');
      if (grid) grid.visible = false;

      // Setup Reference Space and Hit Test Source
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const refSpace = await session.requestReferenceSpace('local');
      hitTestSourceRef.current = await session.requestHitTestSource({ space: viewerSpace });

      // Create Reticle Placement Ring
      const ringGeo = new THREE.RingGeometry(0.12, 0.18, 32).rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
      const reticleMesh = new THREE.Mesh(ringGeo, ringMat);
      reticleMesh.matrixAutoUpdate = false;
      reticleMesh.visible = false;
      scene.add(reticleMesh);
      reticleRef.current = reticleMesh;

      // Select / Tap-to-place event listener
      const onSelect = () => {
        if (reticleRef.current && reticleRef.current.visible) {
          placeModelAtTransform(reticleRef.current.matrix);
          setArStatusMsg('Furniture placed on surface! Drag/Pinch to adjust');
        }
      };
      session.addEventListener('select', onSelect);

      // Session End handler
      session.addEventListener('end', () => {
        setIsArActive(false);
        setArStatusMsg(null);
        if (rendererRef.current) rendererRef.current.xr.enabled = false;
        if (reticleRef.current) reticleRef.current.visible = false;
        if (grid) grid.visible = true;
      });
    } catch (err: any) {
      console.warn('WebXR AR launch error:', err);
      setArStatusMsg('WebXR AR not supported on this device. Fallback to 3D Simulator active.');
      setTimeout(() => setArStatusMsg(null), 4000);
    }
  };

  // Touch gesture handlers for Pinch-to-scale & Twist-to-rotate
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (touchStartDistRef.current !== null) {
        const delta = dist - touchStartDistRef.current;
        if (Math.abs(delta) > 10) {
          setScale((s) => Math.min(2.5, Math.max(0.4, s + delta * 0.005)));
          touchStartDistRef.current = dist;
        }
      } else {
        touchStartDistRef.current = dist;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    touchStartAngleRef.current = null;
  };

  // Capture snapshot & upload to Django API
  const handleCapture = async () => {
    if (!sessionId || !rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/jpeg', 0.85);
    const res = await ApiService.saveCapture(sessionId, dataUrl);
    setSnapshotMsg(res.message || 'Snapshot saved to Django backend!');
    setTimeout(() => setSnapshotMsg(null), 3000);
  };

  return (
    <div
      className="relative w-full h-[650px] rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Three.js / WebXR WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* AR Status Message Banner */}
      {arStatusMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-black/85 backdrop-blur-md px-4 py-2 rounded-full border border-cyan-500/40 text-cyan-400 text-xs font-bold shadow-xl animate-pulse flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" /> {arStatusMsg}
        </div>
      )}

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 pointer-events-auto flex items-center gap-3">
          <span className="text-xs font-bold text-white">Select Product:</span>
          <select
            value={selectedProduct?.product_id || ''}
            onChange={(e) => {
              const p = products.find((prod) => prod.product_id === e.target.value);
              setSelectedProduct(p || null);
              setIsPlaced(false);
            }}
            className="bg-slate-900 text-xs text-slate-200 border border-white/10 rounded-lg px-2.5 py-1 outline-none focus:border-blue-500"
          >
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.name} ({p.surface_type || 'floor'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {webxrSupported && !isArActive && (
            <button
              onClick={startWebXRAR}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Smartphone className="w-4 h-4" /> Enter Immersive WebAR
            </button>
          )}

          {sessionId && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Session: {sessionId.substring(0, 10)}...
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Placement & Controls */}
      <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-4 z-10">
        {!isPlaced ? (
          <div className="w-full flex items-center gap-3">
            <button
              onClick={handlePlace}
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/30 transition-all text-center"
            >
              Place 3D Model in Room
            </button>

            {/* Mobile AR QR Button */}
            <button
              onClick={() => setShowQrModal(true)}
              className="py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2"
              title="Scan QR code on mobile camera to launch camera AR"
            >
              <QrCode className="w-4 h-4" /> Mobile AR (QR)
            </button>

            {webxrSupported && (
              <button
                onClick={startWebXRAR}
                className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/10 transition-all flex items-center gap-2"
                title="Launch WebXR Camera Passthrough AR"
              >
                <Smartphone className="w-4 h-4" /> WebAR Camera
              </button>
            )}
          </div>
        ) : (
          <div className="w-full bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRotation((r) => r + 45)}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-400" /> Rotate 45°
              </button>
              <button
                onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScale((s) => Math.max(0.4, s - 0.1))}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaced(false)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/10 flex items-center gap-1.5 transition-all"
              >
                <QrCode className="w-3.5 h-3.5 text-cyan-400" /> Mobile AR (QR)
              </button>
              <button
                onClick={handleCapture}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <Camera className="w-4 h-4" /> Save Snapshot to Django
              </button>
            </div>
          </div>
        )}

        {snapshotMsg && (
          <div className="absolute top-[-48px] right-0 bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg animate-bounce">
            {snapshotMsg}
          </div>
        )}
      </div>

      {/* QR Code Modal Overlay */}
      {showQrModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#07090e] border border-white/15 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 relative shadow-2xl">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/20 mb-2">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Scan for Mobile AR</h3>
              <p className="text-xs text-slate-400">Scan this QR code using your phone camera to view {selectedProduct.name} in your room.</p>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mx-auto">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/ar/${selectedProduct.product_id}`}
                size={180}
                fgColor="#07090e"
                bgColor="#ffffff"
                level="H"
              />
            </div>

            <div className="text-[11px] text-slate-400 space-y-1 font-mono bg-white/5 p-3 rounded-xl border border-white/5">
              <div>Android ARCore & iOS Quick Look Enabled</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomSimulatorCanvas;

