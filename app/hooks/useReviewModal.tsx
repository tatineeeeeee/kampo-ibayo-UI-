'use client';

import { useState, useCallback } from 'react';

interface UseReviewModalProps {
  bookingId?: number;
  guestName?: string;
  guestEmail?: string;
  trigger?: 'post-booking' | 'prompt' | 'manual';
}

export const useReviewModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState<UseReviewModalProps>({});

  const openModal = useCallback((props: UseReviewModalProps = {}) => {
    setModalProps(props);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Clear props after animation
    setTimeout(() => {
      setModalProps({});
    }, 300);
  }, []);

  return {
    isOpen,
    modalProps,
    openModal,
    closeModal
  };
};