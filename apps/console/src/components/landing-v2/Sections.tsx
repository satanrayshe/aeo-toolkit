/**
 * Landing v2 sections — server components, complete without JavaScript. The visual
 * system is "the audit, printed": ruled ledger rows, numbered indices, mono metadata,
 * one signal accent. Motion hooks are data-attributes consumed by Motion.tsx.
 */

import type { JSX } from 'react';
import Link from 'next/link';
import { FAQS, TOOLS } from '@/components/landing';
import { SpecimenReport } from './SpecimenReport';

/* ────────────────────────── Hero ────────────────────────── */

export function HeroV2(): JSX.Element {
  return (
    <section className="px-6 pb-16 pt-14 sm:px-10 sm:pb-20 sm:pt-20 lg:px-14">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <div>
          <p className="v2-label" style={{ color: 'var(--v2-signal)' }}>
            Answer Engine Optimization · free & open source
          </p>
          <h1
            data-hero-title
            className="mt-5 max-w-xl text-balance text-5xl font-bold leading-[0.98] tracking-tighter sm:text-6xl lg:text-7xl"
          >
            Your next customer asks an AI.
          </h1>
          <p
            data-hero-sub
            className="mt-6 max-w-md text-lg leading-relaxed"
            style={{ color: 'var(--v2-ink-soft)' }}
          >
            AEO Toolkit measures whether ChatGPT, Claude, and Perplexity can find, parse, and cite
            your site — then hands you the fix list. No sign-up.
          </p>

          <form data-hero-cta action="/tools/audit" method="get" className="mt-8 flex max-w-md gap-0">
            <label htmlFor="hero-url" className="sr-only">
              Website URL to audit
            </label>
            <input
              id="hero-url"
              name="url"
              type="url"
              inputMode="url"
              placeholder="https://yoursite.com"
              className="h-12 w-full border border-r-0 border-white/25 bg-white/[0.07] px-4 font-[var(--font-v2-mono)] text-sm text-[color:var(--v2-text)] backdrop-blur-md placeholder:text-[color:var(--v2-ink-faint)]"
              style={{ borderRadius: '10px 0 0 10px' }}
            />
            <button
              type="submit"
              className="v2-cta h-12 shrink-0 px-5 text-sm font-semibold"
              style={{ borderRadius: '0 10px 10px 0' }}
            >
              Run the audit
            </button>
          </form>
          <p className="v2-label mt-4">54 rules · crawls up to 50 pages · report in ~60s</p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <SpecimenReport />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── What gets measured (ledger) ─────────────────── */

const MEASURES: ReadonlyArray<{ n: string; name: string; detail: string }> = [
  {
    n: '01',
    name: 'Crawlability & indexing',
    detail: 'robots.txt, sitemaps, canonicals, redirect health — can an engine reach you at all.',
  },
  {
    n: '02',
    name: 'AI-bot access',
    detail: 'GPTBot, ClaudeBot, PerplexityBot directives and llms.txt — the gates most sites shut by accident.',
  },
  {
    n: '03',
    name: 'Structured data',
    detail: 'JSON-LD, Microdata, RDFa — validated, and checked for the types answer engines actually cite from.',
  },
  {
    n: '04',
    name: 'Metadata & on-page',
    detail: 'Titles, descriptions, heading hierarchy, alt coverage — the parse layer.',
  },
  {
    n: '05',
    name: 'Answer readiness',
    detail: 'Question-shaped headings, extractable lists and tables, answer-first structure an LLM can quote.',
  },
  {
    n: '06',
    name: 'E-E-A-T signals',
    detail: 'Experience, Expertise, Authoritativeness, Trust — whether you are safe to cite, pillar by pillar.',
  },
];

export function LedgerV2(): JSX.Element {
  return (
    <section className="px-6 pb-16 sm:px-10 sm:pb-20 lg:px-14" aria-labelledby="measures-h">
      <div data-reveal>
        <p className="v2-label">The measurement</p>
        <h2 id="measures-h" className="mt-3 max-w-lg text-3xl font-bold tracking-tighter sm:text-4xl">
          Six instruments, one graded report.
        </h2>
      </div>
      <div className="v2-rule mt-8" data-rule aria-hidden="true" />
      <dl data-reveal-group className="m-0">
        {MEASURES.map((m) => (
          <div
            key={m.n}
            data-reveal-item
            className="grid grid-cols-[3rem_1fr] gap-x-4 gap-y-1 border-b border-[color:var(--v2-rule)] py-5 sm:grid-cols-[4rem_16rem_1fr] sm:items-baseline"
          >
            <span
              className="font-[var(--font-v2-mono)] text-sm tabular-nums"
              style={{ color: 'var(--v2-signal)' }}
              aria-hidden="true"
            >
              {m.n}
            </span>
            <dt className="text-base font-semibold">{m.name}</dt>
            <dd className="col-start-2 m-0 text-sm leading-relaxed sm:col-start-3" style={{ color: 'var(--v2-ink-soft)' }}>
              {m.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ─────────────────── The instruments (tool index) ─────────────────── */

export function InstrumentIndexV2(): JSX.Element {
  return (
    <section
      className="border-t border-[color:var(--v2-rule-strong)] bg-white/[0.03] px-6 py-16 sm:px-10 sm:py-20 lg:px-14"
      aria-labelledby="tools-h"
    >
      <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="v2-label">The instruments</p>
          <h2 id="tools-h" className="mt-3 text-3xl font-bold tracking-tighter sm:text-4xl">
            Five tools. All free. All open.
          </h2>
        </div>
        <p className="v2-label">No account · MIT licensed</p>
      </div>

      <ol data-reveal-group className="mt-10 list-none p-0">
        {TOOLS.map((tool, i) => (
          <li key={tool.href} data-reveal-item>
            <Link
              href={tool.href}
              className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 border-t border-[color:var(--v2-rule)] py-5 transition-colors hover:bg-white/[0.06] sm:grid-cols-[4rem_18rem_1fr_auto]"
            >
              <span
                className="font-[var(--font-v2-mono)] text-sm tabular-nums"
                style={{ color: 'var(--v2-ink-faint)' }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-lg font-semibold tracking-tight group-hover:underline">
                {tool.name}
              </span>
              <span
                className="col-start-2 text-sm leading-relaxed sm:col-start-3"
                style={{ color: 'var(--v2-ink-soft)' }}
              >
                {tool.blurb}
              </span>
              <span
                className="hidden font-[var(--font-v2-mono)] text-sm sm:block"
                style={{ color: 'var(--v2-signal)' }}
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────────── Method + honest proof ─────────────────── */

const STEPS: ReadonlyArray<{ n: string; name: string; detail: string }> = [
  { n: 'I', name: 'Point', detail: 'Give it a URL. The crawler reads up to 50 pages, politely, sitemap-first.' },
  { n: 'II', name: 'Read', detail: 'Every rule returns a pass or a specific failure — scored, weighted, graded.' },
  { n: 'III', name: 'Fix', detail: 'Work the prioritized list, download the missing-file templates, re-run.' },
];

/** Verifiable facts only — repository truth, no manufactured proof. */
const PROOF: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'MIT', label: 'licensed, clean-room TypeScript' },
  { value: '6', label: 'packages published on npm' },
  { value: '800+', label: 'tests in the open repo' },
  { value: '3', label: 'MCP servers for Claude & Cursor' },
];

export function MethodV2(): JSX.Element {
  return (
    <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-14" aria-labelledby="method-h">
      <div data-reveal>
        <p className="v2-label">The method</p>
        <h2 id="method-h" className="mt-3 text-3xl font-bold tracking-tighter sm:text-4xl">
          Point. Read. Fix.
        </h2>
      </div>
      <div data-reveal-group className="mt-10 grid gap-8 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} data-reveal-item className="v2-glass rounded-xl p-6">
            <span className="font-[var(--font-v2-mono)] text-sm" style={{ color: 'var(--v2-signal)' }}>
              {step.n}
            </span>
            <h3 className="mt-3 text-xl font-bold tracking-tight">{step.name}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--v2-ink-soft)' }}>
              {step.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="v2-rule mt-16" data-rule aria-hidden="true" />
      <dl data-reveal-group className="m-0 mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
        {PROOF.map((fact) => (
          <div key={fact.label} data-reveal-item>
            <dt className="sr-only">{fact.label}</dt>
            <dd className="m-0 font-[var(--font-v2-sans)] text-4xl font-bold tracking-tighter">
              {fact.value}
            </dd>
            <dd className="v2-label m-0 mt-2">{fact.label}</dd>
          </div>
        ))}
      </dl>
      <p className="v2-label mt-8">
        Everything above is verifiable in the repository →{' '}
        <a
          href="https://github.com/Advance-Labs/aeo-toolkit"
          className="underline"
          style={{ color: 'var(--v2-ink)' }}
        >
          github.com/Advance-Labs/aeo-toolkit
        </a>
      </p>
    </section>
  );
}

/* ─────────────────── FAQ ─────────────────── */

export function FaqV2(): JSX.Element {
  return (
    <section className="px-6 pb-16 sm:px-10 sm:pb-20 lg:px-14" aria-labelledby="faq-h">
      <div data-reveal>
        <p className="v2-label">Questions</p>
        <h2 id="faq-h" className="mt-3 text-3xl font-bold tracking-tighter sm:text-4xl">
          Asked and answered.
        </h2>
      </div>
      <div data-reveal-group className="mt-8">
        {FAQS.map((faq) => (
          <details
            key={faq.question}
            data-reveal-item
            className="group border-b border-[color:var(--v2-rule)]"
          >
            <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-5 text-base font-semibold [&::-webkit-details-marker]:hidden">
              {faq.question}
              <span
                aria-hidden="true"
                className="shrink-0 font-[var(--font-v2-mono)] transition-transform group-open:rotate-45"
                style={{ color: 'var(--v2-signal)' }}
              >
                +
              </span>
            </summary>
            <p className="max-w-2xl pb-6 text-sm leading-relaxed" style={{ color: 'var(--v2-ink-soft)' }}>
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────── Final CTA (inverse, on the shell) ─────────────────── */

export function CtaV2(): JSX.Element {
  return (
    <section className="px-6 py-20 text-center sm:py-24" aria-labelledby="cta-h">
      <p className="v2-label" style={{ color: 'var(--v2-signal-ondark)' }}>
        Begin the measurement
      </p>
      <h2
        id="cta-h"
        className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-bold tracking-tighter sm:text-5xl"
        style={{ color: 'var(--v2-paper)' }}
      >
        Sixty seconds from URL to graded report.
      </h2>
      <div className="mt-8 flex justify-center">
        <Link
          href="/tools/audit"
          className="v2-cta inline-flex h-12 items-center rounded-xl px-7 text-sm font-semibold"
        >
          Run the audit
        </Link>
      </div>
      <p className="v2-label mt-5" style={{ color: 'var(--v2-ink-faint)' }}>
        Free · no account · your data stays yours
      </p>
    </section>
  );
}
