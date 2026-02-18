import { useState, useRef, useCallback } from 'react';

/**
 * Reusable pull-to-refresh hook.
 * Attach the returned handlers to a scrollable container ref.
 * @param {function} onRefresh - async function to call on release
 * @param {number} threshold - pull distance (px) to trigger refresh
 */
export default function usePullToRefresh(onRefresh, threshold = 72) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(null);
  const scrollRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && scrollRef.current && scrollRef.current.scrollTop === 0) {
      setIsPulling(true);
      setPullDistance(Math.min(delta * 0.5, threshold + 20));
    }
  }, [threshold]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(0);
      setIsPulling(false);
      await onRefresh();
      setIsRefreshing(false);
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
    touchStartY.current = null;
  }, [pullDistance, threshold, onRefresh]);

  return { scrollRef, pullDistance, isPulling, isRefreshing, onTouchStart, onTouchMove, onTouchEnd };
}