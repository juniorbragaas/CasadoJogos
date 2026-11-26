import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import {
  BksCardDefinition,
  formatBksCardNumber,
} from '../utils/bksDeckEngine';

interface BksCardModalProps {
  card: BksCardDefinition | null;
  frontSrc: string | null;
  imageBroken: boolean;
  onImageError: (cardId: number) => void;
  onClose: () => void;
}

export function BksCardModal({
  card,
  frontSrc,
  imageBroken,
  onImageError,
  onClose,
}: BksCardModalProps) {
  useEffect(() => {
    if (!card) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, onClose]);

  const showImage = Boolean(frontSrc) && !imageBroken;

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key="bks-card-modal-backdrop"
          data-testid="bks-card-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Carta ${formatBksCardNumber(card.id)} — ${card.title}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 sm:p-8"
        >
          {/* Close button anchored cleanly at top-right */}
          <button
            type="button"
            data-testid="bks-card-modal-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Fechar visualização da carta"
            className="fixed top-5 right-5 z-60 w-11 h-11 rounded-full bg-white/12 border border-white/25 text-white hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Centered high-definition card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center justify-center max-w-[92vw] max-h-[88vh]"
          >
            <div className="relative h-[78vh] max-h-[740px] max-w-[88vw] aspect-[5/7] rounded-2xl overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.75)] ring-1 ring-[#D8AF72]/45 bg-[#460B10]">
              {showImage && frontSrc ? (
                <img
                  src={frontSrc}
                  alt={`Carta ${formatBksCardNumber(card.id)} — ${card.title} (${card.suitLabel})`}
                  referrerPolicy="no-referrer"
                  onError={() => onImageError(card.id)}
                  className="w-full h-full object-contain select-none"
                />
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-b from-[#5A1014] to-[#3B080C] border-2 border-[#D8AF72]/60 rounded-2xl text-[#F5E6CC]">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col items-center leading-none">
                      <span className="font-display text-3xl sm:text-4xl font-bold text-[#E6C285] tabular-nums">
                        {formatBksCardNumber(card.id)}
                      </span>
                      <span className="text-2xl text-[#D8AF72] mt-1">
                        {card.suitSymbol}
                      </span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D8AF72]/90">
                      {card.suitLabel}
                    </span>
                  </div>

                  <div className="text-center space-y-3 my-auto">
                    <span className="inline-block font-mono text-xs uppercase tracking-[0.25em] text-[#D8AF72]/80">
                      BARALHO BKS
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#FFF7EA] tracking-tight">
                      Carta {formatBksCardNumber(card.id)}
                    </h2>
                    <p className="text-sm text-[#E9D5B5]/85">{card.title}</p>
                  </div>

                  <div className="flex items-end justify-end">
                    <span className="font-display text-2xl font-bold text-[#E6C285] tabular-nums">
                      {card.suitSymbol} {formatBksCardNumber(card.id)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
