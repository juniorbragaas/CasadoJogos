import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { BKS_DECK_SIZE } from '../utils/bksDeckEngine';

interface BksImageManagerModalProps {
  isOpen: boolean;
  hasCustomBack: boolean;
  customBackName: string | null;
  customFrontCount: number;
  usePlaceholdersOnly: boolean;
  onUploadBack: (file: File) => Promise<void>;
  onUploadFronts: (files: File[]) => Promise<void>;
  onRestoreEmbeddedDeck: () => Promise<void>;
  onTogglePlaceholdersOnly: (enabled: boolean) => void;
  onClose: () => void;
}

export function BksImageManagerModal({
  isOpen,
  hasCustomBack,
  customBackName,
  customFrontCount,
  usePlaceholdersOnly,
  onUploadBack,
  onUploadFronts,
  onRestoreEmbeddedDeck,
  onTogglePlaceholdersOnly,
  onClose,
}: BksImageManagerModalProps) {
  const backInputRef = useRef<HTMLInputElement | null>(null);
  const frontsInputRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    setErrorMsg(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleBackChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    setErrorMsg(null);
    setFeedback(null);
    try {
      await onUploadBack(file);
      setFeedback(`Verso salvo permanentemente no navegador (${file.name}).`);
    } catch {
      setErrorMsg('Não foi possível salvar a imagem do verso. Tente outra imagem.');
    } finally {
      setBusy(false);
    }
  };

  const handleFrontsChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setBusy(true);
    setErrorMsg(null);
    setFeedback(null);
    try {
      await onUploadFronts(files);
      const count = Math.min(files.length, BKS_DECK_SIZE);
      setFeedback(
        `${count} ${count === 1 ? 'carta salva' : 'cartas salvas'} permanentemente no navegador (IndexedDB).`
      );
    } catch {
      setErrorMsg('Não foi possível salvar as imagens das cartas. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreDefaults = async () => {
    setBusy(true);
    setErrorMsg(null);
    setFeedback(null);
    try {
      await onRestoreEmbeddedDeck();
      setFeedback('Baralho oficial embutido (32+1) restaurado.');
    } catch {
      setErrorMsg('Não foi possível restaurar o baralho padrão.');
    } finally {
      setBusy(false);
    }
  };

  const hasAnyCustom = hasCustomBack || customFrontCount > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bks-manager-backdrop"
          data-testid="bks-manage-images-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bks-manager-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-[#181214] border border-white/15 text-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
              <div>
                <h2
                  id="bks-manager-title"
                  className="font-display text-lg font-bold tracking-tight text-white"
                >
                  Gerenciar Imagens (32+1)
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  As imagens enviadas ficam salvas localmente no navegador (IndexedDB).
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar gerenciador de imagens"
                className="p-2 -mr-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Current deck summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5">
                  <span className="block text-white/55">Verso do Baralho</span>
                  <span className="block font-semibold text-white mt-0.5 truncate">
                    {hasCustomBack
                      ? customBackName || 'Personalizado (salvo)'
                      : usePlaceholdersOnly
                        ? 'Placeholder estilizado'
                        : 'Imagem 00 embutida'}
                  </span>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5">
                  <span className="block text-white/55">Frentes das Cartas</span>
                  <span className="block font-semibold text-white mt-0.5 tabular-nums">
                    {customFrontCount > 0
                      ? `${customFrontCount}/32 personalizadas`
                      : usePlaceholdersOnly
                        ? '32 placeholders numerados'
                        : '32/32 embutidas'}
                  </span>
                </div>
              </div>

              {/* Upload 1: Back image */}
              <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-[#6B1218] border border-[#D8AF72]/35 flex items-center justify-center text-[#E6C285] shrink-0">
                    <ImageIcon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      1. Enviar Verso da Carta
                    </p>
                    <p className="text-xs text-white/55 mt-0.5">
                      Aceita 1 imagem para o verso padrão do baralho.
                    </p>
                  </div>
                </div>
                <input
                  ref={backInputRef}
                  data-testid="bks-upload-back-input"
                  type="file"
                  accept="image/*"
                  onChange={handleBackChange}
                  className="sr-only"
                  aria-label="Enviar Verso da Carta"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => backInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white/12 border border-white/20 hover:bg-white/20 text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Enviar Verso da Carta</span>
                </button>
              </div>

              {/* Upload 2: 32 Front images */}
              <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-[#6B1218] border border-[#D8AF72]/35 flex items-center justify-center text-[#E6C285] shrink-0">
                    <Layers className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      2. Enviar 32 Cartas (Frente)
                    </p>
                    <p className="text-xs text-white/55 mt-0.5">
                      Seleção múltipla de até 32 arquivos ordenados de 01 a 32.
                    </p>
                  </div>
                </div>
                <input
                  ref={frontsInputRef}
                  data-testid="bks-upload-fronts-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFrontsChange}
                  className="sr-only"
                  aria-label="Enviar 32 Cartas (Frente)"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => frontsInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white/12 border border-white/20 hover:bg-white/20 text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Enviar 32 Cartas (Frente)</span>
                </button>
              </div>

              {/* Feedback / Errors */}
              {feedback && (
                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-lg px-3.5 py-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{feedback}</span>
                </div>
              )}

              {errorMsg && (
                <div className="text-xs text-rose-200 bg-rose-500/15 border border-rose-400/30 rounded-lg px-3.5 py-2.5">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 bg-white/[0.03] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {hasAnyCustom && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleRestoreDefaults}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/12 border border-white/12 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Restaurar baralho padrão</span>
                  </button>
                )}

                {!hasAnyCustom && (
                  <button
                    type="button"
                    onClick={() => onTogglePlaceholdersOnly(!usePlaceholdersOnly)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/75 hover:text-white bg-white/5 hover:bg-white/12 border border-white/12 transition-colors cursor-pointer"
                  >
                    {usePlaceholdersOnly
                      ? 'Usar imagens embutidas (32+1)'
                      : 'Visualizar placeholders (1 a 32)'}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-950 hover:bg-white/90 transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
