import { Component, OnInit, Input, inject } from '@angular/core';

import { Retention } from 'src/app/modelos/retention';
import { CollectionService } from 'src/app/services/collection/collection-logic.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
  selector: 'app-cobro-total',
  templateUrl: './cobro-total.component.html',
  styleUrls: ['./cobro-total.component.scss'],
  standalone: false
})
export class CobroTotalComponent implements OnInit {

  @Input()
  cobroTotalTags = new Map<string, string>([]);

  public collectService = inject(CollectionService);
  public globalConfig = inject(GlobalConfigService);
  public currencyService = inject(CurrencyService)
  public dateServ = inject(DateServiceService);
  public synchronizationServices = inject(SynchronizationDBService);

  public disabledButton: Boolean = true;

  constructor() {
  }

  ngOnInit() {
    if (this.collectService.calculateDifference) {
      this.calculateDifDocsNegativos();
    }
  }


  imprimir() {
    console.log(this.collectService.collection)
  }

  send() {
    this.collectService.saveCollection(this.synchronizationServices.getDatabase(), this.collectService.collection).then(response => {
      console.log(response);
      this.collectService.saveSendCollection(this.collectService.collection.coCollection);
    })
  }

  addRetencion() {
    this.collectService.addRetention = true;
    this.collectService.retention = new Retention;
  }

  deleteRetention(index: number) {
    console.log(index);
    const coDocument = this.collectService.collection.collectionDetails[index].coDocument;
    // Buscar y deseleccionar en documentSales
    const docSale = this.collectService.documentSales.find(d => d.coDocument == coDocument);
    if (docSale) docSale.isSelected = false;
    // Buscar y deseleccionar en documentSalesBackup
    const docSaleBackup = this.collectService.documentSalesBackup.find(d => d.coDocument == coDocument);
    if (docSaleBackup) docSaleBackup.isSelected = false;
    // Eliminar el detalle
    this.collectService.collection.collectionDetails.splice(index, 1);
    if (this.collectService.collection.collectionDetails.length == 0)
      this.collectService.onCollectionValidToSend(false);
  }

  saveRetention(isSave: Boolean) {
    console.log(isSave);
    if (isSave) {
      let daVoucher = this.dateServ.hoyISO();
      this.collectService.collection.collectionDetails.push({
        //idCollectionDetail: null,
        coCollection: this.collectService.collection.coCollection,
        coDocument: this.collectService.retention.coDocument,
        idDocument: 0,
        inPaymentPartial: false,
        nuVoucherRetention: this.collectService.retention.nuVoucherRetention,
        nuAmountRetention: this.collectService.retention.nuAmountRetention, //iva
        nuAmountRetention2: this.collectService.retention.nuAmountRetention2, //islr
        nuAmountRetentionConversion: this.collectService.convertirMonto(this.collectService.retention.nuAmountRetention, 0, this.collectService.collection.coCurrency),
        nuAmountRetention2Conversion: this.collectService.convertirMonto(this.collectService.retention.nuAmountRetention2, 0, this.collectService.collection.coCurrency),
        nuAmountPaid: this.collectService.retention.nuAmountPaid,
        nuAmountPaidConversion: this.collectService.convertirMonto(this.collectService.retention.nuAmountPaid, 0, this.collectService.collection.coCurrency),
        nuAmountDiscount: 0,
        nuAmountDiscountConversion: 0,
        nuAmountDoc: 0,
        nuAmountDocConversion: 0,
        daDocument: daVoucher.split("T")[0],
        nuBalanceDoc: 0,
        nuBalanceDocConversion: 0,
        coOriginal: "",
        coTypeDoc: "",
        nuValueLocal: this.collectService.collection.nuValueLocal,
        nuAmountIgtf: 0,
        nuAmountIgtfConversion: 0,
        st: 0,
        isSave: true,
        daVoucher: daVoucher.split("T")[0],
      })
    }
    this.collectService.addRetention = false;
    this.validate();
    this.collectService.validateToSend();
  }

  validate() {
    this.collectService.retention.nuAmountPaid =
      this.collectService.retention.nuAmountRetention + this.collectService.retention.nuAmountRetention2;

    if (this.collectService.retention.nuAmountPaid > 0)
      this.disabledButton = false;
    else
      this.disabledButton = true;
  }

  totalizationRetention() {
    this.collectService.collection.nuAmountFinal = 0;
    this.collectService.collection.nuAmountTotal = 0;
    this.collectService.collection.nuAmountFinalConversion = 0;
    this.collectService.collection.nuAmountTotalConversion = 0;

    for (var i = 0; i < this.collectService.collection.collectionPayments!.length; i++) {
      this.collectService.collection.nuAmountFinal += this.collectService.collection.collectionDetails![i].nuAmountPaid;
      this.collectService.collection.nuAmountTotal += this.collectService.collection.collectionDetails![i].nuAmountPaid;
    }
    this.collectService.collection.nuAmountFinalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountFinal, 0, this.collectService.collection.coCurrency);
    this.collectService.collection.nuAmountTotalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountTotal, 0, this.collectService.collection.coCurrency);
  }

  calculateDifDocsNegativos() {
    let exist = false;
    let monto = 0;
    this.collectService.difDocsNegativosByRate = 0;
    this.collectService.difDocsNegativosByOriginalRate = 0;
    this.collectService.difference = 0;
    this.collectService.collection.collectionDetails.forEach(doc => {
      if (doc.nuBalanceDoc < 0) {
        this.collectService.difDocsNegativosByRate +=
          this.collectService.convertirMonto(doc.nuBalanceDoc,
            this.collectService.collection.nuValueLocal,
            this.collectService.collection.coCurrency);

        this.collectService.difDocsNegativosByOriginalRate +=
          this.collectService.convertirMonto(doc.nuBalanceDoc,
            doc.nuValueLocal,
            this.collectService.collection.coCurrency);
        exist = true;
      }


    });

    if (exist) {
      this.collectService.difference =
        this.collectService.difDocsNegativosByRate
        - this.collectService.difDocsNegativosByOriginalRate;
    } else {
      this.collectService.difDocsNegativosByRate = 0;
      this.collectService.difDocsNegativosByOriginalRate = 0;
      this.collectService.calculateDifference = false;
    }
  }

}