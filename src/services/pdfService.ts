import { jsPDF } from 'jspdf';
import { ScanPage, PDFDocumentItem } from '../types';

export const PDFService = {
  /**
   * Apply document filter to an image data URL using Canvas
   */
  async applyFilter(
    dataUrl: string,
    filter: ScanPage['filter'],
    rotation: number = 0
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        const isRotated90or270 = rotation % 180 !== 0;
        canvas.width = isRotated90or270 ? img.height : img.width;
        canvas.height = isRotated90or270 ? img.width : img.height;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        if (filter === 'original') {
          resolve(canvas.toDataURL('image/jpeg', 0.92));
          return;
        }

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (filter === 'grayscale') {
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          } else if (filter === 'bw') {
            // Adaptive B&W threshold
            const val = gray > 140 ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          } else if (filter === 'contrast') {
            // High contrast document enhancement
            const factor = (259 * (128 + 80)) / (255 * (259 - 80));
            const enhanced = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
            data[i] = enhanced;
            data[i + 1] = enhanced;
            data[i + 2] = enhanced;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => reject(new Error('Failed to load image for filter'));
      img.src = dataUrl;
    });
  },

  /**
   * Generates a multi-page PDF from an array of ScanPages
   */
  async createPDFFromPages(
    pages: ScanPage[],
    title: string = 'Scanned_Document'
  ): Promise<PDFDocumentItem> {
    if (pages.length === 0) {
      throw new Error('No pages to create PDF');
    }

    // Default to A4 portrait
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let firstThumbnail = '';

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      if (index > 0) {
        doc.addPage('a4', 'portrait');
      }

      // Render filtered page
      const filteredUrl = await this.applyFilter(page.dataUrl, page.filter, page.rotation);
      if (index === 0) {
        firstThumbnail = filteredUrl;
      }

      // Calculate aspect ratio preserving image bounds inside A4
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.width, h: img.height });
        img.src = filteredUrl;
      });

      const imgRatio = dims.w / dims.h;
      const pageRatio = pageWidth / pageHeight;

      let drawWidth = pageWidth;
      let drawHeight = pageHeight;
      let xOffset = 0;
      let yOffset = 0;

      if (imgRatio > pageRatio) {
        drawWidth = pageWidth;
        drawHeight = pageWidth / imgRatio;
        yOffset = (pageHeight - drawHeight) / 2;
      } else {
        drawHeight = pageHeight;
        drawWidth = pageHeight * imgRatio;
        xOffset = (pageWidth - drawWidth) / 2;
      }

      doc.addImage(filteredUrl, 'JPEG', xOffset, yOffset, drawWidth, drawHeight, undefined, 'FAST');
    }

    const pdfBlob = doc.output('blob');
    const dataUrl = URL.createObjectURL(pdfBlob);

    const pdfItem: PDFDocumentItem = {
      id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title.endsWith('.pdf') ? title : `${title}.pdf`,
      pageCount: pages.length,
      dataUrl,
      fileSize: pdfBlob.size,
      createdAt: Date.now(),
      thumbnailUrl: firstThumbnail,
    };

    return pdfItem;
  },
};
