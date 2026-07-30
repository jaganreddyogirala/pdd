'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
  className?: string;
}

const hexToNormalizedRGB = (hex: string): [number, number, number] => {
  const cleanHex = hex.replace('#', '');
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((char) => char + char)
          .join('')
      : cleanHex;

  return [
    parseInt(fullHex.slice(0, 2), 16) / 255 || 0,
    parseInt(fullHex.slice(2, 4), 16) / 255 || 0,
    parseInt(fullHex.slice(4, 6), 16) / 255 || 0,
  ];
};

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

export function Silk({
  speed = 5,
  scale = 1,
  color = '#4338ca',
  noiseIntensity = 1.5,
  rotation = 0,
  className = '',
}: SilkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<{
    uTime: { value: number };
    uSpeed: { value: number };
    uScale: { value: number };
    uColor: { value: THREE.Color };
    uRotation: { value: number };
    uNoiseIntensity: { value: number };
  } | null>(null);

  // Initialize WebGL Scene & Renderer ONCE on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (err) {
      console.warn('WebGL not supported or context creation failed:', err);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Prevent unhandled WebGL context loss events from surfacing as [object Event]
    const handleContextLost = (event: Event) => {
      event.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    container.appendChild(renderer.domElement);

    const rgb = hexToNormalizedRGB(color);
    const uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uScale: { value: scale },
      uColor: { value: new THREE.Color(rgb[0], rgb[1], rgb[2]) },
      uRotation: { value: rotation },
      uNoiseIntensity: { value: noiseIntensity },
    };
    uniformsRef.current = uniforms;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      material.uniforms.uTime.value += 0.1 * delta;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      uniformsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update uniforms smoothly when props change without destroying WebGL context
  useEffect(() => {
    if (!uniformsRef.current) return;
    const rgb = hexToNormalizedRGB(color);
    uniformsRef.current.uSpeed.value = speed;
    uniformsRef.current.uScale.value = scale;
    uniformsRef.current.uColor.value.setRGB(rgb[0], rgb[1], rgb[2]);
    uniformsRef.current.uRotation.value = rotation;
    uniformsRef.current.uNoiseIntensity.value = noiseIntensity;
  }, [speed, scale, color, noiseIntensity, rotation]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}

export default Silk;
