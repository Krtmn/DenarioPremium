import { Injectable } from '@angular/core';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

export type PdfSummaryAlign = 'left' | 'right' | 'center';

export interface PdfSummaryColumn {
  label: string;
  align?: PdfSummaryAlign;
}

export interface PdfSummaryMeta {
  label: string;
  value: string;
}

export interface PdfSummaryTotal {
  label: string;
  value: string;
}

export interface PdfSummaryData {
  title: string;
  meta?: PdfSummaryMeta[];
  columns: PdfSummaryColumn[];
  rows: Array<Array<string | number>>;
  total?: PdfSummaryTotal;
  fileName?: string;
}

export interface PdfSummaryOptions {
  action?: 'open' | 'save' | 'share' | 'share-save';
  orientation?: 'portrait' | 'landscape';
  scale?: number;
  layoutScale?: number;
}

@Injectable({
  providedIn: 'root'
})

export class PdfCreatorService {

  constructor(private fileOpener: FileOpener) {
    pdfMake.vfs = pdfFonts.vfs;

   }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildSummaryHtml(data: PdfSummaryData): string {
    const metaRows = data.meta || [];
    const rowsHtml = data.rows.map((row, rowIndex) => {
      const bg = rowIndex % 2 === 0 ? '#ffffff' : '#f7f8fa';
      const cells = row.map((cell, idx) => {
        const align = data.columns[idx]?.align || 'left';
        const safeValue = this.escapeHtml(String(cell ?? ''));
        return `<td style="text-align:${align}; padding: 8px 6px; border-bottom: 1px solid #e6e8eb;">${safeValue}</td>`;
      }).join('');
      return `<tr style="background:${bg};">${cells}</tr>`;
    }).join('');

    const metaHtml = metaRows.map((m) => {
      const label = this.escapeHtml(m.label);
      const value = this.escapeHtml(m.value);
      return `
        <tr>
          <td style="padding: 6px 8px; color: #5b626a; width: 28%;"><strong>${label}:</strong></td>
          <td style="padding: 6px 8px; color: #121417;">${value}</td>
        </tr>`;
    }).join('');

    const headerHtml = data.columns.map(col => {
      const align = col.align || 'left';
      return `<th style="text-align:${align}; padding: 9px 6px; font-size: 11px; letter-spacing: 0.3px; text-transform: uppercase; color: #2b3137; background: #eef1f4; border-bottom: 1px solid #d9dde2;">${this.escapeHtml(col.label)}</th>`;
    }).join('');

    const totalHtml = data.total
      ? `<div style="margin-top: 12px; padding: 10px 12px; background: #f3fbf6; border: 1px solid #d7efe1; text-align: right; font-size: 13px; border-radius: 6px;"><strong>${this.escapeHtml(data.total.label)}:</strong> ${this.escapeHtml(data.total.value)}</div>`
      : '';

    const safeTitle = this.escapeHtml(data.title);

    return `
      <div style="font-family: Arial, sans-serif; color: #121417; width: 100%;">
        <div style="max-width: 760px; margin: 0 auto; text-align: left;">
        <div style="background: #59b02d; color: #ffffff; padding: 14px 16px; border-radius: 8px 8px 0 0;">
          <div style="font-size: 18px; font-weight: bold;">${safeTitle}</div>
          <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">Generado desde la aplicacion</div>
        </div>
        <div style="border: 1px solid #e6e8eb; border-top: none; border-radius: 0 0 8px 8px; padding: 12px 14px;">
          ${metaHtml ? `<table style="width: 100%; border-collapse: collapse; margin: 0 auto 12px auto; background: #ffffff; border: 1px solid #e6e8eb; border-radius: 6px;">${metaHtml}</table>` : ''}
          <table style="width: 100%; border-collapse: collapse; margin: 0 auto; border: 1px solid #e6e8eb; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr>${headerHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="100" style="padding: 8px 6px; color: #6b7280;">Sin items</td></tr>'}
            </tbody>
          </table>
          ${totalHtml}
        </div>
        </div>
      </div>
    `;
  }

  async createSummaryPdf(data: PdfSummaryData, options?: PdfSummaryOptions) {
    const html = this.buildSummaryHtml(data);
    const doc = await this.generateWithJsPDF(html, {
      orientation: options?.orientation ?? 'portrait',
      scale: options?.scale ?? 1,
      layoutScale: options?.layoutScale
    });
    const base64 = doc.output('datauristring');
    const trimmed = base64.split(',')[1];
    const result = await this.savePdf(trimmed, data.fileName || 'summary.pdf');

    const action = options?.action ?? 'share';
    if (action === 'open') {
      this.openPdf(result.uri);
    } else if (action === 'share' || action === 'share-save') {
      await Share.share({
        title: data.title,
        url: result.uri
      });
    }

    return result;
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

    const uriResult = await Filesystem.getUri({
      path: fileName,
      directory: Directory.External
    });

    return { ...result, uri: uriResult.uri };
    //await this.openPdf(result.uri);
  }

  deletePdf(fileName: string) {
    return Filesystem.deleteFile({
      path: fileName,
      directory: Directory.External
    });
  }
}

