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
   */  
// place inside PdfCreatorService in pdf-creator.service.ts
// ...existing class code...
async generateWithJsPDF(source: HTMLElement | string, opts?: { orientation?: 'portrait' | 'landscape', scale?: number, layoutScale?: number }): Promise<jsPDF> {
  // renderScale (pixel density) used by html2canvas:
  let renderScale = opts?.scale ?? 3;

  const doc = new jsPDF({
    format: 'letter',
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

  
  // compute page width in CSS px
  const pageWidthPt = doc.internal.pageSize.getWidth(); // pdf pts
  const ptToPx = 96 / 72; // approx px per pt
  const pageWidthPx = Math.round(pageWidthPt * ptToPx);

  // layoutScale: scale the clone's layout width (default 1 = page width)
  const layoutScale = typeof opts?.layoutScale === 'number' ? opts!.layoutScale : 1;
  const targetCloneWidthPx = Math.round(pageWidthPx * layoutScale);

  // set cloned layout width (this affects how table columns wrap/size)
  cloned.style.width = `${targetCloneWidthPx}px`;
  cloned.style.maxHeight = 'none';
  cloned.style.overflow = 'visible';
  cloned.style.boxSizing = 'border-box';

  // Add a class to the clone so PDF-only CSS can be applied
  cloned.classList.add('pdf-export-scale');

  // place the clone in the document for rendering
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

  // ensure a layout pass has occured (use RAF rather than arbitrary timeout)
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

  // Now that the clone is in the DOM and laid out, find header element and measure its CSS height & offset
  const headerEl = cloned.querySelector('thead') ?? cloned.querySelector('.cabecera');
  let headerCssHeight = 0;
  let headerCssOffset = 0;
  if (headerEl && headerEl instanceof HTMLElement) {
    headerCssHeight = headerEl.scrollHeight || headerEl.offsetHeight || 0;
    try {
      const clonedRect = cloned.getBoundingClientRect();
      const headerRect = headerEl.getBoundingClientRect();
      headerCssOffset = headerRect.top - clonedRect.top;
      if (!headerCssOffset) {
        headerCssOffset = headerEl.offsetTop || 0;
      }
    } catch (e) {
      headerCssOffset = headerEl.offsetTop || 0;
    }
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
    // free memory before next attempt
    canvas.remove();
  }

  // compute header metrics in canvas pixels (if header exists)
  const headerCanvasOffsetPx = Math.round(headerCssOffset * renderScale);
  const headerCanvasHeightPx = Math.round(headerCssHeight * renderScale);

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

  // If content fits on one page, just add it and return
  if (imgHeightPtTotal <= pageHeightPt) {
    doc.addImage(imgData, 'PNG', 0, 0, imgWidthPt, imgHeightPtTotal);
    return doc;
  }

  // Otherwise split into pages:
  const pageHeightCssPx = pageHeightPt * ptToPx; // page height in CSS px
  const totalCssHeightPx = cssHeightPx;
  let yOffsetCss = 0;
  let pageIndex = 0;

  // tmp canvas used for slicing
  const tmpCanvas = document.createElement('canvas');
  const tmpCtx = tmpCanvas.getContext('2d')!;

  tmpCanvas.width = canvas.width; // pixel width
  tmpCanvas.height = Math.min(Math.round(pageHeightCssPx * renderScale), canvas.height);

  while (yOffsetCss < totalCssHeightPx) {
    const yOffsetPx = Math.round(yOffsetCss * renderScale);
    const sliceHeightPx = Math.min(Math.round(pageHeightCssPx * renderScale), canvas.height - yOffsetPx);

    // prepare the slice for this page: draw slice from the full canvas
    tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
    tmpCanvas.height = sliceHeightPx;
    tmpCtx.drawImage(canvas, 0, yOffsetPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

    // If this is the first page, it already includes the header at the top (yOffsetCss==0)
    if (pageIndex === 0) {
      const sliceData = tmpCanvas.toDataURL('image/png');
      const sliceCssHeightPx = sliceHeightPx / renderScale;
      const sliceHeightPt = sliceCssHeightPx * pxToPt;
      doc.addImage(sliceData, 'PNG', 0, 0, imgWidthPt, sliceHeightPt);
    } else {
      // Compose header + slice: create a canvas tall enough for header + slice
      const compositeCanvas = document.createElement('canvas');
      const compCtx = compositeCanvas.getContext('2d')!;

      // composite must include header + slice
      const compositeHeightPx = headerCanvasHeightPx + sliceHeightPx;
      compositeCanvas.width = canvas.width;
      compositeCanvas.height = compositeHeightPx;

      // draw header portion from the full canvas using correct offset
      if (headerCanvasHeightPx > 0) {
        // draw header from its canvas offset:
        compCtx.drawImage(canvas, 0, headerCanvasOffsetPx, canvas.width, headerCanvasHeightPx, 0, 0, canvas.width, headerCanvasHeightPx);
      }
      // draw the current slice below the header
      compCtx.drawImage(tmpCanvas, 0, 0, canvas.width, sliceHeightPx, 0, headerCanvasHeightPx, canvas.width, sliceHeightPx);

      const compositeData = compositeCanvas.toDataURL('image/png');

      // compute composite height in PDF points:
      const compositeCssHeightPx = (headerCanvasHeightPx + sliceHeightPx) / renderScale;
      const compositeHeightPt = compositeCssHeightPx * pxToPt;

      doc.addPage();
      doc.addImage(compositeData, 'PNG', 0, 0, imgWidthPt, compositeHeightPt);
    }

    yOffsetCss += pageHeightCssPx;
    pageIndex++;
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

    async savePdf(base64: string, fileName = 'document.pdf') {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.External
    }).then(res => {return res}).catch(err => {
      console.error('Error saving PDF file:', err);
      throw err;
    });
    return result;
    //await this.openPdf(result.uri);
  }

  deletePdf(fileName: string) {
    return Filesystem.deleteFile({
      path: fileName,
      directory: Directory.External
    });
  }
}

