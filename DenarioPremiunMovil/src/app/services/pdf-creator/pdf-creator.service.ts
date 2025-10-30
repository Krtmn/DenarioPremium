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
  async generateWithJsPDF(source: HTMLElement | string, opts?: { orientation?: 'portrait' | 'landscape', scale?: number }): Promise<jsPDF> {
  const renderScale = opts?.scale ?? 2; // 2 gives good quality; use 1 or 1.5 on low-memory devices

  const doc = new jsPDF({
    format: 'a4',
    unit: 'pt',
    orientation: 'landscape'
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

  // clone & inline styles (use your helpers)
  const cloned = originalElement.cloneNode(true) as HTMLElement;
  this.inlineAllComputedStyles(originalElement, cloned);

  // compute width in px that corresponds to PDF page width
  const pageWidthPt = doc.internal.pageSize.getWidth(); // pts
  const pageHeightPt = doc.internal.pageSize.getHeight(); // pts
  const ptToPx = 96 / 72; // approx px per pt
  const pageWidthPx = Math.round(pageWidthPt * ptToPx);
  const pageHeightPx = Math.round(pageHeightPt * ptToPx);

  // ensure clone lays out at the page width and no scrolling
  cloned.style.width = `${pageWidthPx}px`;
  cloned.style.maxHeight = 'none';
  cloned.style.overflow = 'visible';
  cloned.style.boxSizing = 'border-box';

  // place the clone inside viewport but invisible so html2canvas paints it
  cloned.style.position = 'fixed';
  cloned.style.left = '0';
  cloned.style.top = '0';
  cloned.style.zIndex = '99999';
  cloned.style.opacity = '1';          // set to 0.9 to debug visually
  cloned.style.pointerEvents = 'none';
  cloned.style.visibility = 'visible';

  document.body.appendChild(cloned);

  // wait for fonts if available
  if ((document as any).fonts && (document as any).fonts.ready) {
    try { await (document as any).fonts.ready; } catch (e) { /* ignore */ }
  }

  // dynamic import/use html2canvas from window (jsPDF.html internally uses it too),
  // but we call html2canvas directly to control canvas and page splitting.
  // html2canvas should be available globally via the jsPDF/html plugin; if not,
  // you may need to `import html2canvas from 'html2canvas'` at top.
  // To avoid extra imports here, assume html2canvas is available globally:
  // (If not present, add: `import html2canvas from 'html2canvas';`)
  // @ts-ignore
  const html2canvasFn = (window as any).html2canvas ?? (await import('html2canvas')).default;

  // render the cloned node to a canvas
  const canvas = await html2canvasFn(cloned, {
    useCORS: true,
    allowTaint: false,
    scale: renderScale,
    logging: false,
  });

  // cleanup cloned element
  cloned.remove();
  if (removeOriginalWrapper && originalElement.parentElement) {
    originalElement.remove();
  }

  // canvas.width = CSS_width_px * renderScale
  // canvas.height = CSS_height_px * renderScale

  // Convert canvas to image and insert into PDF, splitting into pages as needed.
  const imgData = canvas.toDataURL('image/png');

  // Compute image height in PDF points:
  // CSS px -> pt conversion: 1 pt = 96/72 px => pxToPt = 72/96 = 0.75
  const pxToPt = 72 / 96;
  // actual canvas height in pixels divided by renderScale gives CSS px height
  const cssHeightPx = canvas.height / renderScale;
  const imgHeightPtTotal = cssHeightPx * pxToPt;
  const imgWidthPt = pageWidthPt; // we fit width to the page

  // If the content fits on one page vertically, just add it scaled to page width
  if (imgHeightPtTotal <= pageHeightPt) {
    doc.addImage(imgData, 'PNG', 0, 0, imgWidthPt, imgHeightPtTotal);
    return doc;
  }

  // Otherwise split into pages:
  // We'll slice the source canvas into page-sized slices in CSS px:
  const pageHeightCssPx = pageHeightPt * ptToPx; // convert target page height to CSS px
  const totalCssHeightPx = cssHeightPx;
  let yOffsetCss = 0;
  const tmpCanvas = document.createElement('canvas');
  const tmpCtx = tmpCanvas.getContext('2d')!;

  // tmpCanvas should have pixel dimensions equal to slice size times renderScale
  tmpCanvas.width = canvas.width; // same pixel width as source
  tmpCanvas.height = Math.min(Math.round(pageHeightCssPx * renderScale), canvas.height);

  while (yOffsetCss < totalCssHeightPx) {
    const yOffsetPx = Math.round(yOffsetCss * renderScale);
    const sliceHeightPx = Math.min(Math.round(pageHeightCssPx * renderScale), canvas.height - yOffsetPx);

    // clear and draw slice
    tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
    tmpCanvas.height = sliceHeightPx; // adjust canvas pixel height for this slice
    // drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh)
    tmpCtx.drawImage(canvas, 0, yOffsetPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

    const sliceData = tmpCanvas.toDataURL('image/png');

    // compute slice height in PDF points
    const sliceCssHeightPx = sliceHeightPx / renderScale;
    const sliceHeightPt = sliceCssHeightPx * pxToPt;

    // add to PDF (first page use existing page, next create new page)
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

