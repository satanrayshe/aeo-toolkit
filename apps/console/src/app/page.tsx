import type { JSX } from 'react';
import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import { JsonLd } from '@/components/seo/JsonLd';
import { publicUrl } from '@/lib/seo';
import { FAQS } from '@/components/landing';
import { Motion } from '@/components/landing-v2/Motion';
import {
  CtaV2,
  FaqV2,
  HeroV2,
  InstrumentIndexV2,
  LedgerV2,
  MethodV2,
} from '@/components/landing-v2/Sections';
import '@/components/landing-v2/landing-v2.css';

/**
 * Landing v2 — "the audit, printed." A warm paper report sheet framed in the site's dark
 * graphite shell (light-mode-paper-technical direction). Server components ship the full
 * content statically; Motion.tsx (GSAP + Lenis) and the specimen tilt are the only client
 * islands, both no-ops under prefers-reduced-motion and absent without JavaScript.
 */

const v2Sans = Archivo({ subsets: ['latin'], variable: '--font-v2-sans', display: 'swap' });
const v2Mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-v2-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AEO Toolkit — Get cited by ChatGPT, Claude & Perplexity',
  description:
    'Audit, optimize, and track your visibility across AI answer engines. Technical SEO + AEO scoring, E-E-A-T scanning, llms.txt generation, GA4/GSC chat, and a 3D backlink graph — one free console.',
  alternates: { canonical: publicUrl('/') },
};

/** Visible FAQ mirrored 1:1 into FAQPage JSON-LD (Organization/WebSite ship from the layout). */
const faqLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
};

export default function LandingPage(): JSX.Element {
  return (
    <div className={`v2 ${v2Sans.variable} ${v2Mono.variable} relative bg-[#101014]`}>
      <JsonLd data={faqLd} />
      <Motion />

      {/* The paper master sheet, framed by the dark shell. */}
      <div className="px-3 pt-4 sm:px-5 sm:pt-6 lg:px-8">
        <div className="v2-sheet mx-auto max-w-[88rem] overflow-hidden">
          <HeroV2 />
          <LedgerV2 />
          <InstrumentIndexV2 />
        </div>
        <div className="v2-sheet mx-auto mt-4 max-w-[88rem] overflow-hidden sm:mt-6">
          <MethodV2 />
          <FaqV2 />
        </div>
      </div>

      {/* Final call sits on the shell itself — the inverse beat that closes the report. */}
      <CtaV2 />
    </div>
  );
}
