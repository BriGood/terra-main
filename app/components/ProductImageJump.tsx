'use client';

import { createContext, useCallback, useContext, useMemo, useRef } from 'react';

// Lets the variant selector move the product carousel without the two sharing a
// client parent: the carousel registers a handler, the selector asks it to show
// an image by URL. Candidates are tried in order and the first one that is in
// the carousel wins; none matching leaves the carousel where it is.
type JumpHandler = (urls: (string | null | undefined)[]) => void;

type ContextValue = {
  register: (handler: JumpHandler) => () => void;
  showImage: JumpHandler;
};

const ProductImageJumpContext = createContext<ContextValue>({
  register: () => () => {},
  showImage: () => {},
});

export function ProductImageJumpProvider({ children }: { children: React.ReactNode }) {
  const handlerRef = useRef<JumpHandler | null>(null);

  const register = useCallback((handler: JumpHandler) => {
    handlerRef.current = handler;
    return () => {
      if (handlerRef.current === handler) handlerRef.current = null;
    };
  }, []);

  const showImage = useCallback<JumpHandler>((urls) => handlerRef.current?.(urls), []);

  const value = useMemo(() => ({ register, showImage }), [register, showImage]);
  return <ProductImageJumpContext.Provider value={value}>{children}</ProductImageJumpContext.Provider>;
}

export function useProductImageJump() {
  return useContext(ProductImageJumpContext);
}

// Shopify CDN URLs carry a cache-busting ?v= that can differ between a swatch's
// file reference and the product's own media, so compare on the path alone.
export function imagePath(url: string): string {
  return url.split('?')[0];
}
