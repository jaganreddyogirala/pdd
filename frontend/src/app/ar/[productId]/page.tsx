'use client';

import { useEffect, useRef, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ApiService, formatAssetUrl } from '@/services/api';
import { Product } from '@/types';
import {
  Smartphone,
  Camera,
  ArrowLeft,
  CheckCircle2,
  Box,
  Eye,
  Sparkles,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';

// AR Capture Components
import BackButton from '@/components/ar/BackButton';
import CaptureButton from '@/components/ar/CaptureButton';
import CapturedImagesButton from '@/components/ar/CapturedImagesButton';
import GalleryModal from '@/components/ar/GalleryModal';
import {
  fetchCaptures,
  uploadCapture,
  deleteCapture,
  type ARCaptureResponse,
  type CaptureMetadata,
} from '@/services/arCaptureService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Tracks the state of an active touch gesture */
interface GestureState {
  /** How many fingers are currently touching */
  activeTouches: number;

  // ── One-finger state ──────────────────────────────────────────────────────
  /** Timestamp of the first touch-down (for tap detection) */
  tapStartTime: number;
  /** Starting screen X of the first touch */
  tapStartX: number;
  /** Starting screen Y of the first touch */
  tapStartY: number;
  /** Whether the single finger has moved enough to be considered a drag */
  isDragging: boolean;

  // ── Two-finger state ──────────────────────────────────────────────────────
  /** Pixel distance between the two fingers at the start of the gesture */
  initialPinchDistance: number;
  /** Angle (radians) between the two fingers at the start of the gesture */
  initialPinchAngle: number;
  /** Scale of the selected model at the start of the pinch */
  initialModelScale: number;
  /** Y rotation of the selected model at the start of the twist */
  initialModelRotationY: number;
}

/** A lightweight snapshot of a single Touch point */
interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum pixel movement allowed for a touch to still be classified as a tap */
const TAP_MOVE_THRESHOLD_PX = 10;
/** Maximum duration (ms) for a touch to still be classified as a tap */
const TAP_DURATION_MS = 200;
/** Minimum scale the model can be shrunk to */
const MIN_MODEL_SCALE = 0.05;
/** Maximum scale the model can be grown to */
const MAX_MODEL_SCALE = 8.0;
/** Emissive colour applied to meshes when the model is selected */
const SELECTION_EMISSIVE_COLOR = new THREE.Color(0x1a3a5c);
/** Emissive intensity when selected */
const SELECTION_EMISSIVE_INTENSITY = 0.5;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Euclidean distance between two touch points */
function getTouchDistance(a: TouchPoint, b: TouchPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Angle (radians) of the line from touch a to touch b */
function getTouchAngle(a: TouchPoint, b: TouchPoint): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/** Clamp a number between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Apply or remove the selection highlight from every mesh in a model.
 * For MeshStandardMaterial / MeshPhysicalMaterial the emissive channel is used.
 * Other material types are silently skipped.
 */
function setModelHighlight(model: THREE.Group, selected: boolean): void {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material;
      // Handle arrays of materials (multi-material meshes)
      const materials: THREE.Material[] = Array.isArray(mat) ? mat : [mat];
      materials.forEach((m) => {
        if (
          m instanceof THREE.MeshStandardMaterial ||
          m instanceof THREE.MeshPhysicalMaterial
        ) {
          if (selected) {
            m.emissive.copy(SELECTION_EMISSIVE_COLOR);
            m.emissiveIntensity = SELECTION_EMISSIVE_INTENSITY;
          } else {
            m.emissive.set(0x000000);
            m.emissiveIntensity = 0;
          }
        }
      });
    }
  });
}

/**
 * Dispose all geometries and materials in a Three.js Group recursively,
 * then remove it from its parent. Prevents GPU memory leaks.
 */
