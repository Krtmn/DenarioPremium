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

   generateWithJsPDF(html: string): jsPDF {
    const doc = new jsPDF({
      format: 'a4',
      unit: 'pt',
    });
    doc.html(html, {
      callback: () => { },
      x: 10, y: 10
    });
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
      path: `mypdfs/${fileName}`,
      data: base64,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });
    await this.openPdf(result.uri);
  }
}

