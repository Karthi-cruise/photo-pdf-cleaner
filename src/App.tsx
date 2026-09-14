import React, { useState, useEffect } from 'react';
import { ViewTab, PhotoItem, BinItem, PDFDocumentItem } from './types';
import { StorageService } from './services/storageService';
import { INITIAL_SAMPLE_PHOTOS } from './utils/sampleData';
import { Navbar } from './components/Navbar';
import { PhotoGallery } from './components/Gallery/PhotoGallery';
import { DocumentScanner } from './components/Scanner/DocumentScanner';
import { InbuiltPDFViewer } from './components/PDFViewer/InbuiltPDFViewer';
import { RecycleBinView } from './components/Bin/RecycleBinView';
import { SwipeCleanModal } from './components/CleanMode/SwipeCleanModal';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<ViewTab>('photos');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [binItems, setBinItems] = useState<BinItem[]>([]);
  const [pdfs, setPdfs] = useState<PDFDocumentItem[]>([]);
  const [activePDF, setActivePDF] = useState<PDFDocumentItem | null>(null);
  const [isCleanModeOpen, setIsCleanModeOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize data from IndexedDB
  useEffect(() => {
    const initData = async () => {
      try {
        let storedPhotos = await StorageService.getAllPhotos();
        if (storedPhotos.length === 0) {
          // Populate sample photos on first launch
          await StorageService.savePhotos(INITIAL_SAMPLE_PHOTOS);
          storedPhotos = INITIAL_SAMPLE_PHOTOS;
        }
        setPhotos(storedPhotos);

        const storedBin = await StorageService.getAllBinItems();
        setBinItems(storedBin);

        const storedPDFs = await StorageService.getAllPDFs();
        setPdfs(storedPDFs);
      } catch (err) {
        console.error('Failed to initialize database:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // Upload Photos from Device
  const handleUploadPhotos = async (files: FileList) => {
    const newPhotos: PhotoItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const photoItem: PhotoItem = {
        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: file.name,
        url: dataUrl,
        size: file.size,
        type: file.type || 'image/jpeg',
        createdAt: Date.now(),
        tags: ['Imported'],
        favorite: false,
      };
      newPhotos.push(photoItem);
    }

    await StorageService.savePhotos(newPhotos);
    setPhotos((prev) => [...newPhotos, ...prev]);
  };

  // Move Single Photo to Bin
  const handleDeletePhotoToBin = async (photo: PhotoItem) => {
    const binItem = await StorageService.moveToBin(photo);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setBinItems((prev) => [binItem, ...prev]);
  };

  // Move Multiple Photos to Bin (Batch mode or Swipe Deck)
  const handleBatchDeleteToBin = async (photosToDelete: PhotoItem[]) => {
    const newBinItems = await StorageService.batchMoveToBin(photosToDelete);
    const deleteIds = new Set(photosToDelete.map((p) => p.id));
    setPhotos((prev) => prev.filter((p) => !deleteIds.has(p.id)));
    setBinItems((prev) => [...newBinItems, ...prev]);
  };

  // Restore single item from Bin
  const handleRestoreFromBin = async (binItem: BinItem) => {
    await StorageService.restoreFromBin(binItem);
    setBinItems((prev) => prev.filter((b) => b.id !== binItem.id));
    setPhotos((prev) => [binItem.photo, ...prev]);
  };

  // Restore multiple items from Bin
  const handleRestoreMultipleFromBin = async (items: BinItem[]) => {
    await StorageService.restoreMultipleFromBin(items);
    const restoreIds = new Set(items.map((i) => i.id));
    setBinItems((prev) => prev.filter((b) => !restoreIds.has(b.id)));
    setPhotos((prev) => [...items.map((i) => i.photo), ...prev]);
  };

  // Permanently delete single item from Bin
  const handleDeletePermanently = async (binItemId: string) => {
    await StorageService.deletePermanently(binItemId);
    setBinItems((prev) => prev.filter((b) => b.id !== binItemId));
  };

  // "Delete All Once" (Empty Bin)
  const handleEmptyBin = async () => {
    await StorageService.emptyBin();
    setBinItems([]);
  };

  // Toggle favorite on a photo
  const handleToggleFavorite = async (photoId: string) => {
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, favorite: !p.favorite } : p
    );
    setPhotos(updated);
    const target = updated.find((p) => p.id === photoId);
    if (target) {
      await StorageService.savePhoto(target);
    }
  };

  // Handle PDF Created from Scanner
  const handlePDFCreated = async (pdfItem: PDFDocumentItem) => {
    await StorageService.savePDF(pdfItem);
    setPdfs((prev) => [pdfItem, ...prev]);
  };

  // Handle Open external PDF file
  const handleImportExternalPDF = async (file: File) => {
    const dataUrl = URL.createObjectURL(file);
    const pdfItem: PDFDocumentItem = {
      id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: file.name,
      pageCount: 1,
      dataUrl,
      fileSize: file.size,
      createdAt: Date.now(),
      thumbnailUrl: '',
    };
    await StorageService.savePDF(pdfItem);
    setPdfs((prev) => [pdfItem, ...prev]);
    setActivePDF(pdfItem);
    setCurrentTab('pdfs');
  };

  // Delete PDF
  const handleDeletePDF = async (id: string) => {
    await StorageService.deletePDF(id);
    setPdfs((prev) => prev.filter((p) => p.id !== id));
    if (activePDF?.id === id) {
      setActivePDF(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'pdfs') setActivePDF(null);
        }}
        photoCount={photos.length}
        binCount={binItems.length}
        pdfCount={pdfs.length}
        onStartCleanMode={() => setIsCleanModeOpen(true)}
        onUploadPhotos={handleUploadPhotos}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <>
            {currentTab === 'photos' && (
              <PhotoGallery
                photos={photos}
                onDeletePhotoToBin={handleDeletePhotoToBin}
                onBatchDeleteToBin={handleBatchDeleteToBin}
                onToggleFavorite={handleToggleFavorite}
                onOpenCleanDeck={() => setIsCleanModeOpen(true)}
              />
            )}

            {currentTab === 'scanner' && (
              <DocumentScanner
                onPDFCreated={handlePDFCreated}
                onOpenPDFViewer={(pdf) => {
                  setActivePDF(pdf);
                  setCurrentTab('pdfs');
                }}
              />
            )}

            {currentTab === 'pdfs' && (
              <InbuiltPDFViewer
                pdfs={pdfs}
                activePDF={activePDF}
                onSelectPDF={(pdf) => setActivePDF(pdf)}
                onDeletePDF={handleDeletePDF}
                onImportPDF={handleImportExternalPDF}
                onNavigateToScanner={() => setCurrentTab('scanner')}
              />
            )}

            {currentTab === 'bin' && (
              <RecycleBinView
                binItems={binItems}
                onRestoreItem={handleRestoreFromBin}
                onRestoreMultiple={handleRestoreMultipleFromBin}
                onDeletePermanently={handleDeletePermanently}
                onEmptyBin={handleEmptyBin}
                onBackToGallery={() => setCurrentTab('photos')}
              />
            )}
          </>
        )}
      </main>

      {/* Swipe Clean Modal ("Clear / Swipe Deck" Feature) */}
      {isCleanModeOpen && (
        <SwipeCleanModal
          photos={photos}
          onClose={() => setIsCleanModeOpen(false)}
          onDeletePhotoToBin={handleDeletePhotoToBin}
          onBatchDeleteToBin={handleBatchDeleteToBin}
          onOpenBin={() => {
            setIsCleanModeOpen(false);
            setCurrentTab('bin');
          }}
        />
      )}

      {/* Floating Action Clean Button (Especially handy on Mobile touch screens) */}
      {!isCleanModeOpen && currentTab === 'photos' && photos.length > 0 && (
        <div className="fixed bottom-6 right-6 z-30 sm:hidden">
          <button
            onClick={() => setIsCleanModeOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 transform active:scale-95 transition"
            title="Clean Deck"
          >
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
