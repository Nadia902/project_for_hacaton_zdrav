'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { RatingForm } from '@/components/Rating/RatingForm';
import type { ObjectType, Rating } from '@/types';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  objectId: string;
  objectType: ObjectType;
  objectName: string;
  onSuccess?: () => void;
  initialRating?: Rating;
  isEditMode?: boolean;
}

export function RatingModal({
  isOpen,
  onClose,
  objectId,
  objectType,
  objectName,
  onSuccess,
  initialRating,
  isEditMode = false,
}: RatingModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  // Предотвращаем скролл body когда модалка открыта
  useEffect(() => {
    if (isOpen && mounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, mounted]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
          />

          {/* Modal - центрирование по экрану */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[90vh] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/50 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {isEditMode ? 'Редактировать отзыв' : 'Оценить объект'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{objectName}</p>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
                  aria-label="Закрыть"
                >
                  <XMarkIcon className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <RatingForm
                  objectId={objectId}
                  objectType={objectType}
                  onSuccess={handleSuccess}
                  onCancel={onClose}
                  initialRating={initialRating ? {
                    id: initialRating.id,
                    criterionRatings: initialRating.criterionRatings,
                    comment: initialRating.comment,
                    photos: initialRating.photos,
                  } : undefined}
                  isEditMode={isEditMode}
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

