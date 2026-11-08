import Link from '@/app/components/HoverPrefetchLink';
import { SITE_URL } from '@/lib/site';

type Crumb = { label: string; href?: string };

// Display labels are stylized (e.g. "HØme"); normalize to plain words for the
// structured-data names search engines read.
function seoName(label: string): string {
  return label.replace(/Ø/g, 'o');
}

export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: seoName(crumb.label),
      ...(crumb.href ? { item: `${SITE_URL}${crumb.href}` } : {}),
    })),
  };

  return (
    <nav className="fixed top-24 left-0 right-0 z-40 bg-black flex items-center gap-2 text-xs uppercase tracking-widest text-[#555] px-6 lg:px-20 py-2 border-b border-[#222]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-white transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-[#888888]">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
