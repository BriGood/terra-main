import type { Metadata } from 'next';

// Journal posts aren't wired to a data source yet — derive a readable title from
// the slug for now. Replace with real post data (title/excerpt) once available.
function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// No posts to prerender yet; an empty list still opts the route into caching,
// so each slug renders once on first visit instead of on every request.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = titleFromSlug(slug);
  return {
    title,
    alternates: { canonical: `/journal/${slug}` },
  };
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-black text-white px-6 py-24 lg:px-20">
      <h1 className="text-4xl font-extrabold uppercase tracking-tight">{slug}</h1>
    </main>
  );
}
