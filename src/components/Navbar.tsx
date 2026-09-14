import React, { useRef } from 'react';
import { 
  Images, 
  ScanLine, 
  FileText, 
  Trash2, 
  Sparkles, 
  Upload, 
  ShieldCheck 
} from 'lucide-react';
import { ViewTab } from '../types';

interface NavbarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  photoCount: number;
  binCount: number;
  pdfCount: number;
  onStartCleanMode: () => void;
  onUploadPhotos: (files: FileList) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  photoCount,
  binCount,
  pdfCount,
  onStartCleanMode,
  onUploadPhotos,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadPhotos(e.target.files);
      e.target.value = ''; // reset
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('photos')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Images className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  Photo<span className="text-emerald-400">Vault</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  + DocScan
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Photos, Scanner, PDF Viewer & Clean Deck</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onTabChange('photos')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'photos'
                  ? 'bg-slate-800/90 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Images className="w-4 h-4" />
              <span className="hidden md:inline">Photos</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 font-mono">
                {photoCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('scanner')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'scanner'
                  ? 'bg-slate-800/90 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden md:inline">Scanner</span>
            </button>

            <button
              onClick={() => onTabChange('pdfs')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'pdfs'
                  ? 'bg-slate-800/90 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">PDF Viewer</span>
              {pdfCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 font-mono">
                  {pdfCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('bin')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'bin'
                  ? 'bg-rose-500/10 text-rose-400 shadow-sm border border-rose-500/20'
                  : 'text-slate-300 hover:text-rose-400 hover:bg-slate-800/50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">30-Day Bin</span>
              {binCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                  {binCount}
                </span>
              )}
            </button>
          </nav>

          {/* Action Buttons: Quick Clean (Star Feature) & Import */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Clean Icon Button */}
            <button
              onClick={onStartCleanMode}
              title="Touch to review photos: Swipe Left to Delete, Swipe Right to Keep"
              className="relative group flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">Clean Deck</span>
              <span className="sm:hidden">Clean</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
              </span>
            </button>

            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition"
              title="Import photos from device"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Add Photos</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
