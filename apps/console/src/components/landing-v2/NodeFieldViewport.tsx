'use client';

/**
 * Hero instrument, option B: the node field is an unframed cloud filling the hero's
 * right half — no card clipping it — with a compact glass HUD floating at its foot
 * carrying the live readouts. Green graph with a violet minority (the brand duo),
 * slow orbit, damped pointer parallax; previews the Backlink Graph tool.
 *
 * Discipline unchanged: DPR capped, rendering pauses when the tab is hidden, full
 * disposal on unmount, context loss swaps to the fallback, reduced motion renders a
 * single static frame.
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
    camera.position.z = 2.75;

    const group = new THREE.Group();
    scene.add(group);

    // A wider jittered shell than the framed version — the cloud is meant to fill
    // the whole half, not sit inside a card.
    const positions = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i += 1) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.92 + Math.random() * 0.55);
      positions.set([v.x, v.y, v.z], i * 3);
    }
    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointMat = new THREE.PointsMaterial({
      color: 0xa8f326,
      size: 0.028,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.Points(pointGeo, pointMat));

    // Nearest-neighbor links — a graph, honestly counted in the HUD.
    const linkPositions: number[] = [];
    const p = new THREE.Vector3();
    const q = new THREE.Vector3();
    for (let i = 0; i < NODE_COUNT; i += 1) {
      p.fromArray(positions, i * 3);
      const nearest: Array<{ d: number; j: number }> = [];
      for (let j = 0; j < NODE_COUNT; j += 1) {
        if (j === i) continue;
        q.fromArray(positions, j * 3);
        nearest.push({ d: p.distanceToSquared(q), j });
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
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.LineSegments(linkGeo, linkMat));

    // The violet minority — the Advance Labs duo.
    const accentCount = 140;
    const accentPositions = new Float32Array(accentCount * 3);
    for (let i = 0; i < accentCount; i += 1) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.92 + Math.random() * 0.55);
      accentPositions.set([v.x, v.y, v.z], i * 3);
    }
    const accentGeo = new THREE.BufferGeometry();
    accentGeo.setAttribute('position', new THREE.BufferAttribute(accentPositions, 3));
    const accentMat = new THREE.PointsMaterial({
      color: 0xb6a4fd,
      size: 0.032,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.Points(accentGeo, accentMat));

    // Wire core anchors the field.
    const coreGeo = new THREE.IcosahedronGeometry(0.4, 1);
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
      accentGeo.dispose();
      accentMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div data-hero-sheet className="flex w-full flex-col">
      <div className="relative h-[380px] w-full sm:h-[440px] lg:h-[500px]">
      {/* The unframed cloud: fills the column, spills past where the card used to end. */}
      <div
        ref={hostRef}
        className="absolute inset-0 [&>canvas]:h-full [&>canvas]:w-full"
        aria-hidden="true"
      >
        {failed ? (
          <div className="flex h-full items-center justify-center">
            <p className="v2-label">Viewport offline · graph renders in the tool</p>
          </div>
        ) : null}
      </div>

      </div>

      {/* What this is — anchored just below the field, overlapping only its fading edge. */}
      <div className="relative z-10 -mt-6 flex flex-col gap-2 lg:items-end">
        <p
          className="max-w-md text-sm leading-relaxed lg:text-right"
          style={{ color: 'var(--v2-ink-soft)' }}
        >
          A synthesized backlink neighborhood — every point a page, every thread a link between
          pages. The Backlink Graph tool draws this map live for any URL.
        </p>
        <p className="v2-label flex flex-wrap items-baseline gap-x-4 gap-y-1 lg:justify-end">
          <span className="whitespace-nowrap">
            Nodes <span style={{ color: 'var(--v2-text)' }}>{stats.nodes}</span> · Links{' '}
            <span style={{ color: 'var(--v2-text)' }}>{stats.links}</span>
          </span>
          <Link
            href="/tools/graph"
            className="whitespace-nowrap underline hover:text-[color:var(--v2-text)]"
          >
            Open the real graph →
          </Link>
        </p>
      </div>
    </div>
  );
}
