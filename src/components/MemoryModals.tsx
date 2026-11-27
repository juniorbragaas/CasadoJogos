import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ImagePlus,
  Plus,
  RotateCcw,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import {
  DEFAULT_MEMORY_FIGURES,
  MEMORY_MAX_PAIRS,
  MemoryChampionSummary,
  MemoryFigure,
  MemoryParticipant,
} from '../utils/memoryGameEngine';
import { MemoryFigureFace } from './MemoryCardArt';

/* ============================================================================
 * 1. Participants Management Modal
 * ========================================================================== */

interface MemoryParticipantsModalProps {
  isOpen: boolean;
  participants: readonly MemoryParticipant[];
  onAddParticipant: (name: string) => void;
  onRenameParticipant: (id: string, name: string) => void;
  onRemoveParticipant: (id: string) => void;
  onClose: () => void;
}

export function MemoryParticipantsModal({
  isOpen,
  participants,
  onAddParticipant,
  onRenameParticipant,
  onRemoveParticipant,
  onClose,
}: MemoryParticipantsModalProps) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = newName.trim();
    if (!cleaned) {
      setError('Digite o nome do participante.');
      inputRef.current?.focus();
      return;
    }
    onAddParticipant(cleaned);
    setNewName('');
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="memory-participants-backdrop"
          data-testid="memory-participants-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-participants-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="memory-participants-title"
                    className="font-display text-base font-bold text-slate-950"
                  >
                    Cadastro de Participantes
                  </h2>
                  <p className="text-xs text-slate-500">
                    Os jogadores jogam em sequência até errar um par.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar cadastro de participantes"
                className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-2">
                <label
                  htmlFor="memory-new-participant-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Adicionar participante
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    id="memory-new-participant-input"
                    data-testid="memory-new-participant-input"
                    type="text"
                    maxLength={32}
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Nome do participante..."
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                  <button
                    type="submit"
                    data-testid="memory-add-participant-btn"
                    className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Adicionar</span>
                  </button>
                </div>
                {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
              </form>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">
                  Participantes cadastrados ({participants.length})
                </p>
                <ul className="space-y-2">
                  {participants.map((player, index) => (
                    <li
                      key={player.id}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-mono text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        aria-label={`Nome do participante ${index + 1}`}
                        maxLength={32}
                        value={player.name}
                        onChange={(e) => onRenameParticipant(player.id, e.target.value)}
                        className="flex-1 min-w-0 h-8 px-2.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-white bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={participants.length <= 1}
                        onClick={() => onRemoveParticipant(player.id)}
                        aria-label={`Remover participante ${player.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
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

/* ============================================================================
 * 2. Figures Management Modal (Unlimited Custom Uploads saved in IndexedDB)
 * ========================================================================== */

interface MemoryFiguresModalProps {
  isOpen: boolean;
  customFigures: readonly MemoryFigure[];
  includeBuiltins: boolean;
  onUploadFigures: (files: File[]) => Promise<void>;
  onDeleteCustomFigure: (id: string) => Promise<void>;
  onClearCustomFigures: () => Promise<void>;
  onToggleIncludeBuiltins: (next: boolean) => void;
  onClose: () => void;
}

export function MemoryFiguresModal({
  isOpen,
  customFigures,
  includeBuiltins,
  onUploadFigures,
  onDeleteCustomFigure,
  onClearCustomFigures,
  onToggleIncludeBuiltins,
  onClose,
}: MemoryFiguresModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    setErrorMsg(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setBusy(true);
    setFeedback(null);
    setErrorMsg(null);
    try {
      await onUploadFigures(files);
      setFeedback(
        `${files.length} ${files.length === 1 ? 'nova figura adicionada' : 'novas figuras adicionadas'} e salvas localmente.`
      );
    } catch {
      setErrorMsg('Não foi possível salvar as imagens selecionadas.');
    } finally {
      setBusy(false);
    }
  };

  const totalPool =
    customFigures.length + (includeBuiltins ? DEFAULT_MEMORY_FIGURES.length : 0);
  const pairsPerGame = Math.min(MEMORY_MAX_PAIRS, Math.max(1, totalPool));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="memory-figures-backdrop"
          data-testid="memory-figures-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-figures-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[86vh]"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ImagePlus className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="memory-figures-title"
                    className="font-display text-base font-bold text-slate-950"
                  >
                    Figuras do Jogo da Memória
                  </h2>
                  <p className="text-xs text-slate-500">
                    Insira quantas figuras quiser — cada partida sorteia até {MEMORY_MAX_PAIRS} pares ({MEMORY_MAX_PAIRS * 2} cartas).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar gerenciador de figuras"
                className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Upload bar */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    Inserir novas figuras
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                    Banco atual: {customFigures.length} personalizadas · {includeBuiltins ? DEFAULT_MEMORY_FIGURES.length : 0} padrão · {pairsPerGame} pares por jogo
                  </p>
                </div>

                <input
                  ref={inputRef}
                  data-testid="memory-upload-figures-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFilesChange}
                  className="sr-only"
                  aria-label="Inserir novas figuras"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  <ImagePlus className="w-4 h-4" aria-hidden="true" />
                  <span>Selecionar Imagens</span>
                </button>
              </div>

              {customFigures.length > 0 && (
                <label className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                  <span className="font-medium">
                    Completar até 16 pares com figuras padrão quando houver menos de 16 personalizadas
                  </span>
                  <input
                    type="checkbox"
                    checked={includeBuiltins}
                    onChange={(e) => onToggleIncludeBuiltins(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>
              )}

              {feedback && (
                <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{feedback}</span>
                </div>
              )}

              {errorMsg && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                  {errorMsg}
                </div>
              )}

              {/* Custom Figures Gallery */}
              {customFigures.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Suas Figuras ({customFigures.length})
                    </h3>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        await onClearCustomFigures();
                        setFeedback('Figuras personalizadas removidas.');
                        setBusy(false);
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Remover todas
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                    {customFigures.map((fig) => (
                      <div
                        key={fig.id}
                        className="group relative aspect-[3/4] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
                      >
                        <MemoryFigureFace figure={fig} compact={true} isMatched={false} />
                        <button
                          type="button"
                          onClick={() => void onDeleteCustomFigure(fig.id)}
                          aria-label={`Excluir figura ${fig.name}`}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Built-in Figures Preview */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Figuras Padrão Disponíveis ({DEFAULT_MEMORY_FIGURES.length})
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {DEFAULT_MEMORY_FIGURES.map((fig) => (
                    <div
                      key={fig.id}
                      className="aspect-[3/4] rounded-xl border border-slate-200 overflow-hidden"
                    >
                      <MemoryFigureFace figure={fig} compact={true} isMatched={false} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
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

/* ============================================================================
 * 3. Champion Victory Modal
 * ========================================================================== */

interface MemoryChampionModalProps {
  summary: MemoryChampionSummary | null;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function MemoryChampionModal({
  summary,
  onPlayAgain,
  onClose,
}: MemoryChampionModalProps) {
  useEffect(() => {
    if (!summary) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [summary, onClose]);

  return (
    <AnimatePresence>
      {summary && (
        <motion.div
          key="memory-champion-backdrop"
          data-testid="memory-champion-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-champion-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl overflow-hidden"
          >
            {/* Royal Blue Champion Header */}
            <div className="relative bg-gradient-to-br from-[#1D4ED8] to-[#1E3A8A] text-white px-6 py-6 text-center">
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar resultado da partida"
                className="absolute top-3 right-3 p-1.5 rounded-lg text-white/75 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg mb-3">
                <Trophy className="w-7 h-7" aria-hidden="true" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                {summary.isTie ? 'Fim de Jogo · Empate!' : 'Participante Campeão'}
              </p>

              <h2
                id="memory-champion-title"
                data-testid="memory-champion-name"
                className="font-display text-2xl sm:text-3xl font-bold mt-1 text-white"
              >
                {summary.champions.map((c) => c.name).join(' & ')}
              </h2>

              <p
                data-testid="memory-champion-score"
                className="mt-2 inline-block px-3.5 py-1 rounded-lg bg-white/15 border border-white/25 font-mono text-sm font-bold text-white tabular-nums"
              >
                {summary.topScore} {summary.topScore === 1 ? 'ponto' : 'pontos'} ({summary.topScore}{' '}
                {summary.topScore === 1 ? 'par' : 'pares'})
              </p>
            </div>

            {/* Final Standings */}
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500">
                  Placar final da rodada
                </p>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {summary.ranking.map((player, idx) => {
                    const isWinner = player.score === summary.topScore;
                    return (
                      <li
                        key={player.id}
                        className={`px-3.5 py-2.5 flex items-center justify-between text-sm ${
                          isWinner ? 'bg-blue-50/70 font-semibold text-slate-950' : 'bg-white text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 tabular-nums ${
                              isWinner
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate">{player.name}</span>
                        </span>
                        <span className="font-mono text-xs font-bold tabular-nums text-slate-900 shrink-0">
                          {player.score} {player.score === 1 ? 'pt' : 'pts'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="text-xs text-slate-500 text-center">
                As cartas já foram embaralhadas novamente para a próxima partida.
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  data-testid="memory-play-again-btn"
                  onClick={onPlayAgain}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Começar Novo Jogo</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
