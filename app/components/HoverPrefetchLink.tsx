'use client';

import Link from 'next/link';
import { useState, type ComponentProps } from 'react';

// Drop-in for next/link that prefetches on intent (hover, focus, touch) instead
// of whenever the link scrolls into view. Viewport prefetching fired a Worker
// request for every visible nav, footer and product link on every page view,
// which counts against the Workers request quota without a single click.
export default function HoverPrefetchLink({
  onMouseEnter,
  onTouchStart,
  onFocus,
  ...props
}: ComponentProps<typeof Link>) {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onMouseEnter={(e) => {
        setActive(true);
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        setActive(true);
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        setActive(true);
        onFocus?.(e);
      }}
    />
  );
}
