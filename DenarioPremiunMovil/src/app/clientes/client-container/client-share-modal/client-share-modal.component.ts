import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { Client } from 'src/app/modelos/tables/client';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { PdfCreatorService } from 'src/app/services/pdf-creator/pdf-creator.service';

@Component({
  selector: 'app-client-share-modal',
  templateUrl: './client-share-modal.component.html',
  styleUrls: ['./client-share-modal.component.scss'],
  standalone: false,
})
export class ClientShareModalComponent  implements OnInit {
    public clientLogic = inject(ClientLogicService);
    public currencyService = inject(CurrencyService);
    private globalConfig = inject(GlobalConfigService);
    private pdfCreator = inject(PdfCreatorService);

     @ViewChild('invoiceContent', { static: false }) content!: ElementRef;

    public localCurrency = '';
    public hardCurrency = '';

    public document!: DocumentSale[];
    public client!: Client;
    public tagRif = "";

  constructor() { }

  ngOnInit() {
    this.localCurrency = this.clientLogic.localCurrency.coCurrency;
    this.hardCurrency = this.clientLogic.hardCurrency.coCurrency;
    this.document = this.clientLogic.datos.document;
    this.client = this.clientLogic.datos.client;
    this.tagRif = this.globalConfig.get("tagRif")!;
  }

    getDaDueDate(daDueDate: string) {
    let dateDoc = new Date(daDueDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3")).getTime();
    return Math.round(((new Date()).getTime() - dateDoc) / 86400000);
  }

    formatNumber(num: number) {
    return this.currencyService.formatNumber(num);
  }

    toLocalCurrency(hardAmount: number, doc: DocumentSale): string {
    if (doc.coCurrency == this.localCurrency) {
      //si la moneda es la misma, no se convierte
      return this.formatNumber(hardAmount);
    }
    return this.formatNumber(this.currencyService.toLocalCurrencyByNuValueLocal(hardAmount, doc.nuValueLocal));
  }

  toHardCurrency(localAmount: number, doc: DocumentSale): string {
    if (doc.coCurrency == this.hardCurrency) {
      return this.formatNumber(localAmount);
    }
    return this.formatNumber(this.currencyService.toHardCurrencyByNuValueLocal(localAmount, doc.nuValueLocal));
  }

    oppositeCoCurrency(coCurrency: string) {
      return this.currencyService.oppositeCoCurrency(coCurrency);
  }

    async exportPdf() {
    //const html = this.content.nativeElement.innerHTML;
    const element = this.content.nativeElement as HTMLElement;
    const doc = await this.pdfCreator.generateWithJsPDF(element, { scale: 1, layoutScale: 0.7 });
    const base64 = doc.output('datauristring');
    const trimmed = base64.split(',')[1];
    await this.pdfCreator.saveAndOpenPdf(trimmed, `invoice_${Date.now()}.pdf`);
  }

}
