export interface PhotoItem {
  id: string;
  name: string;
  url: string; // base64 or blob url
  size: number; // in bytes
  type: string; // image/jpeg, image/png, etc.
  width?: number;
  height?: number;
  createdAt: number; // timestamp
  tags?: string[];
  favorite?: boolean;
}

export interface BinItem {
  id: string;
  originalId: string;
  photo: PhotoItem;
  deletedAt: number; // timestamp when deleted
  expiresAt: number; // deletedAt + 30 days
}

export interface ScanPage {
  id: string;
  dataUrl: string;
  filter: 'original' | 'bw' | 'grayscale' | 'contrast';
  rotation: number; // 0, 90, 180, 270
}

export interface PDFDocumentItem {
  id: string;
  title: string;
  pageCount: number;
  dataUrl: string; // Blob url or base64 PDF
  fileSize: number; // bytes
  createdAt: number;
  thumbnailUrl: string;
}

export type ViewTab = 'photos' | 'scanner' | 'pdfs' | 'bin';
