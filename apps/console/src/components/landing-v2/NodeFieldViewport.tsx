'use client';

/**
 * Hero instrument: a live Three.js node field — luminous green points linked into a
 * loose graph, slowly orbiting with damped pointer parallax. It is system-connected,
 * not decoration: it previews the Backlink Graph tool and its readouts are the real
 * scene stats.
 *
 * Discipline: DPR capped, rendering pauses when the tab is hidden, everything is
 * disposed on unmount, context loss swaps to the fallback, and reduced motion gets a
 * single static frame with no loop and no pointer response.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';

const NODE_COUNT = 520;
const LINKS_PER_NODE = 2;

export function NodeFieldViewport(): React.ReactElement {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [stats, setStats] = useState({ nodes: 0, links: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 20);
    camera.position.z = 3.1;

    const group = new THREE.Group();
    scene.add(group);

    // Nodes on a jittered shell — reads as a synthesized site graph, not a starfield.
    const positions = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i += 1) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.78 + Math.random() * 0.5);
      positions.set([v.x, v.y, v.z], i * 3);
    }
    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointMat = new THREE.PointsMaterial({
      color: 0xa8f326,
      size: 0.022,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.Points(pointGeo, pointMat));

    // Each node links to its nearest neighbors — a graph, honestly counted below.
    const linkPositions: number[] = [];
    const p = new THREE.Vector3();
    const q = new THREE.Vector3();
    for (let i = 0; i < NODE_COUNT; i += 1) {
      p.fromArray(positions, i * 3);
      const nearest: Array<{ d: number; j: number }> = [];
      for (let j = 0; j < NODE_COUNT; j += 1) {
        if (j === i) continue;
        q.fromArray(positions, j * 3);
        const d = p.distanceToSquared(q);
        nearest.push({ d, j });
      }
      nearest.sort((a, b) => a.d - b.d);
      for (let k = 0; k < LINKS_PER_NODE; k += 1) {
        const n = nearest[k];
        if (!n) continue;
        q.fromArray(positions, n.j * 3);
        linkPositions.push(p.x, p.y, p.z, q.x, q.y, q.z);
      }
    }
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3));
    const linkMat = new THREE.LineBasicMaterial({
      color: 0xa8f326,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.LineSegments(linkGeo, linkMat));

    // A faint wire core anchors the field.
    const coreGeo = new THREE.IcosahedronGeometry(0.34, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xa8f326,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    setStats({ nodes: NODE_COUNT, links: linkPositions.length / 6 });

    const resize = (): void => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const pointer = { tx: 0, ty: 0, x: 0, y: 0 };
    const onPointer = (e: PointerEvent): void => {
      const rect = host.getBoundingClientRect();
      pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
      pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 0.35;
    };
    const onLeave = (): void => {
      pointer.tx = 0;
      pointer.ty = 0;
    };

    let raf = 0;
    let running = false;
    const tick = (): void => {
      group.rotation.y += 0.0016;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      group.rotation.x = pointer.y;
      group.rotation.z = pointer.x * 0.4;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    const start = (): void => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = (): void => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVisibility = (): void => {
      if (document.hidden) stop();
      else if (!reduceMotion) start();
    };

    const onContextLost = (e: Event): void => {
      e.preventDefault();
      stop();
      setFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    if (reduceMotion) {
      // Static poster: one composed frame, no loop, no pointer.
      renderer.render(scene, camera);
    } else {
      host.addEventListener('pointermove', onPointer);
      host.addEventListener('pointerleave', onLeave);
      document.addEventListener('visibilitychange', onVisibility);
      start();
    }

    return () => {
      stop();
      ro.disconnect();
      host.removeEventListener('pointermove', onPointer);
      host.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      pointGeo.dispose();
      pointMat.dispose();
      linkGeo.dispose();
      linkMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div data-hero-sheet className="v2-glass v2-brackets w-full max-w-md rounded-xl">
      {/* Instrument header — mono system voice. */}
      <div className="flex items-baseline justify-between gap-4 border-b border-[color:var(--v2-rule)] px-5 py-3">
        <span className="v2-label">Live synthesis</span>
        <span className="v2-label" style={{ color: 'var(--v2-signal)' }}>
          ● Backlink field
        </span>
      </div>

      {/* The viewport. Falls back to a mono readout if WebGL is unavailable. */}
      <div ref={hostRef} className="relative h-72 w-full overflow-hidden sm:h-80 [&>canvas]:h-full [&>canvas]:w-full">
        {failed ? (
          <div className="flex h-full items-center justify-center">
            <p className="v2-label">Viewport offline · graph renders in the tool</p>
          </div>
        ) : null}
      </div>

      {/* Real scene stats — the readouts are honest by construction. */}
      <div className="flex items-baseline justify-between gap-4 border-t border-[color:var(--v2-rule)] px-5 py-3">
        <span className="v2-label">
          Nodes <span style={{ color: 'var(--v2-text)' }}>{stats.nodes}</span> · Links{' '}
          <span style={{ color: 'var(--v2-text)' }}>{stats.links}</span>
        </span>
        <Link href="/tools/graph" className="v2-label underline hover:text-[color:var(--v2-text)]">
          Open the real graph →
        </Link>
      </div>
    </div>
  );
}
