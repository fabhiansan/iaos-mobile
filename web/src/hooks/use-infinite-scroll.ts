import { useEffect, useRef } from "react";

export function useInfiniteScroll(
  onLoadMore: () => void,
  { hasMore, loading }: { hasMore: boolean; loading: boolean }
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loading]);

  return sentinelRef;
}
