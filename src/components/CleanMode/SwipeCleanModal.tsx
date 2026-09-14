import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Trash2, 
  Check, 
  RotateCcw, 
  Grid, 
  Layers, 
  Sparkles, 
  CheckSquare, 
  Square, 
  HardDrive, 
  ArrowLeft, 
  ArrowRight,
  Info
} from 'lucide-react';
import { PhotoItem } from '../../types';
import { formatBytes } from '../../utils/sampleData';

interface SwipeCleanModalProps {
  photos: PhotoItem[];
  onClose: () => void;
  onDeletePhotoToBin: (photo: PhotoItem) => void;
  onBatchDeleteToBin: (photos: PhotoItem[]) => void;
  onOpenBin: () => void;
}

interface ActionHistory {
  type: 'delete' | 'keep';
  photo: PhotoItem;
}

export const SwipeCleanModal: React.FC<SwipeCleanModalProps> = ({
  photos: initialPhotos,
  onClose,
  onDeletePhotoToBin,
  onBatchDeleteToBin,
  onOpenBin,
}) => {
  // Queue of photos to review
  const [deck, setDeck] = useState<PhotoItem[]>(initialPhotos);
  const [history, setHistory] = useState<ActionHistory[]>([]);
  const [viewMode, setViewMode] = useState<'deck' | 'batch'>('deck');
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<string>>(new Set());
  
  // Track stats
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [deletedBytes, setDeletedBytes] = useState<number>(0);
  const [keptCount, setKeptCount] = useState<number>(0);

  // Drag state for top card
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const totalPhotos = initialPhotos.length;
  const reviewedCount = deletedCount + keptCount;
  const progressPercent = totalPhotos > 0 ? Math.round((reviewedCount / totalPhotos) * 100) : 100;

  const currentCard = deck[0];
  const nextCard = deck[1];

  // Trigger celebration when queue is cleared
  useEffect(() => {
    if (totalPhotos > 0 && deck.length === 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [deck.length, totalPhotos]);

  // Handle Swipe Actions
  const handleKeep = () => {
    if (!currentCard) return;
    setHistory((prev) => [...prev, { type: 'keep', photo: currentCard }]);
    setKeptCount((prev) => prev + 1);
    setDeck((prev) => prev.slice(1));
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDelete = () => {
    if (!currentCard) return;
    onDeletePhotoToBin(currentCard);
    setHistory((prev) => [...prev, { type: 'delete', photo: currentCard }]);
    setDeletedCount((prev) => prev + 1);
    setDeletedBytes((prev) => prev + currentCard.size);
    setDeck((prev) => prev.slice(1));
    setDragOffset({ x: 0, y: 0 });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    if (lastAction.type === 'delete') {
      setDeletedCount((prev) => Math.max(0, prev - 1));
      setDeletedBytes((prev) => Math.max(0, prev - lastAction.photo.size));
      // Add back to deck front
      setDeck((prev) => [lastAction.photo, ...prev]);
    } else {
      setKeptCount((prev) => Math.max(0, prev - 1));
      setDeck((prev) => [lastAction.photo, ...prev]);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'deck' || !currentCard) return;
      if (e.key === 'ArrowLeft') {
        handleDelete();
      } else if (e.key === 'ArrowRight') {
        handleKeep();
      } else if (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey)) {
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, viewMode, history]);

  // Touch / Mouse Drag handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 110;
    if (dragOffset.x < -threshold) {
      handleDelete();
    } else if (dragOffset.x > threshold) {
      handleKeep();
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Batch Mode Operations ("Select many at a glance")
  const toggleBatchSelect = (id: string) => {
    setBatchSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchSelectAll = () => {
    if (batchSelectedIds.size === deck.length) {
      setBatchSelectedIds(new Set());
    } else {
      setBatchSelectedIds(new Set(deck.map((p) => p.id)));
    }
  };

  const handleBatchDeleteSelected = () => {
    const toDelete = deck.filter((p) => batchSelectedIds.has(p.id));
    if (toDelete.length === 0) return;

    onBatchDeleteToBin(toDelete);
    const freed = toDelete.reduce((acc, p) => acc + p.size, 0);
    setDeletedCount((prev) => prev + toDelete.length);
    setDeletedBytes((prev) => prev + freed);
    setDeck((prev) => prev.filter((p) => !batchSelectedIds.has(p.id)));
    setBatchSelectedIds(new Set());
  };

  const handleBatchKeepSelected = () => {
    const toKeep = deck.filter((p) => batchSelectedIds.has(p.id));
    if (toKeep.length === 0) return;

    setKeptCount((prev) => prev + toKeep.length);
    setDeck((prev) => prev.filter((p) => !batchSelectedIds.has(p.id)));
    setBatchSelectedIds(new Set());
  };

  // Rotation and opacity calculations
  const dragRotate = (dragOffset.x / 20);
  const deleteOpacity = Math.min(1, Math.max(0, -dragOffset.x / 90));
  const keepOpacity = Math.min(1, Math.max(0, dragOffset.x / 90));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl select-none animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950">
            <Sparkles className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center space-x-2">
              <span>Clean Deck</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {deck.length} remaining
              </span>
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              Swipe Left to Delete • Swipe Right to Keep • Or Select Many at a Glance
            </p>
          </div>
        </div>

        {/* Mode Toggle & Close */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Deck vs Batch Mode Toggle */}
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setViewMode('deck')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'deck'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Swipe Deck</span>
            </button>
            <button
              onClick={() => setViewMode('batch')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'batch'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Select at Glance</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Close Clean Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress & Storage Stats Bar */}
      <div className="px-4 sm:px-8 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <span>
            Reviewed: <strong className="text-white">{reviewedCount}</strong> / {totalPhotos}
          </span>
          <span className="text-rose-400">
            Deleted to Bin: <strong>{deletedCount}</strong>
          </span>
          <span className="text-emerald-400">
            Kept: <strong>{keptCount}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-3 font-mono">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Freed: <strong className="text-emerald-400">{formatBytes(deletedBytes)}</strong></span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col items-center justify-center p-4">
        {deck.length === 0 ? (
          /* Deck Complete State */
          <div className="text-center max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">All Clean!</h3>
            <p className="text-sm text-slate-400 mt-2">
              You've triaged your photo queue.
            </p>
            <div className="grid grid-cols-2 gap-3 my-6 text-left p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Kept in Gallery</p>
                <p className="text-xl font-bold text-emerald-400">{keptCount} photos</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Moved to 30-Day Bin</p>
                <p className="text-xl font-bold text-rose-400">{deletedCount} photos</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800/80">
                <p className="text-[11px] text-slate-500 uppercase font-semibold">Storage Cleaned</p>
                <p className="text-base font-bold text-white">{formatBytes(deletedBytes)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {deletedCount > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenBin();
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold transition"
                >
                  View 30-Day Bin
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition"
              >
                Back to Gallery
              </button>
            </div>
          </div>
        ) : viewMode === 'deck' ? (
          /* 1-by-1 Swipe Deck View */
          <div className="w-full max-w-md h-full max-h-[580px] flex flex-col items-center justify-between">
            {/* Cards Stack Container */}
            <div className="relative w-full flex-1 flex items-center justify-center">
              {/* Background Card Preview (Next up) */}
              {nextCard && (
                <div className="absolute w-full h-[85%] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/60 shadow-xl scale-95 translate-y-4 opacity-50 pointer-events-none">
                  <img
                    src={nextCard.url}
                    alt={nextCard.name}
                    className="w-full h-full object-cover blur-[1px]"
                  />
                </div>
              )}

              {/* Active Swipe Card */}
              {currentCard && (
                <div
                  ref={cardRef}
                  onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                  onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                  onMouseUp={handlePointerUp}
                  onTouchStart={(e) =>
                    handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)
                  }
                  onTouchMove={(e) =>
                    handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
                  }
                  onTouchEnd={handlePointerUp}
                  style={{
                    transform: `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.4}px, 0) rotate(${dragRotate}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                  }}
                  className="relative w-full h-[90%] rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 shadow-2xl touch-none select-none flex flex-col justify-between"
                >
                  {/* Photo Display */}
                  <div className="relative w-full h-full">
                    <img
                      src={currentCard.url}
                      alt={currentCard.name}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/20 to-black/30 pointer-events-none" />

                    {/* "DELETE" Rubber Stamp Badge (appears when swiping left) */}
                    <div
                      style={{ opacity: deleteOpacity }}
                      className="absolute top-8 right-8 rotate-12 border-4 border-rose-500 text-rose-500 font-black text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl tracking-wider uppercase bg-black/40 backdrop-blur pointer-events-none"
                    >
                      DELETE
                    </div>

                    {/* "KEEP" Rubber Stamp Badge (appears when swiping right) */}
                    <div
                      style={{ opacity: keepOpacity }}
                      className="absolute top-8 left-8 -rotate-12 border-4 border-emerald-400 text-emerald-400 font-black text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl tracking-wider uppercase bg-black/40 backdrop-blur pointer-events-none"
                    >
                      KEEP
                    </div>

                    {/* Photo Info Bottom Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
                      <h3 className="font-bold text-base sm:text-lg truncate drop-shadow-md">
                        {currentCard.name}
                      </h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1">
                        <span>{formatBytes(currentCard.size)}</span>
                        <span>•</span>
                        <span>{new Date(currentCard.createdAt).toLocaleDateString()}</span>
                        {currentCard.tags && currentCard.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400">#{currentCard.tags[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tactile Control Buttons underneath Deck */}
            <div className="flex items-center justify-center space-x-6 py-4 w-full">
              {/* Swipe Left / Delete Button */}
              <button
                onClick={handleDelete}
                className="group flex flex-col items-center space-y-1 transform active:scale-90 transition"
                title="Swipe Left to Delete (moves to 30-Day Bin)"
              >
                <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-rose-500/50 group-hover:border-rose-500 group-hover:bg-rose-500/10 text-rose-400 flex items-center justify-center shadow-lg transition">
                  <Trash2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-rose-400">Delete (←)</span>
              </button>

              {/* Undo Button */}
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className={`group flex flex-col items-center space-y-1 transform active:scale-90 transition ${
                  history.length === 0 ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                title="Undo last swipe"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 text-slate-400 group-hover:text-white flex items-center justify-center shadow transition">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-400">Undo</span>
              </button>

              {/* Swipe Right / Keep Button */}
              <button
                onClick={handleKeep}
                className="group flex flex-col items-center space-y-1 transform active:scale-90 transition"
                title="Swipe Right to Keep"
              >
                <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-emerald-500/50 group-hover:border-emerald-500 group-hover:bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-lg transition">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-emerald-400">Keep (→)</span>
              </button>
            </div>
          </div>
        ) : (
          /* "Select Many at a Glance" Batch Grid View */
          <div className="w-full h-full flex flex-col overflow-hidden max-w-5xl">
            {/* Batch Toolbar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 mb-4 flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBatchSelectAll}
                  className="flex items-center space-x-2 text-xs sm:text-sm text-slate-200 hover:text-white font-medium"
                >
                  {batchSelectedIds.size === deck.length ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  <span>
                    {batchSelectedIds.size === deck.length ? 'Deselect All' : 'Select All'}
                  </span>
                </button>
                <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
                  <strong className="text-white">{batchSelectedIds.size}</strong> selected
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBatchKeepSelected}
                  disabled={batchSelectedIds.size === 0}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    batchSelectedIds.size > 0
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Keep Selected ({batchSelectedIds.size})</span>
                </button>

                <button
                  onClick={handleBatchDeleteSelected}
                  disabled={batchSelectedIds.size === 0}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    batchSelectedIds.size > 0
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete to 30-Day Bin ({batchSelectedIds.size})</span>
                </button>
              </div>
            </div>

            {/* Batch Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {deck.map((photo) => {
                  const isSelected = batchSelectedIds.has(photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => toggleBatchSelect(photo.id)}
                      className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-rose-500 ring-2 ring-rose-500/40 scale-[0.98]'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-md bg-rose-500 flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border border-slate-400 bg-black/30" />
                        )}
                      </div>

                      {/* Photo Name & Size */}
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-slate-200 truncate">
                        <span className="truncate block">{photo.name}</span>
                        <span className="text-slate-400">{formatBytes(photo.size)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
