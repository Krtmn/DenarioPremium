import { Injectable } from '@angular/core';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import jsPDF from 'jspdf';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

@Injectable({
  providedIn: 'root'
})

export class PdfCreatorService {

  constructor(private fileOpener: FileOpener) { 
    pdfMake.vfs = pdfFonts.vfs;

   }

   /*
   async generateWithJsPDF(html: string): Promise<jsPDF> {
    const doc = new jsPDF({
      format: 'a4',
      unit: 'pt',
      orientation: 'landscape'
    });
    await new Promise<void>((resolve) => {
      doc.html(html, {
        callback: () => resolve(),
        x: 10, y: 10
      });
    });

    return doc;
    
  }
    */
 // replace the existing generateWithJsPDF with this:

private inlineAllComputedStyles(original: HTMLElement, clone: HTMLElement) {
    const origElements = original.querySelectorAll<HTMLElement>('*');
    const cloneElements = clone.querySelectorAll<HTMLElement>('*');

    // copy styles for root element too
    this.copyComputedStyles(original, clone);

    const len = Math.min(origElements.length, cloneElements.length);
    for (let i = 0; i < len; i++) {
      this.copyComputedStyles(origElements[i], cloneElements[i]);
    }
  }

  private copyComputedStyles(sourceEl: HTMLElement, targetEl: HTMLElement) {
    const computed = window.getComputedStyle(sourceEl);
    // iterate computed style properties and set them inline on the target
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      try {
        const val = computed.getPropertyValue(prop);
        const priority = computed.getPropertyPriority(prop);
        targetEl.style.setProperty(prop, val, priority);
      } catch (e) {
        // some properties may be read-only or throw — ignore them
      }
    }
  }

  /**
   * Generate jsPDF from an element or html string, ensuring the whole content
   * (not only visible viewport) is captured. Returns a fully rendered jsPDF.
   *
   * Usage: pass the element reference (preferred) or HTML string.
   */  // ...existing code...
    async generateWithJsPDF(source: HTMLElement | string, opts?: { orientation?: 'portrait' | 'landscape', scale?: number }): Promise<jsPDF> {
      let renderScale = opts?.scale ?? 2; // start scale
  
      const doc = new jsPDF({
        format: 'legal',
        unit: 'pt',
        orientation: opts?.orientation ?? 'landscape'
      });
  
      // prepare original element (wrap string if needed)
      let originalElement: HTMLElement;
      let removeOriginalWrapper = false;
      if (typeof source === 'string') {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = source;
        document.body.appendChild(wrapper);
        originalElement = wrapper;
        removeOriginalWrapper = true;
      } else {
        originalElement = source as HTMLElement;
      }
  
      // clone & inline styles
      const cloned = originalElement.cloneNode(true) as HTMLElement;
      this.inlineAllComputedStyles(originalElement, cloned);
  
      // ensure clone lays out with natural height and page-width so html2canvas can capture full content
      // compute width in px that corresponds to PDF page width
      const pageWidthPt = doc.internal.pageSize.getWidth(); // pts
      const ptToPx = 96 / 72; // approx px per pt
      const pageWidthPx = Math.round(pageWidthPt * ptToPx);
  
      cloned.style.width = `${pageWidthPx}px`;
      cloned.style.maxHeight = 'none';
      cloned.style.overflow = 'visible';
      cloned.style.boxSizing = 'border-box';
  
      // place the clone so it is rendered in the layout but not covering the UI
      cloned.style.position = 'absolute';
      cloned.style.left = '0';
      cloned.style.top = '0';
      cloned.style.zIndex = '99999';
      cloned.style.visibility = 'visible';
      cloned.style.pointerEvents = 'none';
  
      document.body.appendChild(cloned);
  
      // wait for fonts to be ready if possible
      if ((document as any).fonts && (document as any).fonts.ready) {
        try { await (document as any).fonts.ready; } catch (e) { /* ignore */ }
      }
  
      // fetch html2canvas (use existing global or dynamic import)
      // @ts-ignore
      const html2canvasFn = (window as any).html2canvas ?? (await import('html2canvas')).default;
  
      // helper to try rendering canvas with scale and check max dimension limits
      const MAX_CANVAS_DIM = 32767; // conservative cross-browser safe limit
      let canvas: HTMLCanvasElement | null = null;
      let attemptScale = renderScale;
  
      while (true) {
        // compute desired width/height for html2canvas based on clone's scrollWidth/scrollHeight
        const targetWidthPx = cloned.scrollWidth;
        const targetHeightPx = cloned.scrollHeight;
  
        // html2canvas options to ensure full element is captured
        canvas = await html2canvasFn(cloned, {
          useCORS: true,
          allowTaint: false,
          scale: attemptScale,
          logging: false,
          width: targetWidthPx,
          height: targetHeightPx,
          windowWidth: targetWidthPx,
          windowHeight: targetHeightPx
        });
        if (!canvas) {
          throw new Error('html2canvas failed to produce a canvas');
        }
        // check if produced canvas fits within safe limits
        if (canvas.width <= MAX_CANVAS_DIM && canvas.height <= MAX_CANVAS_DIM) {
          // success
          renderScale = attemptScale; // record actual renderScale used
          break;
        }
  
        // if too large, reduce scale and retry
        if (attemptScale <= 1) {
          // Can't reduce further; accept this canvas (might be clipped by browser)
          break;
        }
        attemptScale = Math.max(1, Math.floor(attemptScale / 2));
        // try again with smaller scale
        canvas.remove(); // free memory before next attempt
      }
  
      // cleanup cloned element and original wrapper (if created)
      cloned.remove();
      if (removeOriginalWrapper && originalElement.parentElement) {
        originalElement.remove();
      }
  
      // Convert canvas to image and insert into PDF, splitting into pages as needed.
      const imgData = canvas.toDataURL('image/png');
  
      // Compute heights in PDF points:
      const pxToPt = 72 / 96;
      const cssHeightPx = canvas.height / renderScale;
      const imgHeightPtTotal = cssHeightPx * pxToPt;
      const imgWidthPt = pageWidthPt;
  
      const pageHeightPt = doc.internal.pageSize.getHeight();
  
      if (imgHeightPtTotal <= pageHeightPt) {
        doc.addImage(imgData, 'PNG', 0, 0, imgWidthPt, imgHeightPtTotal);
        return doc;
      }
  
      // split into pages using pixel slicing
      const pageHeightCssPx = pageHeightPt * ptToPx;
      const totalCssHeightPx = cssHeightPx;
      let yOffsetCss = 0;
      const tmpCanvas = document.createElement('canvas');
      const tmpCtx = tmpCanvas.getContext('2d')!;
  
      tmpCanvas.width = canvas.width; // pixel width
      tmpCanvas.height = Math.min(Math.round(pageHeightCssPx * renderScale), canvas.height);
  
      while (yOffsetCss < totalCssHeightPx) {
        const yOffsetPx = Math.round(yOffsetCss * renderScale);
        const sliceHeightPx = Math.min(Math.round(pageHeightCssPx * renderScale), canvas.height - yOffsetPx);
  
        tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        tmpCanvas.height = sliceHeightPx;
        tmpCtx.drawImage(canvas, 0, yOffsetPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
  
        const sliceData = tmpCanvas.toDataURL('image/png');
  
        const sliceCssHeightPx = sliceHeightPx / renderScale;
        const sliceHeightPt = sliceCssHeightPx * pxToPt;
  
        if (yOffsetCss === 0) {
          doc.addImage(sliceData, 'PNG', 0, 0, imgWidthPt, sliceHeightPt);
        } else {
          doc.addPage();
          doc.addImage(sliceData, 'PNG', 0, 0, imgWidthPt, sliceHeightPt);
        }
  
        yOffsetCss += pageHeightCssPx;
      }
  
      return doc;
    }
 

  generateWithPdfMake(content: any) {
    return pdfMake.createPdf({ content });
  }

    openPdf(pdf: string) {
    //window.open(pdf, '_blank');
    this.fileOpener.open(pdf, 'application/pdf')
      .then(() => console.log('PDF abierto'))
      .catch(e => console.log('Error abriendo PDF', e));
  }

    async saveAndOpenPdf(base64: string, fileName = 'document.pdf') {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Documents
    });
    await this.openPdf(result.uri);
  }
}

