import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Calendar, 
  HardDrive, 
  Maximize2 
} from 'lucide-react';
import { PhotoItem } from '../../types';
import { formatBytes } from '../../utils/sampleData';

interface PhotoLightboxProps {
  photo: PhotoItem;
  onClose: () => void;
  onDeleteToBin: (photo: PhotoItem) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  onClose,
  onDeleteToBin,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = photo.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6">
      {/* Top action bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20">
        <div className="flex items-center space-x-3 max-w-[60%] truncate">
          <p className="font-semibold text-sm sm:text-base truncate">{photo.name}</p>
          <span className="hidden sm:inline-block text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
            {formatBytes(photo.size)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Download photo"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              onDeleteToBin(photo);
              onClose();
            }}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition"
            title="Move to 30-Day Bin"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition ml-2"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <img
          src={photo.url}
          alt={photo.name}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
          }}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
        />
      </div>

      {/* Bottom metadata pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur text-xs text-slate-400 flex items-center space-x-4">
        <span className="flex items-center space-x-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
        </span>
        {photo.width && photo.height && (
          <span className="flex items-center space-x-1">
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{photo.width} × {photo.height}</span>
          </span>
        )}
        <span className="flex items-center space-x-1">
          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatBytes(photo.size)}</span>
        </span>
      </div>
    </div>
  );
};
