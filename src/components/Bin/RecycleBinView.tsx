import React, { useState } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Check, 
  HardDrive, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import { BinItem } from '../../types';
import { formatBytes } from '../../utils/sampleData';

interface RecycleBinViewProps {
  binItems: BinItem[];
  onRestoreItem: (item: BinItem) => void;
  onRestoreMultiple: (items: BinItem[]) => void;
  onDeletePermanently: (id: string) => void;
  onEmptyBin: () => void;
  onBackToGallery: () => void;
}

export const RecycleBinView: React.FC<RecycleBinViewProps> = ({
  binItems,
  onRestoreItem,
  onRestoreMultiple,
  onDeletePermanently,
  onEmptyBin,
  onBackToGallery,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showEmptyConfirm, setShowEmptyConfirm] = useState<boolean>(false);

  // Calculate days remaining
  const getDaysRemaining = (expiresAt: number): number => {
    const msRemaining = expiresAt - Date.now();
    const days = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const totalBinSize = binItems.reduce((acc, item) => acc + item.photo.size, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === binItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(binItems.map((item) => item.id)));
    }
  };

  const handleRestoreSelected = () => {
    const toRestore = binItems.filter((item) => selectedIds.has(item.id));
    if (toRestore.length > 0) {
      onRestoreMultiple(toRestore);
      setSelectedIds(new Set());
    }
  };

  const handleDeletePermanentlySelected = () => {
    selectedIds.forEach((id) => onDeletePermanently(id));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Bin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">30-Day Recycle Bin</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Photos are automatically saved here for 30 days before permanent deletion.</span>
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {binItems.length > 0 && (
            <button
              onClick={() => setShowEmptyConfirm(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All Once</span>
            </button>
          )}

          <button
            onClick={onBackToGallery}
            className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Photos</span>
          </button>
        </div>
      </div>

      {/* Batch toolbar if items exist */}
      {binItems.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-xs sm:text-sm text-slate-300 hover:text-white font-medium"
            >
              {selectedIds.size === binItems.length ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>
                {selectedIds.size === binItems.length ? 'Deselect All' : 'Select All'}
              </span>
            </button>
            <span className="text-xs text-slate-400 border-l border-slate-700 pl-3">
              <strong className="text-white">{selectedIds.size}</strong> of {binItems.length} selected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline-block text-xs font-mono text-slate-400 mr-2">
              Total Bin Size: {formatBytes(totalBinSize)}
            </span>

            <button
              onClick={handleRestoreSelected}
              disabled={selectedIds.size === 0}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedIds.size > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore ({selectedIds.size})</span>
            </button>

            <button
              onClick={handleDeletePermanentlySelected}
              disabled={selectedIds.size === 0}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedIds.size > 0
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Permanently</span>
            </button>
          </div>
        </div>
      )}

      {/* Bin Items Grid */}
      {binItems.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-6">
          <Trash2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Recycle Bin is empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Photos you swipe left to delete or delete in batch will be stored safely here for 30 days before being permanently removed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {binItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const daysLeft = getDaysRemaining(item.expiresAt);

            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border transition-all ${
                  isSelected
                    ? 'border-rose-500 ring-2 ring-rose-500/40 scale-[0.98]'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <img
                  src={item.photo.url}
                  alt={item.photo.name}
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-md bg-rose-500 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md border border-slate-400 bg-black/30" />
                  )}
                </div>

                {/* 30-Day Expiration Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur border border-rose-500/30 text-[10px] font-bold text-rose-300 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>{daysLeft}d left</span>
                </div>

                {/* Action buttons on hover */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs z-10">
                  <span className="truncate max-w-[50%] text-[10px] text-slate-300 font-medium">
                    {item.photo.name}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreItem(item);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-slate-950 font-bold transition shadow"
                      title="Restore to Gallery"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePermanently(item.id);
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white transition shadow"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Empty Bin Modal ("Delete all once") */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Empty Entire Bin?</h3>
              <p className="text-xs text-slate-400">
                This will permanently delete all {binItems.length} photos ({formatBytes(totalBinSize)}). This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onEmptyBin();
                  setShowEmptyConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30"
              >
                Delete All Once
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
