'use client';

import Link from '@/app/components/HoverPrefetchLink';
import { usePathname } from 'next/navigation';
import { InstagramIcon } from './Icons';

export default function Footer() {
  const pathname = usePathname();
  if (pathname === '/coming-soon') return null;

  return (
    <footer className="border-t border-[#222] mt-24 px-6 lg:px-20 py-12">
      <div className="grid grid-cols-2 gap-10 lg:flex lg:flex-row lg:justify-between lg:items-start">

        {/* Nav links */}
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-[#555] mb-1">Navigate</p>
          <Link href="/shop" className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors">ShØp</Link>
          <Link href="/about" className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors">AbØut</Link>
          <Link href="/contact" className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors">CØntact</Link>
        </div>

        {/* Legal links */}
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-[#555] mb-1">Legal</p>
          <Link href="/policies/privacy-policy" className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/policies/terms-of-service" className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/policies/refund-policy" className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors">Refund Policy</Link>
          <Link href="/policies/shipping-policy" className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors">Shipping Policy</Link>
        </div>

        {/* Socials + copyright */}
        <div className="flex flex-col gap-4 col-span-2 lg:col-span-1">
          <p className="text-xs uppercase tracking-widest text-[#555]">Follow</p>
          <a
            href="https://www.instagram.com/terrafieldworks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#888888] hover:text-white transition-colors"
            aria-label="Instagram"
          >
            <InstagramIcon />
          </a>
          <p className="text-xs text-[#555] mt-4">© 2026 Terra Fieldworks</p>
        </div>

      </div>
    </footer>
  );
}
