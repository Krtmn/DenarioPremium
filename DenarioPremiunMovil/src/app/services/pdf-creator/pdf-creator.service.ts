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

async generateWithJsPDF(source: string | HTMLElement): Promise<jsPDF> {
  const doc = new jsPDF({
    format: 'a4',
    unit: 'pt',
    orientation: 'landscape'
  });

  // If caller passed a string, create a temporary wrapper element so computed styles apply
  let tempWrapper: HTMLElement | null = null;
  const element: HTMLElement = (typeof source === 'string')
    ? (() => {
        tempWrapper = document.createElement('div');
        tempWrapper.style.position = 'fixed';
        tempWrapper.style.left = '-9999px';
        tempWrapper.style.top = '0';
        tempWrapper.innerHTML = source;
        document.body.appendChild(tempWrapper);
        return tempWrapper;
      })()
    : source as HTMLElement;

  // Wait for web fonts to be loaded (if any)
  if ((document as any).fonts && (document as any).fonts.ready) {
    await (document as any).fonts.ready;
  }

  // Wait for html rendering to finish
  await new Promise<void>((resolve) => {
    doc.html(element, {
      callback: () => resolve(),
      x: 10,
      y: 10,
      html2canvas: {
        useCORS: true,
        allowTaint: false,
        scale: 1, // change to 1.5 or 2 for higher resolution (and larger PDF)
        logging: false
      }
    });
  });

  // Remove temporary wrapper if created
  if (tempWrapper) {
    tempWrapper.remove();
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

