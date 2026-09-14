import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  Upload, 
  ArrowLeft, 
  Calendar, 
  HardDrive, 
  Printer, 
  Plus 
} from 'lucide-react';
import { PDFDocumentItem } from '../../types';
import { formatBytes } from '../../utils/sampleData';

interface InbuiltPDFViewerProps {
  pdfs: PDFDocumentItem[];
  activePDF: PDFDocumentItem | null;
  onSelectPDF: (pdf: PDFDocumentItem | null) => void;
  onDeletePDF: (id: string) => void;
  onImportPDF: (file: File) => void;
  onNavigateToScanner: () => void;
}

export const InbuiltPDFViewer: React.FC<InbuiltPDFViewerProps> = ({
  pdfs,
  activePDF,
  onSelectPDF,
  onDeletePDF,
  onImportPDF,
  onNavigateToScanner,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportPDF(e.target.files[0]);
      e.target.value = '';
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const handlePrint = () => {
    if (!activePDF) return;
    const printWindow = window.open(activePDF.dataUrl);
    printWindow?.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">Inbuilt PDF Viewer & Library</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Read, review, and print your scanned documents or imported PDF files.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="application/pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Open External PDF</span>
          </button>

          <button
            onClick={onNavigateToScanner}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Scan New Document</span>
          </button>
        </div>
      </div>

      {/* Active PDF Viewer */}
      {activePDF ? (
        <div
          ref={containerRef}
          className={`space-y-4 rounded-2xl bg-slate-900 border border-slate-800 p-4 transition-all ${
            isFullscreen ? 'fixed inset-0 z-50 p-6 rounded-none' : ''
          }`}
        >
          {/* PDF Viewer Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onSelectPDF(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Back to library"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                  {activePDF.title}
                </h3>
                <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                  <span>{activePDF.pageCount} Pages</span>
                  <span>•</span>
                  <span>{formatBytes(activePDF.fileSize)}</span>
                  <span>•</span>
                  <span>{new Date(activePDF.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Actions: Download, Print, Fullscreen, Delete */}
            <div className="flex items-center space-x-2">
              <a
                href={activePDF.dataUrl}
                download={activePDF.title}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1 text-xs"
                title="Download PDF"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Download</span>
              </a>

              <button
                onClick={handlePrint}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Print"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => {
                  onDeletePDF(activePDF.id);
                  onSelectPDF(null);
                }}
                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition"
                title="Delete PDF"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Embedded Viewer iframe */}
          <div className="w-full h-[75vh] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
            <iframe
              src={activePDF.dataUrl}
              title={activePDF.title}
              className="w-full h-full border-0"
            />
          </div>
        </div>
      ) : (
        /* PDF Grid View */
        <div>
          {pdfs.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">No PDFs in your library</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
                Scan photos using the Document Scanner or open an existing PDF file from your device.
              </p>
              <button
                onClick={onNavigateToScanner}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm hover:bg-emerald-400 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First PDF</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  onClick={() => onSelectPDF(pdf)}
                  className="group relative rounded-2xl p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition cursor-pointer flex flex-col justify-between"
                >
                  {/* Thumbnail / Preview placeholder */}
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-950 mb-3 border border-slate-800 flex items-center justify-center">
                    {pdf.thumbnailUrl ? (
                      <img
                        src={pdf.thumbnailUrl}
                        alt={pdf.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <FileText className="w-12 h-12 text-emerald-500/40" />
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                      {pdf.pageCount} {pdf.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                  </div>

                  {/* Info */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 truncate group-hover:text-emerald-400 transition">
                      {pdf.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(pdf.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1 font-mono">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>{formatBytes(pdf.fileSize)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quick Delete overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePDF(pdf.id);
                    }}
                    className="absolute top-6 right-6 p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
                    title="Delete PDF"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
