"use client";

import { useState, useMemo, useCallback } from "react";
import { ITEMS_PER_PAGE } from "../lib/constants/booking";

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {},
) {
  const { initialPage = 1, pageSize = ITEMS_PER_PAGE } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(items.length / pageSize);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  const goToFirst = useCallback(() => setCurrentPage(1), []);
  const goToLast = useCallback(
    () => setCurrentPage(totalPages),
    [totalPages],
  );
  const goToPrevious = useCallback(
    () => setCurrentPage((p) => Math.max(1, p - 1)),
    [],
  );
  const goToNext = useCallback(
    () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    [totalPages],
  );

  // Reset to page 1 when items change significantly
  const resetPage = useCallback(() => setCurrentPage(1), []);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    startIndex,
    endIndex,
    pageSize,
    goToPage,
    goToFirst,
    goToLast,
    goToPrevious,
    goToNext,
    resetPage,
    setCurrentPage,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
}
