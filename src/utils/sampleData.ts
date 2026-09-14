import { PhotoItem, PDFDocumentItem } from '../types';

export const INITIAL_SAMPLE_PHOTOS: PhotoItem[] = [
  {
    id: 'sample_1',
    name: 'Mountain Sunset Retreat.jpg',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    size: 2450000,
    type: 'image/jpeg',
    width: 1920,
    height: 1080,
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    tags: ['Nature', 'Travel', 'Sunset'],
    favorite: true,
  },
  {
    id: 'sample_2',
    name: 'Blurry Screenshot Duplicate.jpg',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    size: 3890000,
    type: 'image/jpeg',
    width: 1920,
    height: 1280,
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    tags: ['Screenshots', 'Work'],
    favorite: false,
  },
  {
    id: 'sample_3',
    name: 'Office Meeting Whiteboard.jpg',
    url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&auto=format&fit=crop&q=80',
    size: 1920000,
    type: 'image/jpeg',
    width: 1920,
    height: 1280,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    tags: ['Notes', 'Work'],
    favorite: false,
  },
  {
    id: 'sample_4',
    name: 'Golden Retriever Park Play.jpg',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&auto=format&fit=crop&q=80',
    size: 4200000,
    type: 'image/jpeg',
    width: 1920,
    height: 1280,
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    tags: ['Pets', 'Family'],
    favorite: true,
  },
  {
    id: 'sample_5',
    name: 'Coffee Shop Receipt 2026.jpg',
    url: 'https://images.unsplash.com/photo-1554415707-9e4966a604f7?w=1200&auto=format&fit=crop&q=80',
    size: 1450000,
    type: 'image/jpeg',
    width: 1080,
    height: 1920,
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
    tags: ['Receipts', 'Expenses'],
    favorite: false,
  },
  {
    id: 'sample_6',
    name: 'Accidental Pocket Photo.jpg',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    size: 5120000,
    type: 'image/jpeg',
    width: 1920,
    height: 1080,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    tags: ['Junk', 'Blurry'],
    favorite: false,
  },
  {
    id: 'sample_7',
    name: 'Modern Architecture Facade.jpg',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    size: 3100000,
    type: 'image/jpeg',
    width: 1920,
    height: 1280,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    tags: ['Travel', 'Architecture'],
    favorite: true,
  },
  {
    id: 'sample_8',
    name: 'Old Book Page Scan.jpg',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
    size: 2800000,
    type: 'image/jpeg',
    width: 1920,
    height: 1280,
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
    tags: ['Documents', 'Books'],
    favorite: false,
  },
];

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
