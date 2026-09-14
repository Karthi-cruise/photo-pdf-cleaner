import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  Trash2, 
  RotateCw, 
  Check, 
  Layers, 
  Sparkles, 
  Eye, 
  Plus, 
  Sliders, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { ScanPage, PDFDocumentItem } from '../../types';
import { PDFService } from '../../services/pdfService';
import { formatBytes } from '../../utils/sampleData';

interface DocumentScannerProps {
  onPDFCreated: (pdf: PDFDocumentItem) => void;
  onOpenPDFViewer: (pdf: PDFDocumentItem) => void;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  onPDFCreated,
  onOpenPDFViewer,
}) => {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [docTitle, setDocTitle] = useState<string>('My_Scanned_Document');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [createdPDF, setCreatedPDF] = useState<PDFDocumentItem | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please check permissions or upload photos.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture frame from video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      addPage(dataUrl);
    }
  };

  // Add captured or uploaded image to pages
  const addPage = (dataUrl: string) => {
    const newPage: ScanPage = {
      id: 'page_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      dataUrl,
      filter: 'contrast', // default to high-contrast document
      rotation: 0,
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageIndex(pages.length);
  };

  // Handle file uploads as document pages
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            addPage(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    }
  };

  // Filter change for current page
  const updateCurrentPageFilter = (filter: ScanPage['filter']) => {
    if (pages[activePageIndex]) {
      setPages((prev) =>
        prev.map((p, idx) => (idx === activePageIndex ? { ...p, filter } : p))
      );
    }
  };

  // Rotate current page
  const rotateCurrentPage = () => {
    if (pages[activePageIndex]) {
      setPages((prev) =>
        prev.map((p, idx) =>
          idx === activePageIndex
            ? { ...p, rotation: (p.rotation + 90) % 360 }
            : p
        )
      );
    }
  };

  // Remove page
  const removePage = (index: number) => {
    setPages((prev) => prev.filter((_, idx) => idx !== index));
    if (activePageIndex >= index && activePageIndex > 0) {
      setActivePageIndex(activePageIndex - 1);
    }
  };

  // Compile PDF
  const handleGeneratePDF = async () => {
    if (pages.length === 0) return;
    setIsGenerating(true);
    try {
      const pdfItem = await PDFService.createPDFFromPages(pages, docTitle);
      onPDFCreated(pdfItem);
      setCreatedPDF(pdfItem);
    } catch (err) {
      console.error('Failed to create PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentPage = pages[activePageIndex];

  return (
    <div className="space-y-6">
      {/* Scanner Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Camera className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Document Scanner & PDF Maker</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Capture pages via camera or upload images, apply document filters, and compile clean multi-page PDFs.
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex items-center space-x-2.5">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm transition"
            >
              <span>Stop Camera</span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload Images</span>
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="flex items-center space-x-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Live Camera Viewfinder (when active) */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/50 shadow-2xl max-w-2xl mx-auto">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-80 sm:h-96 object-cover"
          />

          {/* Viewfinder corner guides */}
          <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-lg">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
          </div>

          {/* Shutter Button */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-4">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-2xl transition transform active:scale-90"
              title="Capture Page"
            >
              <Camera className="w-7 h-7 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Document Workspace (when pages exist) */}
      {pages.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Active Page Preview with Filters */}
          <div className="lg:col-span-2 space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  Page {activePageIndex + 1} of {pages.length}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={rotateCurrentPage}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rotate</span>
                </button>
                <button
                  onClick={() => removePage(activePageIndex)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium text-rose-300 transition"
                  title="Delete page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Page</span>
                </button>
              </div>
            </div>

            {/* Filter Selection Tabs */}
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Filter:</span>
              {(
                [
                  { id: 'contrast', label: 'High Contrast' },
                  { id: 'bw', label: 'Document B&W' },
                  { id: 'grayscale', label: 'Grayscale' },
                  { id: 'original', label: 'Original' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => updateCurrentPageFilter(f.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                    currentPage.filter === f.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Preview Canvas / Image with filter simulated */}
            <div className="relative aspect-[3/4] max-h-[500px] w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 border border-slate-800">
              <img
                src={currentPage.dataUrl}
                alt={`Page ${activePageIndex + 1}`}
                style={{
                  transform: `rotate(${currentPage.rotation}deg)`,
                  filter:
                    currentPage.filter === 'bw'
                      ? 'grayscale(100%) contrast(250%) brightness(110%)'
                      : currentPage.filter === 'grayscale'
                      ? 'grayscale(100%)'
                      : currentPage.filter === 'contrast'
                      ? 'contrast(160%) brightness(105%)'
                      : 'none',
                }}
                className="max-h-full max-w-full object-contain shadow-2xl transition duration-200"
              />
            </div>
          </div>

          {/* PDF Details & Page Thumbnails Rail */}
          <div className="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>PDF Settings</span>
              </h3>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Document Title</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Document_Name"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-2">
                  Pages in Document ({pages.length})
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {pages.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`relative aspect-[3/4] rounded-lg overflow-hidden border cursor-pointer transition ${
                        activePageIndex === idx
                          ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                          : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={p.dataUrl}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/70 px-1 rounded text-[10px] text-white font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}

                  {/* Add more pages button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[3/4] rounded-lg border border-dashed border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 transition bg-slate-950/40"
                  >
                    <Plus className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">Add Page</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Generate PDF Button */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{isGenerating ? 'Generating PDF...' : `Compile ${pages.length}-Page PDF`}</span>
              </button>

              {createdPDF && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                  <span className="truncate">Saved: {createdPDF.title}</span>
                  <button
                    onClick={() => onOpenPDFViewer(createdPDF)}
                    className="flex items-center space-x-1 font-bold underline hover:text-white shrink-0 ml-2"
                  >
                    <span>View Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty scanner state */
        <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No pages scanned yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Click <strong>Start Camera</strong> to capture documents page by page, or click <strong>Upload Images</strong> to turn existing photos into a clean PDF document.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={startCamera}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm hover:bg-emerald-400 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Open Camera</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-700 transition"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Upload Photos</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
