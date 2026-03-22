"use client";

import { useState, useCallback } from "react";

export function useModalState<T = undefined>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);

  const open = useCallback((modalData?: T) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(undefined);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) setData(undefined);
      return !prev;
    });
  }, []);

  return { isOpen, data, open, close, toggle };
}
