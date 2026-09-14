import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Check, 
  Heart, 
  HardDrive, 
  Image as ImageIcon,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { PhotoItem } from '../../types';
import { formatBytes } from '../../utils/sampleData';
import { PhotoLightbox } from './PhotoLightbox';

interface PhotoGalleryProps {
  photos: PhotoItem[];
  onDeletePhotoToBin: (photo: PhotoItem) => void;
  onBatchDeleteToBin: (photos: PhotoItem[]) => void;
  onToggleFavorite: (photoId: string) => void;
  onOpenCleanDeck: () => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onDeletePhotoToBin,
  onBatchDeleteToBin,
  onToggleFavorite,
  onOpenCleanDeck,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);

  // Extract unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => p.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [photos]);

  // Filter photos
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag =
        selectedTag === 'all'
          ? true
          : selectedTag === 'favorites'
          ? p.favorite
          : p.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [photos, searchQuery, selectedTag]);

  // Total size
  const totalSize = useMemo(() => {
    return photos.reduce((acc, p) => acc + p.size, 0);
  }, [photos]);

  const toggleSelectPhoto = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredPhotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
    }
  };

  const handleBatchDelete = () => {
    const toDelete = photos.filter((p) => selectedIds.has(p.id));
    if (toDelete.length > 0) {
      onBatchDeleteToBin(toDelete);
      setSelectedIds(new Set());
      setIsSelectMode(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Mode Promotion Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/60 border border-emerald-500/20 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Photo Triage
              </span>
              <span className="text-xs text-slate-400">
                {photos.length} photos ready for review
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Declutter Your Gallery with <span className="text-emerald-400">Swipe Deck</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Tap the clean button to enter full-screen review mode. Swipe left to move unwanted photos to the 30-day bin, or swipe right to keep! You can also select many at a glance.
            </p>
          </div>

          <button
            onClick={onOpenCleanDeck}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Clean Deck</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search photos by name or tag..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
          />
        </div>

        {/* Selection mode & stats */}
        <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-auto">
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-800">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>{photos.length} items ({formatBytes(totalSize)})</span>
          </div>

          <button
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) setSelectedIds(new Set());
            }}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition ${
              isSelectMode
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>{isSelectMode ? 'Cancel' : 'Select'}</span>
          </button>
        </div>
      </div>

      {/* Tag pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedTag('all')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
            selectedTag === 'all'
              ? 'bg-emerald-500 text-slate-950 font-semibold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Photos ({photos.length})
        </button>
        <button
          onClick={() => setSelectedTag('favorites')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition flex items-center space-x-1 ${
            selectedTag === 'favorites'
              ? 'bg-rose-500 text-white font-semibold'
              : 'bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800'
          }`}
        >
          <Heart className="w-3 h-3 fill-current" />
          <span>Favorites</span>
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
              selectedTag === tag
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Batch Actions Bar (when in Select Mode) */}
      {isSelectMode && (
        <div className="sticky top-20 z-30 flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-xs sm:text-sm text-slate-300 hover:text-white font-medium"
            >
              {selectedIds.size === filteredPhotos.length ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>
                {selectedIds.size === filteredPhotos.length ? 'Deselect All' : 'Select All'}
              </span>
            </button>
            <span className="text-xs text-slate-400 border-l border-slate-700 pl-3">
              <strong className="text-emerald-400">{selectedIds.size}</strong> of {filteredPhotos.length} selected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                selectedIds.size > 0
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Move to Bin ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-medium text-slate-300">No photos found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or tag filter, or import new photos using the top Add Photos button.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredPhotos.map((photo) => {
            const isSelected = selectedIds.has(photo.id);
            return (
              <div
                key={photo.id}
                onClick={() => {
                  if (isSelectMode) {
                    toggleSelectPhoto(photo.id);
                  } else {
                    setActivePhoto(photo);
                  }
                }}
                className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-900 border transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-[0.98]'
                    : 'border-slate-800 hover:border-slate-700 hover:shadow-xl hover:scale-[1.02]'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  loading="lazy"
                  className="w-full h-full object-cover select-none transition duration-300 group-hover:scale-105"
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Checkbox badge */}
                {(isSelectMode || isSelected) && (
                  <div
                    onClick={(e) => toggleSelectPhoto(photo.id, e)}
                    className="absolute top-2 left-2 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition shadow-md bg-black/60 backdrop-blur"
                  >
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-slate-950">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md border border-slate-400 bg-black/30" />
                    )}
                  </div>
                )}

                {/* Favorite badge */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(photo.id);
                  }}
                  className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg backdrop-blur transition ${
                    photo.favorite
                      ? 'bg-rose-500/80 text-white'
                      : 'bg-black/50 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${photo.favorite ? 'fill-current' : ''}`} />
                </button>

                {/* Bottom title & size info */}
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-[11px] text-slate-200 truncate">
                  <span className="truncate max-w-[70%] font-medium">{photo.name}</span>
                  <span className="text-[10px] text-slate-400">{formatBytes(photo.size)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox for inspecting single photo */}
      {activePhoto && (
        <PhotoLightbox
          photo={activePhoto}
          onClose={() => setActivePhoto(null)}
          onDeleteToBin={(p) => {
            onDeletePhotoToBin(p);
            setActivePhoto(null);
          }}
        />
      )}
    </div>
  );
};
