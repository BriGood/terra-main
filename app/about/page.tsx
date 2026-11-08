import type { Metadata } from 'next';
import Link from '@/app/components/HoverPrefetchLink';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Terra Fieldworks is an everyday carry and field gear brand built on one idea: the best tool is the one you actually use. User driven, purpose built.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="bg-black text-white px-6 pt-6 pb-24 lg:px-20">

      {/* Hero */}
      <div className="max-w-3xl mb-10">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight mb-6">
          Solutions for the Field
        </h1>
        <p className="text-[#888888] leading-relaxed">
          Terra Fieldworks is an everyday carry and field gear brand built around one idea: the best tool is the one you actually use. Every product we make is designed from the ground up to solve real problems. User driven. Purpose built.
        </p>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-6 max-w-3xl">

        <div className="border-t border-[#222] pt-6">
          <p className="text-xs uppercase tracking-widest text-[#888888] mb-4">Our Philosophy</p>
          <h2 className="text-2xl font-extrabold uppercase tracking-tight mb-4">If It&apos;s Worth Doing, It&apos;s Worth Doing Right</h2>
          <p className="text-[#888888] leading-relaxed">
            We believe gear should work as hard as the people carrying it. That means tight tolerances, durable materials, and designs refined through actual use. If it doesn&apos;t hold up in the field, it doesn&apos;t leave our hands.
          </p>
        </div>

        <div className="border-t border-[#222] pt-6">
          <p className="text-xs uppercase tracking-widest text-[#888888] mb-4">Our Promise</p>
          <h2 className="text-2xl font-extrabold uppercase tracking-tight mb-4">Lifetime Guarantee</h2>
          <p className="text-[#888888] leading-relaxed">
            Every original Terra Fieldworks product is backed by a{' '}
            {/* First inline prose link on the site. Underlined rather than colour-shifted:
                in a grey paragraph a colour-only link is invisible until hover. */}
            <Link
              href="/policies/refund-policy"
              className="underline underline-offset-4 decoration-[#555] hover:text-white hover:decoration-white transition-colors"
            >
              lifetime guarantee
            </Link>
            . If anything goes wrong, even if it&apos;s your fault, we&apos;ll make it right. We stand behind what we build.
          </p>
        </div>

      </div>
    </main>
  );
}
