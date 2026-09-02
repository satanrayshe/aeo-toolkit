'use client';

/**
 * Landing motion system — GSAP + ScrollTrigger driven by Lenis (the sole smooth-scroll
 * engine; native scroll-behavior is disabled on the landing wrapper). Follows the
 * cinematic-gsap-lenis recipe: Lenis raf runs through the GSAP ticker so ScrollTrigger
 * stays synced, reveals trigger on entry (not per-pixel), eases stay in the power3/expo
 * family, and everything is destroyed on unmount.
 *
 * Accessibility contract:
 * - Under `prefers-reduced-motion: reduce`, nothing is hidden or animated and Lenis is
 *   never constructed — the page renders its final state immediately.
 * - Without JavaScript the markup is complete and visible; `html.has-motion` (added here,
 *   pre-first-paint via useLayoutEffect) is what arms the hidden-until-revealed styles.
 * - Word splitting keeps the unsplit accessible name: the original text becomes the
 *   element's aria-label and the decorative word spans are aria-hidden.
 */

import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/** Split an element's text into masked word spans; preserves the accessible name. */
function splitWords(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text.trim());
  el.textContent = '';
  const words: HTMLElement[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const mask = document.createElement('span');
    mask.className = 'v2-word-mask';
    mask.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'v2-word';
    inner.textContent = word;
    mask.appendChild(inner);
    el.appendChild(mask);
    el.appendChild(document.createTextNode(' '));
    words.push(inner);
  }
  return words;
}

export function Motion(): null {
  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('has-motion');

    const ctx = gsap.context(() => {
      gsap.defaults({ ease: 'power3.out', duration: 0.85 });

      // ── Hero intro: headline words, then supporting copy and the specimen sheet.
      // Nav/CTA are never part of the timeline, so the page is usable from frame one.
      const heroTitle = document.querySelector<HTMLElement>('[data-hero-title]');
      const intro = gsap.timeline({ delay: 0.1 });
      if (heroTitle) {
        const words = splitWords(heroTitle);
        gsap.set(heroTitle, { visibility: 'visible' });
        intro.from(words, { yPercent: 110, duration: 0.9, stagger: 0.055, ease: 'expo.out' });
      }
      intro.from(
        '[data-hero-sub]',
        { autoAlpha: 0, y: 18, duration: 0.75 },
        heroTitle ? '-=0.45' : 0,
      );
      intro.from('[data-hero-cta]', { autoAlpha: 0, y: 14, duration: 0.6 }, '-=0.5');
      intro.from(
        '[data-hero-sheet]',
        { autoAlpha: 0, y: 32, rotate: 0.6, duration: 1.0, ease: 'power4.out' },
        '-=0.55',
      );

      // Score numeral counts up once the sheet lands.
      const scoreEl = document.querySelector<HTMLElement>('[data-count]');
      if (scoreEl) {
        const target = Number(scoreEl.dataset.count ?? '0');
        const state = { n: 0 };
        intro.to(
          state,
          {
            n: target,
            duration: 1.1,
            ease: 'power2.out',
            onUpdate: () => {
              scoreEl.textContent = String(Math.round(state.n));
            },
          },
          '-=0.55',
        );
      }

      // ── Scroll reveals: sections assemble like a report being printed.
      for (const el of gsap.utils.toArray<HTMLElement>('[data-reveal]')) {
        gsap.from(el, {
          autoAlpha: 0,
          y: 26,
          duration: 0.85,
          scrollTrigger: { trigger: el, start: 'top 82%' },
        });
      }
      for (const group of gsap.utils.toArray<HTMLElement>('[data-reveal-group]')) {
        gsap.from(group.querySelectorAll('[data-reveal-item]'), {
          autoAlpha: 0,
          y: 22,
          duration: 0.8,
          stagger: 0.08,
          scrollTrigger: { trigger: group, start: 'top 82%' },
        });
      }
      // Horizontal rules draw in — the "engraving" beat of the system.
      for (const rule of gsap.utils.toArray<HTMLElement>('[data-rule]')) {
        gsap.from(rule, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1.0,
          ease: 'expo.out',
          scrollTrigger: { trigger: rule, start: 'top 88%' },
        });
      }
    });

    // Lenis drives its raf through the GSAP ticker (single clock, no drift).
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number): void => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onLoad = (): void => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('load', onLoad);
      gsap.ticker.remove(tick);
      lenis.destroy();
      ctx.revert();
      document.documentElement.classList.remove('has-motion');
    };
  }, []);

  return null;
}
