import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export default function Hero3DCanvas() {
  const mountRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090909, 0.04);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7.5);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.appendChild(renderer.domElement);
    } catch {
      setWebGlSupported(false);
      return;
    }

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf5f5f5, 2.2);
    keyLight.position.set(6, 8, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x888888, 1.8);
    rimLight.position.set(-6, -4, -4);
    scene.add(rimLight);

    const topLight = new THREE.DirectionalLight(0xdddddd, 1.0);
    topLight.position.set(0, 8, 2);
    scene.add(topLight);

    // Main Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Sculptural Architectural Polyhedron (Matte Graphite & Metallic Titanium)
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x161616,
      roughness: 0.35,
      metalness: 0.85,
      flatShading: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreMesh);

    // Core Wireframe Outline
    const wireGeo = new THREE.WireframeGeometry(coreGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x444444,
      linewidth: 1,
      transparent: true,
      opacity: 0.6
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    mainGroup.add(wireMesh);

    // 2. Precision Outer Orbital Rings
    const ringMat1 = new THREE.LineBasicMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.5
    });
    const ringGeo1 = new THREE.BufferGeometry();
    const points1 = [];
    const radius1 = 2.4;
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      points1.push(new THREE.Vector3(Math.cos(theta) * radius1, Math.sin(theta) * radius1, 0));
    }
    ringGeo1.setFromPoints(points1);
    const ring1 = new THREE.Line(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI * 0.35;
    ring1.rotation.y = Math.PI * 0.15;
    mainGroup.add(ring1);

    const ringMat2 = new THREE.LineBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.4
    });
    const ringGeo2 = new THREE.BufferGeometry();
    const points2 = [];
    const radius2 = 3.0;
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      points2.push(new THREE.Vector3(Math.cos(theta) * radius2, Math.sin(theta) * radius2, 0));
    }
    ringGeo2.setFromPoints(points2);
    const ring2 = new THREE.Line(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI * 0.25;
    ring2.rotation.z = Math.PI * 0.4;
    mainGroup.add(ring2);

    // 3. Network Nodes (Talent Nodes)
    const nodeCount = 14;
    const nodeGroup = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.2,
      metalness: 0.9
    });

    const nodePositions = [];
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const r = 2.2 + (i % 3) * 0.35;

      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(x, y, z);
      nodeGroup.add(nodeMesh);
      nodePositions.push(new THREE.Vector3(x, y, z));
    }
    mainGroup.add(nodeGroup);

    // Interconnecting Network Lines
    const connectionPoints = [];
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < 2.3) {
          connectionPoints.push(nodePositions[i]);
          connectionPoints.push(nodePositions[j]);
        }
      }
    }
    const linesGeo = new THREE.BufferGeometry().setFromPoints(connectionPoints);
    const linesMat = new THREE.LineBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.35
    });
    const networkLines = new THREE.LineSegments(linesGeo, linesMat);
    mainGroup.add(networkLines);

    // Mouse Interaction
    let targetX = 0;
    let targetY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    const onMouseMove = (e) => {
      targetX = (e.clientX - windowHalfX) * 0.0006;
      targetY = (e.clientY - windowHalfY) * 0.0006;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Responsive Resize
    const onResize = () => {
      if (!container || !renderer) return;
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle organic rotation
      mainGroup.rotation.y += 0.0035;
      mainGroup.rotation.x += 0.0015;

      ring1.rotation.z += 0.002;
      ring2.rotation.z -= 0.0018;

      // Mouse Parallax Smooth Interpolation
      mainGroup.rotation.y += (targetX - mainGroup.rotation.y * 0.1) * 0.05;
      mainGroup.rotation.x += (targetY - mainGroup.rotation.x * 0.1) * 0.05;

      // Subtle breathing pulse for core
      const scale = 1 + Math.sin(elapsed * 1.2) * 0.02;
      coreMesh.scale.set(scale, scale, scale);
      wireMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      linesGeo.dispose();
      linesMat.dispose();
    };
  }, []);

  if (!webGlSupported) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="relative w-72 h-72 border border-[#303030] rounded-full flex items-center justify-center animate-spin-slow">
          <div className="w-52 h-52 border border-[#303030] rounded-full flex items-center justify-center">
            <div className="w-32 h-32 bg-[#171717] border border-[#303030] rounded-2xl rotate-45 flex items-center justify-center">
              <span className="text-xs uppercase tracking-widest text-[#A3A3A3] -rotate-45 font-mono">
                Hirevoxa Core
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="w-full h-[450px] lg:h-[550px] cursor-grab active:cursor-grabbing relative"
      aria-label="3D Talent Network Visualization"
    />
  );
}