function disposeGroup(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      const mat = child.material;
      const materials: THREE.Material[] = Array.isArray(mat) ? mat : [mat];
      materials.forEach((m) => m.dispose());
    }
  });
  group.parent?.remove(group);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MobileARPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);

  // ── DOM Refs ───────────────────────────────────────────────────────────────
  /** The div that hosts the Three.js canvas and acts as the DOM overlay */
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Three.js Refs ──────────────────────────────────────────────────────────
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  /** The reticle ring shown on detected floor surfaces */
  const reticleRef = useRef<THREE.Mesh | null>(null);

  // ── WebXR Refs ─────────────────────────────────────────────────────────────
  /** Native XRHitTestSource from the active session */
  const hitTestSourceRef = useRef<any>(null);
  /** The active XRSession (held so we can end it on cleanup) */
  const xrSessionRef = useRef<any>(null);

  // ── Model Refs ─────────────────────────────────────────────────────────────
  /**
   * The GLTF scene loaded from the network — loaded ONCE and cached here.
   * Placements clone this instead of re-downloading.
   */
  const cachedGltfRef = useRef<THREE.Group | null>(null);
  /** Is the GLTF currently being loaded from the network? */
  const gltfLoadingRef = useRef<boolean>(false);
  /** The single placed model instance in the AR scene (null if not yet placed) */
  const placedModelRef = useRef<THREE.Group | null>(null);
  /** The currently selected model (subset of placedModelRef) */
  const selectedModelRef = useRef<THREE.Group | null>(null);
  /** Base scale factor from the product API (product.scale) */
  const productScaleRef = useRef<number>(1.0);

  // ── Gesture State Ref ─────────────────────────────────────────────────────
  const gestureRef = useRef<GestureState>({
    activeTouches: 0,
    tapStartTime: 0,
    tapStartX: 0,
    tapStartY: 0,
    isDragging: false,
    initialPinchDistance: 0,
    initialPinchAngle: 0,
    initialModelScale: 1,
    initialModelRotationY: 0,
  });

  // ── React State (UI only) ──────────────────────────────────────────────────
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [webxrSupported, setWebxrSupported] = useState<boolean>(false);
  const [isArActive, setIsArActive] = useState<boolean>(false);
  const [isPlaced, setIsPlaced] = useState<boolean>(false);
  const [arStatusMsg, setArStatusMsg] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);

  // ── AR Capture State ──────────────────────────────────────────────────────
  const [captures, setCaptures] = useState<ARCaptureResponse[]>([]);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [showCaptureSuccess, setShowCaptureSuccess] = useState<boolean>(false);

  // ── Router ─────────────────────────────────────────────────────────────────
  const router = useRouter();

  // ─────────────────────────────────────────────────────────────────────────
  // Effect 1: WebXR support check + product fetch
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'xr' in navigator &&
      (navigator as any).xr
    ) {
      (navigator as any).xr
        .isSessionSupported('immersive-ar')
        .then((supported: boolean) => setWebxrSupported(supported))
        .catch(() => setWebxrSupported(false));
    }

    setLoading(true);
    ApiService.getProductDetails(productId)
      .then((prod: Product | null) => {
        setProduct(prod);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch product:', err);
        setLoading(false);
      });
  }, [productId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect 2: Build Three.js renderer + scene (runs once product is ready)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !product) return;
    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
    camera.position.set(0, 1.5, 3);
    cameraRef.current = camera;

    // Renderer — alpha:true so the camera passthrough shows through
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    // Mount canvas
    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // ── Animation Loop ───────────────────────────────────────────────────────
    renderer.setAnimationLoop((_time, frame) => {
      if (renderer.xr.isPresenting && frame) {
        const refSpace = renderer.xr.getReferenceSpace();

        // Update reticle from hit-test results
        if (refSpace && hitTestSourceRef.current) {
          const hitResults = frame.getHitTestResults(hitTestSourceRef.current);
          if (hitResults.length > 0) {
            const hit = hitResults[0];
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

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [product]);

  // ─────────────────────────────────────────────────────────────────────────
  // Effect 3: Pre-load GLTF once (cached in cachedGltfRef)
  // Runs whenever product becomes available. Never reloads if already cached.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!product) return;
    if (cachedGltfRef.current || gltfLoadingRef.current) return; // already loaded or loading

    const url = formatAssetUrl(
      product.model_display_url || product.model_url || ''
    );
    if (!url) {
      console.warn('No model URL available for product:', product.product_id);
      return;
    }

    gltfLoadingRef.current = true;
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        cachedGltfRef.current = gltf.scene;
        gltfLoadingRef.current = false;
        productScaleRef.current = product.scale || 1.0;
        console.log('[AR] GLTF model cached successfully:', url);
      },
      undefined,
      (err) => {
        gltfLoadingRef.current = false;
        console.error('[AR] Failed to load GLTF model:', err);
        setArStatusMsg('Failed to load 3D model. Check model URL.');
      }
    );
  }, [product]);

  // ─────────────────────────────────────────────────────────────────────────
  // Placement Helper
  // Clones the cached GLTF and adds it to the scene at the reticle position.
  // Guards against double-placement.
  // ─────────────────────────────────────────────────────────────────────────
  const placeModel = useCallback(() => {
    // Guard: only place if we have everything we need
    if (!reticleRef.current?.visible) return;
    if (!sceneRef.current) return;
    if (!cachedGltfRef.current) {
      setArStatusMsg('Model still loading — please wait a moment.');
      return;
    }

    // Guard: only one instance allowed
    if (placedModelRef.current !== null) {
      console.log('[AR] Model already placed — ignoring duplicate placement.');
      return;
    }

    // Clone the cached scene (deep clone preserves materials, animations, etc.)
    const modelClone = cachedGltfRef.current.clone(true);

    // Apply product scale + current user scale
    const finalScale = productScaleRef.current;
    modelClone.scale.set(finalScale, finalScale, finalScale);

    // Position at reticle location
    modelClone.position.setFromMatrixPosition(reticleRef.current.matrix);
    modelClone.quaternion.setFromRotationMatrix(reticleRef.current.matrix);

    sceneRef.current.add(modelClone);
    placedModelRef.current = modelClone;

    setIsPlaced(true);
    setArStatusMsg(
      'Furniture placed! Tap it to select, then pinch/twist to resize/rotate.'
    );

    console.log('[AR] Model placed at:', modelClone.position);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Selection Helper
  // Raycasts from a 2D screen point to test if the placed model was tapped.
  // ─────────────────────────────────────────────────────────────────────────
  const handleTapSelection = useCallback(
    (screenX: number, screenY: number) => {
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      const model = placedModelRef.current;

      if (!renderer || !camera || !model) return;

      // Convert touch position to normalised device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((screenX - rect.left) / rect.width) * 2 - 1,
        -((screenY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);

      const intersects = raycaster.intersectObject(model, true);

      if (intersects.length > 0) {
        // Tapped on the model — select it
        if (selectedModelRef.current !== model) {
          // Deselect previous (if any)
          if (selectedModelRef.current) {
            setModelHighlight(selectedModelRef.current, false);
          }
          selectedModelRef.current = model;
          setModelHighlight(model, true);
          setArStatusMsg(
            'Model selected. Pinch to scale, twist to rotate, drag to move.'
          );
          console.log('[AR] Model selected.');
        }
      } else {
        // Tapped on empty space — place model or deselect
        if (placedModelRef.current === null) {
          placeModel();
        } else if (selectedModelRef.current) {
          // Deselect
          setModelHighlight(selectedModelRef.current, false);
          selectedModelRef.current = null;
          setArStatusMsg('Tap the model to select it again.');
        } else {
          // No model selected and one exists — attempt place (will be blocked by guard)
          // This branch handles tapping floor when nothing is selected.
          // The model is already placed, so placeModel() guard will skip it.
          // We intentionally do nothing here to avoid confusing the user.
        }
      }
    },
    [placeModel]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Drag Helper
  // Moves the placed model to the current reticle hit-test position.
  // Called on every touchmove while one finger is dragging.
  // ─────────────────────────────────────────────────────────────────────────
  const handleDragMove = useCallback(() => {
    const model = selectedModelRef.current ?? placedModelRef.current;
    const reticle = reticleRef.current;
    if (!model || !reticle?.visible) return;

    // The reticle matrix is updated every frame from hit-test results.
    // We use its position as the drag target — keeps the object on the floor.
    const targetPos = new THREE.Vector3().setFromMatrixPosition(reticle.matrix);
    model.position.copy(targetPos);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Touch Event Handlers
  // Attached to the overlay container div (not WebXR events) for reliable
  // multi-touch gesture support on Android Chrome + ARCore.
  // ─────────────────────────────────────────────────────────────────────────

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const g = gestureRef.current;
      const touches = Array.from(e.touches).map(
        (t): TouchPoint => ({ id: t.identifier, x: t.clientX, y: t.clientY })
      );
      g.activeTouches = touches.length;

      if (touches.length === 1) {
        // ── Begin one-finger gesture tracking ─────────────────────────────
        g.tapStartTime = Date.now();
        g.tapStartX = touches[0].x;
        g.tapStartY = touches[0].y;
        g.isDragging = false;
      } else if (touches.length === 2) {
        // ── Begin two-finger gesture tracking ────────────────────────────
        g.isDragging = false; // two fingers override single-finger drag
        g.initialPinchDistance = getTouchDistance(touches[0], touches[1]);
        g.initialPinchAngle = getTouchAngle(touches[0], touches[1]);

        const model = selectedModelRef.current ?? placedModelRef.current;
        if (model) {
          // Capture current scale (uniform X is sufficient)
          g.initialModelScale = model.scale.x;
          g.initialModelRotationY = model.rotation.y;
        }
      }
    },
    []
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const g = gestureRef.current;
      const touches = Array.from(e.touches).map(
        (t): TouchPoint => ({ id: t.identifier, x: t.clientX, y: t.clientY })
      );

      if (touches.length === 2) {
        // ── Two-finger: Pinch to Scale + Twist to Rotate ─────────────────
        const model = selectedModelRef.current ?? placedModelRef.current;
        if (!model) return;

        const currentDistance = getTouchDistance(touches[0], touches[1]);
        const currentAngle = getTouchAngle(touches[0], touches[1]);

        // Scale: proportional to distance change
        if (g.initialPinchDistance > 0) {
          const scaleFactor = currentDistance / g.initialPinchDistance;
          const newScale = clamp(
            g.initialModelScale * scaleFactor,
            MIN_MODEL_SCALE,
            MAX_MODEL_SCALE
          );
          model.scale.setScalar(newScale);
        }

        // Rotation: proportional to angle change
        const angleDelta = currentAngle - g.initialPinchAngle;
        model.rotation.y = g.initialModelRotationY + angleDelta;
      } else if (touches.length === 1) {
        // ── One-finger: Detect drag ───────────────────────────────────────
        const dx = touches[0].x - g.tapStartX;
        const dy = touches[0].y - g.tapStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!g.isDragging && dist > TAP_MOVE_THRESHOLD_PX) {
          g.isDragging = true;
          setArStatusMsg('Dragging model...');
        }

        if (g.isDragging) {
          // Move the model to the current reticle hit-test position
          handleDragMove();
        }
      }
    },
    [handleDragMove]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const g = gestureRef.current;

      // Determine if the lifted finger(s) result in a tap
      if (g.activeTouches === 1 && !g.isDragging) {
        const elapsed = Date.now() - g.tapStartTime;
        if (elapsed < TAP_DURATION_MS) {
          // ── Tap detected ────────────────────────────────────────────────
          if (placedModelRef.current === null) {
            // No model yet — place it
            placeModel();
          } else {
            // Model exists — check if user tapped on it (select) or on floor
            handleTapSelection(g.tapStartX, g.tapStartY);
          }
        }
      }

      // Update active touch count from remaining touches
      g.activeTouches = e.touches.length;
      if (e.touches.length === 0) {
        g.isDragging = false;
      }

      // If one finger is lifted during two-finger gesture, reset pinch baseline
      if (e.touches.length === 1) {
        const remaining = e.touches[0];
        const model = selectedModelRef.current ?? placedModelRef.current;
        if (model) {
          // Reset one-finger state for possible subsequent drag
          g.tapStartX = remaining.clientX;
          g.tapStartY = remaining.clientY;
          g.tapStartTime = Date.now();
          g.isDragging = false;
        }
      }
    },
    [placeModel, handleTapSelection]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Launch WebXR Immersive-AR Session
  // ─────────────────────────────────────────────────────────────────────────
  const startWebXRAR = async () => {
    if (typeof window === 'undefined' || !(navigator as any).xr || !product)
      return;

    const xrNav = (navigator as any).xr;

    try {
      const supported = await xrNav.isSessionSupported('immersive-ar');
      if (!supported) {
        setArStatusMsg(
          'WebXR immersive-ar is not supported on this device/browser.'
        );
        return;
      }

      setArStatusMsg('Requesting WebXR Camera Passthrough...');

      const session = await xrNav.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'local-floor'],
        domOverlay: containerRef.current
          ? { root: containerRef.current }
          : undefined,
      });
      xrSessionRef.current = session;

      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      if (!renderer || !scene) {
        session.end();
        return;
      }

      renderer.xr.enabled = true;
      await renderer.xr.setSession(session);
      setIsArActive(true);
      setArStatusMsg('Point camera at floor — then tap to place furniture.');

      // ── Reference Spaces ─────────────────────────────────────────────────
      const viewerSpace = await session.requestReferenceSpace('viewer');
      hitTestSourceRef.current = await session.requestHitTestSource({
        space: viewerSpace,
      });

      // ── Reticle ──────────────────────────────────────────────────────────
      const ringGeo = new THREE.RingGeometry(0.12, 0.18, 32).rotateX(
        -Math.PI / 2
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
      });
      const reticleMesh = new THREE.Mesh(ringGeo, ringMat);
      reticleMesh.matrixAutoUpdate = false;
      reticleMesh.visible = false;
      scene.add(reticleMesh);
      reticleRef.current = reticleMesh;

      // ── WebXR "select" event (fallback tap — controller / headset) ───────
      // NOTE: For DOM-overlay sessions on Android, touch events (onTouchEnd)
      // handle placement. This listener is kept as a fallback for non-overlay
      // sessions (e.g. headsets / Daydream). It is guarded so it never
      // creates a second model.
      const onSelect = () => {
        if (placedModelRef.current === null) {
          placeModel();
        }
      };
      session.addEventListener('select', onSelect);

      // ── Session End ──────────────────────────────────────────────────────
      session.addEventListener('end', () => {
        setIsArActive(false);
        setIsPlaced(false);
        setArStatusMsg(null);

        // Clean up Three.js resources
        if (reticleRef.current) {
          reticleRef.current.geometry?.dispose();
          (reticleRef.current.material as THREE.Material)?.dispose();
          sceneRef.current?.remove(reticleRef.current);
          reticleRef.current = null;
        }

        if (placedModelRef.current) {
          disposeGroup(placedModelRef.current);
          placedModelRef.current = null;
          selectedModelRef.current = null;
        }

        if (hitTestSourceRef.current) {
          hitTestSourceRef.current.cancel?.();
          hitTestSourceRef.current = null;
        }

        if (rendererRef.current) {
          rendererRef.current.xr.enabled = false;
        }

        xrSessionRef.current = null;
        console.log('[AR] Session ended — resources cleaned up.');
      });
    } catch (err: any) {
      console.warn('[AR] WebXR launch error:', err);
      setArStatusMsg(
        'Camera access or WebXR not available. Enable camera permissions or open in Chrome.'
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // AR Capture Handlers
  // ─────────────────────────────────────────────────────────────────────────

  /** Load all captures from the backend (for the gallery) */
  const loadCaptures = useCallback(async () => {
    try {
      const data = await fetchCaptures();
      setCaptures(data);
    } catch (err) {
      console.error('[AR Capture] Failed to load captures:', err);
    }
  }, []);

  /** Capture the current AR frame and upload it */
  const handleCapture = useCallback(async () => {
    const renderer = rendererRef.current;
    const model = placedModelRef.current;
    if (!renderer || !product) {
      setArStatusMsg('Cannot capture — renderer not ready.');
      return;
    }

    setIsCapturing(true);
    setArStatusMsg('Capturing AR view...');

    try {
      // Read pixels from the WebGL canvas
      const dataUrl = renderer.domElement.toDataURL('image/png');

      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      // Gather 3D metadata from the placed model (if any)
      const metadata: CaptureMetadata = {};
      if (model) {
        metadata.position_x = model.position.x;
        metadata.position_y = model.position.y;
        metadata.position_z = model.position.z;
        metadata.rotation_x = model.rotation.x;
        metadata.rotation_y = model.rotation.y;
        metadata.rotation_z = model.rotation.z;
        metadata.scale = model.scale.x; // uniform scale
      }

      // Upload to backend
      const created = await uploadCapture(blob, product.product_id, metadata);

      // Prepend to local captures list (newest first)
      setCaptures((prev) => [created, ...prev]);

      // Flash success animation
      setShowCaptureSuccess(true);
      setArStatusMsg('Capture saved!');
      setTimeout(() => setShowCaptureSuccess(false), 1500);

      console.log('[AR Capture] Uploaded successfully:', created.id);
    } catch (err) {
      console.error('[AR Capture] Upload failed:', err);
      setArStatusMsg('Capture failed — check network connection.');
    } finally {
      setIsCapturing(false);
    }
  }, [product]);

  /** Delete a capture and remove it from local state */
  const handleDeleteCapture = useCallback(async (captureId: number) => {
    try {
      await deleteCapture(captureId);
      setCaptures((prev) => prev.filter((c) => c.id !== captureId));
    } catch (err) {
      console.error('[AR Capture] Delete failed:', err);
    }
  }, []);

  /** End the XR session and navigate back */
  const handleBack = useCallback(() => {
    if (xrSessionRef.current) {
      xrSessionRef.current.end().catch(() => {});
    }
    router.back();
  }, [router]);

  // Load captures on mount
  useEffect(() => {
    loadCaptures();
  }, [loadCaptures]);

  // ─────────────────────────────────────────────────────────────────────────
  // Component Cleanup (unmount)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // End active XR session if component unmounts mid-session
      if (xrSessionRef.current) {
        xrSessionRef.current.end().catch(() => {});
      }
      // Dispose cached GLTF
      if (cachedGltfRef.current) {
        disposeGroup(cachedGltfRef.current);
        cachedGltfRef.current = null;
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">
          Loading 3D Product details from Django REST API...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Box className="w-12 h-12 text-slate-600" />
        <h2 className="text-lg font-bold">Product Not Found</h2>
        <Link href="/catalog" className="text-xs text-cyan-400 underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const usdzUrl = formatAssetUrl(
    product.usdz_display_url || product.usdz_url || ''
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-white pt-24 pb-12 px-6 max-w-lg mx-auto space-y-6">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="glass-card p-6 rounded-3xl space-y-6 border border-white/10 relative overflow-hidden">
        {/* Top Product Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black/40 border border-white/10 p-1 flex-shrink-0">
            <img
              src={formatAssetUrl(
                product.image_display_url || product.image_url || ''
              )}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/20">
              {product.surface_type || 'floor'} Surface
            </span>
            <h1 className="text-xl font-bold text-white leading-tight mt-1">
              {product.name}
            </h1>
          </div>
        </div>

        {/* WebXR Camera Canvas Viewport */}
        <div className="relative w-full h-[380px] rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-inner">
          {/*
           * The containerRef div serves dual purpose:
           * 1. Hosts the Three.js <canvas> element
           * 2. Acts as the WebXR DOM overlay root (touch events bubble up here)
           *
           * Touch handlers are attached here so they fire for every touch
           * on the AR viewport, enabling our gesture system.
           */}
          <div
            ref={containerRef}
            className="w-full h-full"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />

          {/* AR Status Toast */}
          {arStatusMsg && (
            <div className="absolute top-4 left-4 right-4 z-20 bg-black/85 backdrop-blur-md p-3 rounded-xl border border-cyan-500/30 text-cyan-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400 flex-shrink-0" />{' '}
              {arStatusMsg}
            </div>
          )}

          {/* ── AR Capture Overlay Controls ─────────────────────────────────── */}
          {/* pointer-events:none on container so AR gestures pass through,
              pointer-events:auto on each button so they intercept taps. */}
          {isArActive && (
            <div className="absolute inset-0 z-30 pointer-events-none">
              {/* Top-left: Back button */}
              <div className="absolute top-4 left-4 pointer-events-auto">
                <BackButton onBack={handleBack} />
              </div>

              {/* Bottom-left: Gallery button */}
              <div className="absolute bottom-5 left-5 pointer-events-auto">
                <CapturedImagesButton
                  onOpen={() => {
                    loadCaptures();
                    setIsGalleryOpen(true);
                  }}
                  captureCount={captures.length}
                />
              </div>

              {/* Bottom-center: Capture button */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto">
                <CaptureButton
                  onCapture={handleCapture}
                  isCapturing={isCapturing}
                />
              </div>

              {/* Capture success flash overlay */}
              {showCaptureSuccess && (
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl pointer-events-none" />
              )}
            </div>
          )}

          {!isArActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/50 backdrop-blur-xs space-y-4">
              <Smartphone className="w-10 h-10 text-cyan-400 animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  In-Browser Camera WebAR
                </h3>
                <p className="text-xs text-slate-300">
                  Grant camera access to place {product.name} on your floor in
                  real-time.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Gallery Modal — rendered outside the viewport */}
        <GalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          captures={captures}
          onDelete={handleDeleteCapture}
        />

        {/* Action Controls */}
        <div className="space-y-3">
          {webxrSupported || typeof window !== 'undefined' ? (
            <button
              onClick={startWebXRAR}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold text-sm rounded-2xl shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Camera className="w-5 h-5 text-white" />
              <span>
                {isArActive ? 'Tap Floor Reticle to Place' : 'Launch WebXR Camera AR'}
              </span>
            </button>
          ) : null}

          {usdzUrl ? (
            <a
              href={usdzUrl}
              rel="ar"
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" /> iOS Quick Look
              Backup
            </a>
          ) : null}

          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-2">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Camera
              Passthrough
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Floor
              Hit Detection
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{' '}
              Tap-to-Place
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Walk
              Around Object
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
