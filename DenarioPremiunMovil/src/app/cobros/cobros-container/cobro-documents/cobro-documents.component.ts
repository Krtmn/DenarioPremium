import { Component, OnInit, inject, Input, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Collection, CollectionDetail, CollectionPayment } from 'src/app/modelos/tables/collection';
import { Currencies } from 'src/app/modelos/tables/currencies';
import { IgtfList } from 'src/app/modelos/tables/igtfList';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { CollectionService } from 'src/app/services/collection/collection-logic.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { PagoCheque } from 'src/app/modelos/pago-cheque';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { TiposPago } from 'src/app/modelos/tipos-pago';
import { PagoEfectivo } from 'src/app/modelos/pago-efectivo';
import { PagoDeposito } from 'src/app/modelos/pago-deposito';
import { PagoTransferencia } from 'src/app/modelos/pago-transferencia';
import { PagoOtros } from 'src/app/modelos/pago-otros';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
  selector: 'app-cobro-documents',
  templateUrl: './cobro-documents.component.html',
  styleUrls: ['./cobro-documents.component.scss'],
  standalone: false
})
export class CobrosDocumentComponent implements OnInit {

  public collectService = inject(CollectionService);
  public globalConfig = inject(GlobalConfigService);
  public currencyService = inject(CurrencyService);
  public dateServ = inject(DateServiceService);
  public synchronizationServices = inject(SynchronizationDBService);
  public cdr: ChangeDetectorRef;

  public Math = Math;
  public Number = Number;

  public daVoucher: string = "";
  public fechaHoy: string = "";
  //public daVoucher: string = this.dateServ.hoyISO();



  public disabledSaveButton: boolean = false;
  public alertMessageOpen: boolean = false;
  public alertMessageOpen2: boolean = false;


  public mensaje: string = '';
  public saldo: string = "";
  public saldoConversion: string = "";
  public saldoView: string = "";
  public saldoConversionView: string = "";

  public alertButtons = [
    /*  {
       text: '',
       role: 'cancel'
     }, */
    {
      text: '',
      role: 'confirm'
    },
  ];

  public alertButtons2 = [
    {
      text: '',
      role: 'cancel'
    },
    {
      text: '',
      role: 'confirm'
    },
  ];


  constructor() {
    this.cdr = inject(ChangeDetectorRef);
    this.alertButtons[0].text = this.collectService.collectionTagsDenario.get('DENARIO_BOTON_ACEPTAR')!;
    this.alertButtons2[0].text = this.collectService.collectionTagsDenario.get('DENARIO_BOTON_CANCELAR')!;
    this.alertButtons2[1].text = this.collectService.collectionTagsDenario.get('DENARIO_BOTON_ACEPTAR')!;

  }
  ngOnInit() {

    this.fechaHoy = this.dateServ.onlyDateHoyISO();
  }



  onChangeCurrencyDoc(event: any) {
    //debo llamar a getAllDocuments con la nueva moneda y refrescar todo
    let docCurrency = "";
    if (event.target.value.coCurrency == "Moneda") {
      this.collectService.documentCurrency = this.collectService.currencySelected.coCurrency
    } else {
      docCurrency = event.target.value.coCurrency;
      this.collectService.documentCurrency = event.target.value.coCurrency;
    }

    this.getDocumentsSale(this.collectService.collection.idClient, docCurrency,
      this.collectService.collection.coCollection, this.collectService.collection.idEnterprise)
  }

  getDocumentsSale(idClient: number, coCurrency: string, coCollection: string, idEnterprise: number) {
    this.collectService.getDocumentsSales(this.synchronizationServices.getDatabase(), idClient, coCurrency, coCollection, idEnterprise).then(response => {
      if (this.collectService.documentSales.length > 0)
        this.collectService.documentsSaleComponent = true;
      else
        this.collectService.documentsSaleComponent = false;
    })
  }

  getDaDueDate(daDueDate: string) {
    let dateDoc = new Date(daDueDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3")).getTime();
    //minutes = 1000*60
    //hours = minutes * 60
    //days = hours * 24
    //var days = 86400000; /* 1000 * 60 * 60 * 24; */

    return Math.round(((new Date()).getTime() - dateDoc) / 86400000);
  }

  getIgtfList() {
    const found = this.collectService.igtfList.find(item => item.defaultIgtf === "true");
    if (found) {
      this.collectService.igtfSelected = found;
    }
  }

  onChangeIgtf(event: any) {
    console.log(event.target.value);
    this.collectService.igtfSelected = event.target.value;

    if (event.target.value.price == 0)
      this.collectService.separateIgtf = false;

    this.collectService.calculatePayment("", 0);
    this.cdr.detectChanges();
  }

  separateIgtf() {
    /* console.log(igtfDefault)
    this.collectService.separateIgtf = igtfDefault.target.checked; */
    this.collectService.collection.hasIGTF = this.collectService.separateIgtf;
    this.collectService.calculatePayment("", 0);
    this.cdr.detectChanges();
    if (this.collectService.igtfSelected.price <= 0 && this.collectService.separateIgtf) {
      //MANDAR MENSAJE DE ERROR, IGTF SEPARADO DEBE SER MAYOR A 0            
      this.collectService.mensaje = this.collectService.collectionTags.get('COB_MSJ_IGTF_MAYOR0')!;
      this.alertMessageOpen = true;
    }



  }

  async calculateSaldo(index: number) {
    let backupBalance = 0;
    const coTypeDoc = this.collectService.documentSalesBackup[index].coDocumentSaleType;
    const nuValueLocalDoc = this.collectService.documentSalesBackup[index].nuValueLocal;

    backupBalance = this.collectService.documentSalesBackup[index].nuBalance;

    if (!this.collectService.documentSales[index].isSave) {

      this.saldo = "0";
      this.saldoConversion = "0";
      this.saldoView = "0";
      this.saldoConversionView = "0";
      if (this.collectService.collection.stCollection == 1) {
        let indexCollectionDetail = this.collectService.documentSales[index].positionCollecDetails;
        this.saldo = this.collectService.collection.collectionDetails[indexCollectionDetail].nuBalanceDoc.toString();
        this.saldoConversion = this.collectService.collection.collectionDetails[indexCollectionDetail].nuBalanceDocConversion.toString();
        this.saldoView = this.collectService.collection.collectionDetails[indexCollectionDetail].nuBalanceDoc.toString();
        this.saldoConversionView = this.collectService.collection.collectionDetails[indexCollectionDetail].nuBalanceDocConversion.toString();
        return true;
      } else if (this.collectService.currencySelected.localCurrency.toString() == 'true') {
        if (this.collectService.documentSales[index].coCurrency == this.collectService.currencySelected.coCurrency) {
          this.saldo = this.currencyService.formatNumber(backupBalance);
          this.saldoView = this.currencyService.formatNumber(this.collectService.documentSalesBackup[index].nuBalance);
          this.saldoConversion = this.currencyService.formatNumber(await this.collectService.convertAmount(backupBalance, 'local', 'hard', coTypeDoc, nuValueLocalDoc));
          this.saldoConversionView = this.currencyService.formatNumber(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuBalance, 'local', 'hard', coTypeDoc, nuValueLocalDoc));
        } else {
          this.saldo = this.currencyService.formatNumber(await this.collectService.convertAmount(backupBalance, 'hard', 'local', coTypeDoc, nuValueLocalDoc));
          this.saldoConversion = this.currencyService.formatNumber(backupBalance);
          this.saldoView = this.currencyService.formatNumber(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuBalance, 'hard', 'local', coTypeDoc, nuValueLocalDoc));
          this.saldoConversionView = this.currencyService.formatNumber(this.collectService.documentSalesBackup[index].nuBalance);
        }
        console.log(this.saldo);
        console.log(this.saldoConversion);
        console.log(this.saldoView);
        console.log(this.saldoConversionView);
        return true;
      } else {
        if (this.collectService.documentSales[index].coCurrency == this.collectService.currencySelected.coCurrency) {
          this.saldo = this.currencyService.formatNumber(backupBalance);
          this.saldoConversion = this.currencyService.formatNumber(await this.collectService.convertAmount(backupBalance, 'hard', 'local', coTypeDoc, nuValueLocalDoc));
          this.saldoView = this.currencyService.formatNumber(this.collectService.documentSalesBackup[index].nuBalance);
          this.saldoConversionView = this.currencyService.formatNumber(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuBalance, 'hard', 'local', coTypeDoc, nuValueLocalDoc));
        } else {
          this.saldo = this.currencyService.formatNumber(await this.collectService.convertAmount(backupBalance, 'local', 'hard', coTypeDoc, nuValueLocalDoc));          //PASAR DE HARD A LOCAL
          this.saldoConversion = this.currencyService.formatNumber(backupBalance);
          this.saldoView = this.currencyService.formatNumber(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuBalance, 'local', 'hard', coTypeDoc, nuValueLocalDoc));          //PASAR DE HARD A LOCAL
          this.saldoConversionView = this.currencyService.formatNumber(this.collectService.documentSalesBackup[index].nuBalance);
        }
        console.log(this.saldo);
        console.log(this.saldoConversion);
        console.log(this.saldoView);
        console.log(this.saldoConversionView);
        return true;

      }
    } else {
      let indexCollectionDetail = this.collectService.documentSales[index].positionCollecDetails;
      this.saldo = this.collectService.collection.collectionDetails[indexCollectionDetail].nuBalanceDoc.toString();
      this.saldoConversion = this.collectService.collection.collectionDetails[indexCollectionDetail].nuBalanceDocConversion.toString();
      this.saldoView = this.collectService.collection.collectionDetails[indexCollectionDetail].nuBalanceDoc.toString();
      this.saldoConversionView = this.collectService.collection.collectionDetails[indexCollectionDetail].nuBalanceDocConversion.toString();
      console.log(this.saldo);
      console.log(this.saldoConversion);
      console.log(this.saldoView);
      console.log(this.saldoConversionView);
      return true;
    }
  }

  async calculateDocumentSaleOpen(index: number) {
    return new Promise(async (resolve, reject) => {

      const coTypeDoc = this.collectService.documentSalesBackup[index].coDocumentSaleType;
      const nuValueLocalDoc = this.collectService.documentSalesBackup[index].nuValueLocal;

      let nuAmountBase = 0, nuAmountDiscount = 0, nuAmountTotal = 0, nuAmountPaid = 0, nuBalance = 0, nuAmountTax = 0, nuAmountRetention = 0, nuAmountRetention2 = 0;
      this.collectService.ensureNumber(this.collectService.documentSales[index], 'nuAmountBase');
      this.collectService.ensureNumber(this.collectService.documentSales[index], 'nuAmountDiscount');
      this.collectService.ensureNumber(this.collectService.documentSales[index], 'nuAmountPaid');
      this.collectService.documentSales[index].nuAmountBase == undefined ? 0 : this.collectService.documentSales[index].nuAmountBase;
      this.collectService.documentSales[index].nuAmountDiscount == undefined ? 0 : this.collectService.documentSales[index].nuAmountDiscount;
      this.collectService.documentSales[index].nuAmountPaid == undefined ? 0 : this.collectService.documentSales[index].nuAmountPaid;

      if (this.collectService.documentSales[index].isSave) {
        nuAmountBase = this.collectService.documentSalesBackup[index].nuAmountBase;
        nuAmountDiscount = this.collectService.documentSalesBackup[index].nuAmountDiscount;
        nuAmountTotal = this.collectService.documentSalesBackup[index].nuAmountTotal;
        nuAmountPaid = this.collectService.documentSalesBackup[index].nuAmountPaid;
        nuBalance = this.collectService.documentSalesBackup[index].nuBalance;
        nuAmountTax = this.collectService.documentSales[index].nuAmountTax;
        nuAmountRetention = this.collectService.documentSalesBackup[index].nuAmountRetention;
        nuAmountRetention2 = this.collectService.documentSalesBackup[index].nuAmountRetention2;
      } else if (this.collectService.currencySelected.localCurrency.toString() == "true") {
        //ESTOY EN MONEDA LOCAL
        if (this.collectService.currencySelected.coCurrency == this.collectService.documentSales[index].coCurrency) {
          //AMBAS SON LOCAL, NO HAY QUE CONVERTIR
          nuAmountBase = this.collectService.documentSalesBackup[index].nuAmountBase;
          nuAmountDiscount = this.collectService.documentSalesBackup[index].nuAmountDiscount;
          nuAmountTotal = this.collectService.documentSalesBackup[index].nuAmountTotal;
          nuAmountPaid = this.collectService.documentSalesBackup[index].nuAmountPaid;
          nuBalance = this.collectService.documentSalesBackup[index].nuBalance;
          nuAmountTax = this.collectService.documentSalesBackup[index].nuAmountTax;
          nuAmountRetention = this.collectService.documentSalesBackup[index].nuAmountRetention;
          nuAmountRetention2 = this.collectService.documentSalesBackup[index].nuAmountRetention2;
        } else {
          //CONVERTIR DE HARD A LOCAL usando convertAmount
          nuAmountBase = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountBase, 'hard', 'local', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountBase, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
          nuAmountDiscount = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountDiscount, 'hard', 'local', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountDiscount, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
          nuAmountTotal = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountTotal, 'hard', 'local', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountTotal, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
          nuAmountPaid = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountPaid, 'hard', 'local', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountPaid, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
          nuBalance = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuBalance, 'hard', 'local', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuBalance, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
          nuAmountTax = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountTax, 'hard', 'local', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountTax, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
          nuAmountRetention = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountRetention, 'hard', 'local', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountRetention, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
          nuAmountRetention2 = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountRetention2, 'hard', 'local', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountRetention2, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
        }

      } else {
        //ESTOY EN MONEDA HARD
        if (this.collectService.currencySelected.coCurrency == this.collectService.documentSales[index].coCurrency) {
          //AMBAS SON HARD, NO HAY QUE CONVERTIR
          nuAmountBase = this.collectService.documentSalesBackup[index].nuAmountBase;
          nuAmountDiscount = this.collectService.documentSalesBackup[index].nuAmountDiscount;
          nuAmountTotal = this.collectService.documentSalesBackup[index].nuAmountTotal;
          nuAmountPaid = this.collectService.documentSalesBackup[index].nuAmountPaid;
          nuBalance = this.collectService.documentSalesBackup[index].nuBalance;
          nuAmountTax = this.collectService.documentSalesBackup[index].nuAmountTax;
          nuAmountRetention = this.collectService.documentSalesBackup[index].nuAmountRetention;
          nuAmountRetention2 = this.collectService.documentSalesBackup[index].nuAmountRetention2;
        } else {
          //COVERTIR DE LOCAL A HARD
          nuAmountBase = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountBase, 'local', 'hard', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountBase, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
          nuAmountDiscount = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountDiscount, 'local', 'hard', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountDiscount, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
          nuAmountTotal = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountTotal, 'local', 'hard', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountTotal, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
          nuAmountPaid = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountPaid, 'local', 'hard', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountPaid, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
          nuBalance = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuBalance, 'local', 'hard', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuBalance, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
          nuAmountTax = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountTax, 'local', 'hard', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountTax, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
          nuAmountRetention = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountRetention, 'local', 'hard', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountRetention, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
          nuAmountRetention2 = isNaN(await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountRetention2, 'local', 'hard', coTypeDoc, nuValueLocalDoc)) ? 0 : await this.collectService.convertAmount(this.collectService.documentSalesBackup[index].nuAmountRetention2, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
        }
      }

      /*  nuAmountBase = this.collectService.documentSalesBackup[index].nuAmountBase;
       nuAmountDiscount = this.collectService.documentSalesBackup[index].nuAmountDiscount;
       nuAmountTotal = this.collectService.documentSalesBackup[index].nuAmountTotal;
       nuAmountPaid = this.collectService.documentSales[index].nuBalance;
       nuBalance = this.collectService.documentSalesBackup[index].nuBalance;
       nuAmountTax = this.collectService.documentSalesBackup[index].nuAmountTax;
       nuAmountRetention = this.collectService.documentSalesBackup[index].nuAmountRetention;
       nuAmountRetention2 = this.collectService.documentSalesBackup[index].nuAmountRetention2; */


      this.collectService.documentSaleOpen = {
        idDocument: this.collectService.documentSalesBackup[index].idDocument,
        idClient: this.collectService.documentSalesBackup[index].idClient,
        coClient: this.collectService.documentSalesBackup[index].coClient,
        idDocumentSaleType: this.collectService.documentSalesBackup[index].idDocumentSaleType,
        coDocumentSaleType: this.collectService.documentSalesBackup[index].coDocumentSaleType,
        daDocument: this.collectService.documentSalesBackup[index].daDocument,
        daDueDate: this.collectService.documentSalesBackup[index].daDueDate,
        nuAmountBase: this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(nuAmountBase)),
        nuAmountDiscount: this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(nuAmountDiscount)),
        nuAmountTax: this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(nuAmountTax)),
        nuAmountTotal: this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(nuAmountTotal)),
        nuAmountPaid: this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(nuAmountPaid)),
        nuBalance: this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(nuBalance)),
        coCurrency: this.collectService.documentSales[index].coCurrency,
        idCurrency: this.collectService.documentSales[index].idCurrency,
        nuDocument: this.collectService.documentSales[index].nuDocument,
        txComment: this.collectService.documentSales[index].txComment,
        coDocument: this.collectService.documentSales[index].coDocument,
        coCollection: this.collectService.collection.coCollection,
        nuValueLocal: this.collectService.collection.nuValueLocal,
        stDocumentSale: this.collectService.documentSales[index].stDocumentSale,
        coEnterprise: this.collectService.documentSales[index].coEnterprise,
        idEnterprise: this.collectService.documentSales[index].idEnterprise,
        naType: this.collectService.documentSales[index].naType,
        isSelected: this.collectService.documentSales[index].isSelected,
        positionCollecDetails: this.collectService.documentSales[index].positionCollecDetails,
        nuAmountRetention: Number(nuAmountRetention),
        nuAmountRetention2: Number(nuAmountRetention2),
        daVoucher: this.collectService.documentSales[index].daVoucher,
        //daVoucher: this.daVoucher.split("T")[0],
        nuVaucherRetention: this.collectService.documentSales[index].nuVaucherRetention,
        igtfAmount: this.collectService.documentSales[index].igtfAmount,
        txConversion: this.collectService.documentSales[index].txConversion,
        inPaymentPartial: this.collectService.documentSales[index].inPaymentPartial,
        isSave: this.collectService.documentSales[index].isSave,
      }

      if (this.collectService.retencion)
        this.validateNuVaucherRetention(false);
      else
        this.collectService.validNuRetention = true;

      resolve(true);
    })

  }

  async openDocumentSale(index: number, e: Event) {
    if (this.collectService.documentSales[index].isSelected) {
      this.disabledSaveButton = true;
      this.collectService.documentSaleOpen = new DocumentSale;
      let voucherRetentionValue = "";
      let daVoucherValue = "";
      if (this.collectService.documentSales[index].isSave) {
        const positionCollecDetails = this.collectService.documentSales[index].positionCollecDetails;
        this.collectService.nuBalance = this.collectService.collection.collectionDetails[positionCollecDetails].nuBalanceDoc;
        voucherRetentionValue = this.collectService.collection.collectionDetails[positionCollecDetails].nuVoucherRetention;
        daVoucherValue = this.collectService.collection.collectionDetails[positionCollecDetails].daVoucher!;
      } else {
        this.collectService.nuBalance = this.collectService.documentSales[index].nuBalance;
      }

      await this.calculateSaldo(index);
      await this.calculateDocumentSaleOpen(index);

      // Asignar el valor de nuVaucherRetention y daVoucher después de crear documentSaleOpen
      if (voucherRetentionValue !== undefined) {
        this.collectService.documentSaleOpen.nuVaucherRetention = voucherRetentionValue;
      }
      if (daVoucherValue !== undefined) {
        this.collectService.documentSaleOpen.daVoucher = daVoucherValue;
      }

      if (this.collectService.collection.stCollection == 1) {
        //este cobro fue guardado, se debe colocar los datos del documento como fueron guardados(si es q hubo alguna modificacion)

        const detail = this.collectService.collection.collectionDetails.find(
          d => d.coDocument == this.collectService.documentSaleOpen.coDocument && d.isSave
        );
        if (detail) {
          this.collectService.documentSaleOpen.nuAmountRetention = detail.nuAmountRetention;
          this.collectService.documentSaleOpen.nuAmountRetention2 = detail.nuAmountRetention2;
          this.collectService.documentSaleOpen.daVoucher = detail.daVoucher == null ? "" : detail.daVoucher;
          this.collectService.documentSaleOpen.nuVaucherRetention = detail.nuVoucherRetention;
          this.collectService.documentSaleOpen.inPaymentPartial = detail.inPaymentPartial;
          this.collectService.documentSaleOpen.nuBalance = detail.nuBalanceDoc;

          this.collectService.nuBalance = this.collectService.documentSalesBackup[index].nuBalance;
        } else {
          this.collectService.nuBalance = this.collectService.documentSaleOpen.nuBalance;
        }

      } else {
        const detail = this.collectService.collection.collectionDetails.find(
          d => d.coDocument == this.collectService.documentSaleOpen.coDocument
        );
        console.log(detail, "DETAIL DEL DOCUMENTO ABIERTO");
        console.log(this.collectService.collection.collectionDetails, "DETAIL DEL DOCUMENTO ABIERTO");
        console.log(this.collectService.documentSaleOpen, "DETAIL DEL DOCUMENTO ABIERTO");
        if (detail) {
          /* if (detail && this.collectService.documentSaleOpen.inPaymentPartial) { */
          // ...acciones usando detail...
          this.collectService.documentSaleOpen.nuAmountRetention = detail.nuAmountRetention
          this.collectService.documentSaleOpen.nuAmountRetention2 = detail.nuAmountRetention2
          this.collectService.documentSaleOpen.daVoucher = detail.daVoucher!;
          this.collectService.documentSaleOpen.nuVaucherRetention = detail.nuVoucherRetention;
          this.collectService.documentSaleOpen.inPaymentPartial = detail.inPaymentPartial;
          this.collectService.documentSaleOpen.nuBalance = detail.nuBalanceDoc;
          //this.collectService.documentSaleOpen.nuBalance = detail.nuBalanceDoc - (detail.nuAmountRetention + detail.nuAmountRetention2);

          this.collectService.nuBalance = this.collectService.documentSalesBackup[index].nuBalance;
        }

      }

      if (this.collectService.documentSaleOpen.daVoucher != "")
        this.collectService.validateDaVoucher = true

      //this.collectService.documentSaleOpen.nuAmountTotal = this.collectService.amountPaid;
      if (this.collectService.coTypeModule == '0') {
        /*   if (this.collectService.documentSaleOpen.isSave)
              this.collectService.amountPaid = this.collectService.documentSaleOpen.nuAmountPaid;
            else */
        /* this.collectService.amountPaid = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.documentSaleOpen.nuBalance
          - (this.collectService.documentSaleOpen.nuAmountDiscount + this.collectService.documentSaleOpen.nuAmountRetention + this.collectService.documentSaleOpen.nuAmountRetention2))); */
        this.collectService.amountPaid = this.collectService.documentSaleOpen.nuAmountPaid;
      }
      else
        this.collectService.amountPaidRetention =
          this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber((this.collectService.documentSaleOpen.nuAmountRetention + this.collectService.documentSaleOpen.nuAmountRetention2)));


      this.collectService.ensureNumber(this.collectService.documentSaleOpen, 'nuAmountBase');
      this.collectService.ensureNumber(this.collectService.documentSaleOpen, 'nuAmountDiscount');
      this.collectService.ensureNumber(this.collectService.documentSaleOpen, 'nuAmountRetention');
      this.collectService.ensureNumber(this.collectService.documentSaleOpen, 'nuAmountRetention2');
      this.collectService.ensureNumber(this.collectService.documentSaleOpen, 'nuAmountTax');

      if (this.collectService.multiCurrency) {
        this.collectService.documentSaleOpen.igtfAmount
          = this.collectService.convertirMonto
            (this.collectService.documentSaleOpen.nuBalance * (this.collectService.igtfSelected.price / 100),
              this.collectService.documentSaleOpen.nuValueLocal, this.collectService.documentSaleOpen.coCurrency);

      }
      this.collectService.indexDocumentSaleOpen = index;

      if (this.collectService.collection.collectionDetails.length > 0) {

        const i = this.collectService.collection.collectionDetails.findIndex(
          d => d.coDocument == this.collectService.documentSaleOpen.coDocument
        );
        if (i !== -1) {
          /* this.collectService.isPaymentPartial =
            this.collectService.collection.collectionDetails[i].inPaymentPartial.toString() == "true"; */

          this.collectService.isPaymentPartial = this.collectService.documentSaleOpen.inPaymentPartial.toString() == "true";
          this.collectService.documentSaleOpen.positionCollecDetails = i;
        }
      } else
        this.collectService.isPaymentPartial = false;
      // Force UI update after saldo y nuVaucherRetention
      this.cdr.detectChanges();
      this.collectService.cobrosComponent = false;
      this.collectService.isOpen = true;
    }

    if (this.collectService.retencion)
      this.validateNuVaucherRetention(false);
    else
      this.collectService.validNuRetention = true;


    console.log(this.collectService.amountPaid, "AMOUNT PAID AL ABRIR")
  }

  selectDocumentSale(documentSale: DocumentSale, id: number, event: any) {
    documentSale.isSelected = event.detail.checked;

    if (documentSale.coDocumentSaleType == "NC" && this.collectService.collection.collectionDetails.length == 0) {


      //NO PERMITO SELECCIONAR DE PRIMERO UN DOCUMENTO DE TIPO NOTA DE CREDITO, ENVIO MENSAJE?
      if (documentSale.isSelected) {
        this.collectService.collection.collectionDetails.splice(1, 1);
        setTimeout(() => {
          documentSale.isSelected = false;
        }, 300);

        this.alertMessageOpen = true;
        this.collectService.mensaje = "El primer documento a seleccionar no puede ser Nota de Crédito";
      }

    } else if (documentSale.isSelected) {
      /* if (this.collectService.coTypeModule == "2")
        this.collectService.onCollectionValidToSend(true); */

      this.collectService.documentSales[id].isSelected = true;
      this.collectService.documentSalesBackup[id].isSelected = true;
      this.collectService.haveDocumentSale = true;
      this.collectService.disabledSelectCollectMethodDisabled = false;
      this.initCollectionDetail(documentSale, id);
    } else {
      this.collectService.getDocumentById(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise,
        this.collectService.documentSales[id].idDocument, id, this.collectService.documentSales[id].positionCollecDetails).then(resp => {

          let pos;
          pos = resp;
          /* pos = this.collectService.documentSales[id].positionCollecDetails == -1 ? 0 : this.collectService.documentSales[id].positionCollecDetails;
          pos == undefined ? 0 : pos; */
          this.collectService.collection.collectionDetails.splice(
            pos, pos + 1);

          for (let i = 0; i < this.collectService.documentSales.length; i++) {
            if (this.collectService.documentSales[i].isSelected && this.collectService.documentSales[i].positionCollecDetails != 0) {
              this.collectService.documentSales[i].positionCollecDetails -= 1;
              this.collectService.documentSalesBackup[i].positionCollecDetails -= 1;
            }
          }
          this.collectService.documentSales[id].positionCollecDetails = -1;
          this.collectService.documentSalesBackup[id].positionCollecDetails = -1;

          this.collectService.documentSales[id].inPaymentPartial = false;
          this.collectService.documentSalesBackup[id].inPaymentPartial = false;

          if (this.collectService.collection.collectionDetails.length == 0) {

            this.collectService.haveDocumentSale = false;
            this.collectService.disabledSelectCollectMethodDisabled = true;

            this.collectService.collection.collectionPayments = [] as CollectionPayment[];
            this.collectService.pagoEfectivo = [] as PagoEfectivo[];
            this.collectService.pagoCheque = [] as PagoCheque[];
            this.collectService.pagoDeposito = [] as PagoDeposito[];
            this.collectService.pagoTransferencia = [] as PagoTransferencia[];
            this.collectService.pagoOtros = [] as PagoOtros[];
            this.collectService.collection.nuAmountFinal = 0;
            this.collectService.montoTotalPagar = 0;
            this.collectService.montoTotalPagarConversion = 0;
            this.collectService.montoTotalPagado = 0;
            this.collectService.montoTotalPagadoConversion = 0;
            this.collectService.onCollectionValidToSend(false);
          } else {

          }
          this.collectService.documentSales[id].isSelected = false
          this.collectService.documentSalesBackup[id].isSelected = false;
          //this.collectService.documentSalesBackup[id] = obj;
          this.collectService.calculatePayment("", 0);
          this.cdr.detectChanges();
        });

    }


  }

  async initCollectionDetail(documentSale: DocumentSale, id: number) {
    let nuAmountTotal = 0, nuAmountBalance = 0, nuAmountTotalConversion = 0, nuAmountBalanceConversion = 0;

    const coTypeDoc = documentSale.coDocumentSaleType;
    const nuValueLocalDoc = documentSale.nuValueLocal;

    if (this.collectService.multiCurrency) {

      if (this.collectService.currencySelected.localCurrency.toString() == "true") {
        //ESTOY EN MONEDA LOCAL
        if (this.collectService.currencySelected.coCurrency == this.collectService.documentSales[id].coCurrency) {
          //MONEDA DEL DOCUMENTO ES LOCAL, CONVERTIR A HARD
          nuAmountTotal = documentSale.nuAmountTotal;
          nuAmountBalance = documentSale.nuBalance;
          nuAmountTotalConversion = await this.collectService.convertAmount(documentSale.nuAmountTotal, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
          nuAmountBalanceConversion = await this.collectService.convertAmount(documentSale.nuBalance, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
        } else {
          //MONEDA DEL DOCUMENTO ES HARD
          nuAmountTotal = await this.collectService.convertAmount(documentSale.nuAmountTotal, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
          nuAmountBalance = await this.collectService.convertAmount(documentSale.nuBalance, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
          nuAmountTotalConversion = documentSale.nuAmountTotal;
          nuAmountBalanceConversion = documentSale.nuBalance;
        }
      } else {
        //ESTOY EN MONEDA HARD
        if (this.collectService.currencySelected.coCurrency == this.collectService.documentSales[id].coCurrency) {
          //MONEDA DEL DOCUMENTO ES HARD, CONVERSION A LOCAL
          nuAmountTotal = documentSale.nuAmountTotal;
          nuAmountBalance = documentSale.nuBalance;
          nuAmountTotalConversion = await this.collectService.convertAmount(documentSale.nuAmountTotal, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
          nuAmountBalanceConversion = await this.collectService.convertAmount(documentSale.nuBalance, 'hard', 'local', coTypeDoc, nuValueLocalDoc);
        } else {
          //MONEDA DEL DOCUMENTO ES LOCAL, CONVERTIR A HARD
          nuAmountTotal = await this.collectService.convertAmount(documentSale.nuAmountTotal, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
          nuAmountBalance = await this.collectService.convertAmount(documentSale.nuBalance, 'local', 'hard', coTypeDoc, nuValueLocalDoc);
          nuAmountTotalConversion = documentSale.nuAmountTotal;
          nuAmountBalanceConversion = documentSale.nuBalance;

        }
      }
      //}
    } else {
      nuAmountTotal = documentSale.nuAmountTotal;
      nuAmountBalance = documentSale.nuBalance;
      nuAmountBalanceConversion = 0;
      nuAmountTotalConversion = 0;
    }


    /* this.collectService.montoTotalPagar += documentSale.nuAmountTotal; */

    this.collectService.collection.collectionDetails.push({
      //idCollectionDetail: null,
      coCollection: this.collectService.collection.coCollection,
      coDocument: documentSale.coDocument.toString(),
      idDocument: documentSale.idDocument,
      inPaymentPartial: false,
      nuVoucherRetention: "",
      nuAmountRetention: 0, //iva
      nuAmountRetention2: 0, //islr
      nuAmountRetentionConversion: 0, //iva
      nuAmountRetention2Conversion: 0, //islr
      nuAmountRetentionIslrConversion: 0, //islr
      nuAmountRetentionIvaConversion: 0, //iva
      nuAmountPaid: nuAmountBalance,
      nuAmountPaidConversion: nuAmountBalanceConversion,
      nuAmountDiscount: documentSale.nuAmountDiscount,
      nuAmountDiscountConversion: 0,
      nuAmountDoc: nuAmountTotal!,
      nuAmountDocConversion: nuAmountTotalConversion,
      daDocument: documentSale.daDocument,
      nuBalanceDoc: nuAmountBalance!,
      nuBalanceDocConversion: nuAmountBalanceConversion,
      coOriginal: documentSale.coCurrency,
      coTypeDoc: documentSale.coDocumentSaleType,
      nuValueLocal: documentSale.nuValueLocal,
      nuAmountIgtf: 0,
      nuAmountIgtfConversion: 0,
      st: 0,
      isSave: false,
      daVoucher: this.daVoucher.split("T")[0],
    })
    this.collectService.documentSales[id].positionCollecDetails = this.collectService.collection.collectionDetails.length - 1;
    this.collectService.documentSalesBackup[id].positionCollecDetails = this.collectService.collection.collectionDetails.length - 1;

    this.collectService.calculatePayment("", 0);
    this.cdr.detectChanges();
  }



  saveDocumentSale(action: Boolean) {
    let validate = false;
    if (this.collectService.validNuRetention) {
      if (action) {
        if (this.disabledSaveButton)
          this.disabledSaveButton = false;

        // Actualiza los datos de documentSales y collectionDetails con el helper
        this.collectService.copyDocumentSaleOpenToSalesAndDetails();

        if (this.collectService.coTypeModule == '2') {
          this.collectService.amountPaid = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaidRetention));
          this.collectService.documentSaleOpen.nuAmountPaid = this.collectService.amountPaidRetention;
        }

        // Si necesitas lógica adicional para multi-moneda, pago parcial, etc., agrégala aquí
        if (!this.collectService.isPaymentPartial && this.collectService.multiCurrency) {
          const idx = this.collectService.documentSaleOpen.positionCollecDetails;
          const open = this.collectService.documentSaleOpen;
          const detail = this.collectService.collection.collectionDetails[idx];
          if (detail) {
            detail.nuAmountRetentionConversion = this.collectService.convertirMonto(open.nuAmountRetention, open.nuValueLocal, this.collectService.collection.coCurrency);
            detail.nuAmountRetention2Conversion = this.collectService.convertirMonto(open.nuAmountRetention2, open.nuValueLocal, this.collectService.collection.coCurrency);
            detail.nuAmountPaidConversion = this.collectService.convertirMonto(open.nuAmountPaid, open.nuValueLocal, this.collectService.collection.coCurrency);
          }
        }

        // Lógica de validación y flags
        //this.collectService.isPaymentPartial = !this.collectService.isPaymentPartial;
        this.collectService.collection.collectionDetails[this.collectService.documentSaleOpen.positionCollecDetails]!.inPaymentPartial! = this.collectService.isPaymentPartial;

        if (this.collectService.coTypeModule != "2") {
          //ES COBRO O IGTF
          if (this.collectService.isPaymentPartial) {
            if (this.collectService.documentSaleOpen.nuAmountPaid > 0) {
              const idx = this.collectService.documentSaleOpen.positionCollecDetails;
              const open = this.collectService.documentSaleOpen;
              const detail = this.collectService.collection.collectionDetails[idx];
              if (detail) {
                detail.nuAmountPaid = open.nuAmountPaid;
                if (!this.collectService.isPaymentPartial && this.collectService.multiCurrency) {
                  detail.nuAmountPaidConversion = this.collectService.convertirMonto(open.nuAmountPaid, open.nuValueLocal, open.coCurrency);
                }
              }
              validate = true;
            } else {
              console.log("el monto parcial no puede ser vacio")
            }
          } else {
            validate = true;
          }
        } else {
          validate = true;
        }

        if (validate) {
          this.collectService.calculatePayment("", 0);
          this.cdr.detectChanges();
          console.log("GUARDAR")
          this.collectService.isOpen = false;
        } else {
          console.log("HAY UN ERROR no debo dejar");
        }

        this.collectService.validNuRetention = false;
      } else {
        console.log("CANCELAR")
        this.collectService.restoreDocumentSaleState(this.collectService.indexDocumentSaleOpen);
        if (this.disabledSaveButton)
          this.disabledSaveButton = false;

        if (!this.collectService.documentSaleOpen.inPaymentPartial)
          this.collectService.isPaymentPartial = false;

        this.collectService.validNuRetention = false;
        this.collectService.isOpen = action;


      }
    } else {
      if (action) {
        this.collectService.documentSales[this.collectService.indexDocumentSaleOpen].nuAmountPaid = this.collectService.amountPaid;
        this.collectService.documentSalesBackup[this.collectService.indexDocumentSaleOpen].nuAmountPaid = this.collectService.amountPaid;
        this.saveStatusDocument();
      } else {
        if (this.disabledSaveButton)
          this.disabledSaveButton = false;

        this.collectService.validNuRetention = false;
        this.collectService.isOpen = action;
      }
    }
  }

  saveStatusDocument() {
    let validate = false;
    if (this.disabledSaveButton)
      this.disabledSaveButton = false;

    // Usa el helper para actualizar documentSales y collectionDetails
    this.collectService.copyDocumentSaleOpenToSalesAndDetails();

    if (this.collectService.coTypeModule == '2') {
      this.collectService.amountPaid = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaidRetention));
      this.collectService.documentSaleOpen.nuAmountPaid = this.collectService.amountPaidRetention;
    }

    this.collectService.collection.collectionDetails[this.collectService.documentSaleOpen.positionCollecDetails]!.inPaymentPartial! = this.collectService.isPaymentPartial;

    if (this.collectService.coTypeModule != "2") {
      //ES COBRO O IGTF
      if (this.collectService.isPaymentPartial) {
        if (this.collectService.documentSaleOpen.nuAmountPaid > 0) {
          const idx = this.collectService.documentSaleOpen.positionCollecDetails;
          const open = this.collectService.documentSaleOpen;
          const detail = this.collectService.collection.collectionDetails[idx];
          if (detail) {
            detail.nuAmountPaid = open.nuAmountPaid;
            if (!this.collectService.isPaymentPartial && this.collectService.multiCurrency) {
              detail.nuAmountPaidConversion = this.collectService.convertirMonto(open.nuAmountPaid, open.nuValueLocal, open.coCurrency);
            }
          }
          validate = true;
        } else {
          console.log("el monto parcial no puede ser vacio")
        }
      } else {
        validate = true;
      }
    } else {
      validate = true;
    }

    if (validate) {
      this.collectService.calculatePayment("", 0);
      this.cdr.detectChanges();
      console.log("GUARDAR")
      this.collectService.isOpen = false;
    } else {
      console.log("HAY UN ERROR no debo dejar");
    }

    this.collectService.validNuRetention = false;
  }

  setAmountTotal() {
    const {
      coTypeModule,
      currencySelected,
      currencySelectedDocument,
      documentSaleOpen,
      documentSalesBackup,
      indexDocumentSaleOpen,
      parteDecimal,
      igtfSelected,
      multiCurrency
    } = this.collectService;

    const { nuAmountDiscount, nuAmountRetention, nuAmountRetention2, coCurrency } = documentSaleOpen;

    let amountPaidRetention = 0;
    let amountPaidConversion = 0;

    // --- Retenciones y conversiones ---
    const sumRetentions = nuAmountDiscount + nuAmountRetention + nuAmountRetention2;

    if (coTypeModule === '2') {
      if (currencySelected.localCurrency.toString() === 'true') {
        if (currencySelectedDocument.localCurrency.toString() === 'true') {
          amountPaidRetention = sumRetentions;
          amountPaidConversion = this.collectService.toHard(amountPaidRetention);
        } else {
          amountPaidRetention = sumRetentions;
          amountPaidConversion = this.collectService.toHard(amountPaidRetention);
        }
      } else {
        if (currencySelectedDocument.hardCurrency.toString() === 'true') {
          amountPaidRetention = sumRetentions;
          amountPaidConversion = this.collectService.toLocal(amountPaidRetention);
        } else {
          amountPaidRetention = this.collectService.toHard(sumRetentions);
          amountPaidConversion = this.collectService.toLocal(amountPaidRetention);
        }
      }
      this.collectService.amountPaidRetention = amountPaidRetention;
      this.collectService.amountPaidConversion = amountPaidConversion;
    }

    // --- Monto pagado ---
    this.collectService.amountPaid = documentSaleOpen.nuBalance - sumRetentions;

    // --- Ajustes finales ---
    if (coTypeModule === '2') {
      documentSaleOpen.nuAmountPaid = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(amountPaidRetention));
      this.collectService.amountPaidDoc = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaidDoc));
      this.collectService.amountPaid = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaid));
      this.collectService.amountPaidRetention = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaidRetention));
    } else {
      this.collectService.amountPaidDoc = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaidDoc));
      this.collectService.amountPaid = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaid));
      documentSaleOpen.igtfAmount = this.collectService.convertirMonto(
        documentSaleOpen.nuBalance * (igtfSelected.price / 100),
        documentSaleOpen.nuValueLocal,
        documentSaleOpen.coCurrency
      );
    }

    this.collectService.collection.collectionDetails[documentSaleOpen.positionCollecDetails]!.nuAmountPaid = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaid));

    this.collectService.collection.collectionDetails[documentSaleOpen.positionCollecDetails]!.nuAmountPaidConversion
      = Number(this.currencyService.formatNumber(this.collectService.convertirMonto(this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaid)),
        this.collectService.collection.nuValueLocal, this.collectService.collection.coCurrency)));

    let amountPaidAux, nuAmountDiscountAux, nuAmountRetentionAux, nuAmountRetention2Aux;
    amountPaidAux = this.collectService.amountPaid;
    nuAmountDiscountAux = nuAmountDiscount;
    nuAmountRetentionAux = nuAmountRetention;
    nuAmountRetention2Aux = nuAmountRetention2;

    this.collectService.documentSales[indexDocumentSaleOpen].nuAmountPaid = amountPaidAux;
    this.collectService.documentSales[indexDocumentSaleOpen].nuAmountDiscount = nuAmountDiscountAux;
    this.collectService.documentSales[indexDocumentSaleOpen].nuAmountRetention = nuAmountRetentionAux;
    this.collectService.documentSales[indexDocumentSaleOpen].nuAmountRetention2 = nuAmountRetention2Aux;

    this.collectService.documentSalesBackup[indexDocumentSaleOpen].nuAmountPaid = amountPaidAux;
    this.collectService.documentSalesBackup[indexDocumentSaleOpen].nuAmountDiscount = nuAmountDiscountAux;
    this.collectService.documentSalesBackup[indexDocumentSaleOpen].nuAmountRetention = nuAmountRetentionAux;
    this.collectService.documentSalesBackup[indexDocumentSaleOpen].nuAmountRetention2 = nuAmountRetention2Aux;

    let positionCollecDetails = this.collectService.documentSaleOpen.positionCollecDetails;

    this.collectService.collection.collectionDetails[positionCollecDetails].nuAmountDiscount = nuAmountDiscount;
    this.collectService.collection.collectionDetails[positionCollecDetails].nuAmountDiscountConversion = 0;
    this.collectService.collection.collectionDetails[positionCollecDetails].nuAmountRetention = nuAmountRetention;
    this.collectService.collection.collectionDetails[positionCollecDetails].nuAmountRetentionConversion = 0;
    this.collectService.collection.collectionDetails[positionCollecDetails].nuAmountRetention2 = nuAmountRetention2;
    this.collectService.collection.collectionDetails[positionCollecDetails].nuAmountRetention2Conversion = 0;
    this.collectService.collection.collectionDetails[positionCollecDetails].nuAmountPaid = amountPaidAux;

    this.validate();

    return Promise.resolve(true);
  }

  partialPay(event: any) {
    this.collectService.isChangePaymentPartial = true;
    this.collectService.isPaymentPartial = event.target.checked;

    if (event.target.checked) {
      this.collectService.amountPaid = 0;
      this.collectService.collection.collectionDetails[this.collectService.documentSaleOpen.positionCollecDetails]!.inPaymentPartial = true;
      this.disabledSaveButton = true;
      this.collectService.isChangePaymentPartial = false;
      this.collectService.validNuRetention = true;

      if (
        this.collectService.historicPartialPayment &&
        this.collectService.documentSales[this.collectService.indexDocumentSaleOpen].inPaymentPartial
      ) {
        this.collectService.mensaje = this.collectService.collectionTags.get('COB_MSJ_HAVE_PAYPARTIAL')!;
        this.alertMessageOpen2 = true;
      }
      return; // Early return, no más lógica abajo
    }

    // Si NO está checked, restaurar balances y estados
    this.collectService.getDocumentById(
      this.synchronizationServices.getDatabase(),
      this.collectService.collection.idEnterprise,
      this.collectService.documentSaleOpen.idDocument,
      this.collectService.indexDocumentSaleOpen,
      this.collectService.documentSaleOpen.positionCollecDetails
    ).then(resp => {
      this.calculateSaldo(this.collectService.indexDocumentSaleOpen).then(() => {
        let positionCollecDetails = resp;
        this.calculateDocumentSaleOpen(this.collectService.indexDocumentSaleOpen).then(() => {
          this.collectService.documentSaleOpen.positionCollecDetails = positionCollecDetails;
          this.collectService.documentSaleOpen.isSelected = true;
          this.collectService.documentSaleOpen.inPaymentPartial = false;
          this.collectService.documentSales[this.collectService.indexDocumentSaleOpen].isSelected = true;
          this.collectService.documentSalesBackup[this.collectService.indexDocumentSaleOpen].isSelected = true;
          this.disabledSaveButton = true;

          // Usa el helper para actualizar balances
          this.collectService.updateBalancesOnPartialPay(this.collectService.indexDocumentSaleOpen);

          this.collectService.collection.collectionDetails[this.collectService.documentSaleOpen.positionCollecDetails]!.inPaymentPartial = false;

          this.validate();
        });
      });
    });

    this.collectService.amountPaid = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaid));
    this.collectService.documentSales[this.collectService.indexDocumentSaleOpen].inPaymentPartial = event.target.checked;
  }

  setPartialPay() {
    if (this.collectService.amountPaid == null || this.collectService.amountPaid <= 0) {
      this.disabledSaveButton = true;
      this.collectService.amountPaid = 0;
    } else if (this.collectService.amountPaid > 0) {
      this.collectService.documentSaleOpen.nuBalance = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaid));
      this.collectService.documentSaleOpen.nuAmountPaid = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaid));
      this.collectService.amountPaidDoc = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(this.collectService.amountPaidDoc));
      this.validate();
    }

  }

  private isNullOrZero(value: any): boolean {
    return value == null || value === 0;
  }

  private isEmptyOrZeroRetention(): boolean {
    const { nuAmountRetention, nuAmountRetention2 } = this.collectService.documentSaleOpen;
    return this.isNullOrZero(nuAmountRetention) && this.isNullOrZero(nuAmountRetention2);
  }

  validate() {
    const cs = this.collectService;
    const doc = cs.documentSaleOpen;
    const index = cs.indexDocumentSaleOpen;
    const parteDecimal = cs.parteDecimal;
    // Asegura valores numéricos antes de operar
    this.collectService.ensureNumber(doc, 'nuAmountRetention');
    this.collectService.ensureNumber(doc, 'nuAmountRetention2');
    this.collectService.ensureNumber(doc, 'nuAmountDiscount');
    this.collectService.ensureNumber(doc, 'nuAmountTax');
    this.collectService.ensureNumber(doc, 'nuAmountBase');
    this.collectService.ensureNumber(doc, 'nuAmountPaid');
    this.collectService.ensureNumber(doc, 'nuBalance');
    this.collectService.ensureNumber(doc, 'nuAmountRetention');
    this.collectService.ensureNumber(doc, 'nuAmountRetention2');
    // ...otros campos numéricos que uses...

    if (cs.coTypeModule == '2') {
      /* if (this.collectService.isRetentionInvalid(doc.nuAmountRetention, doc.nuAmountRetention2, doc.nuBalance)) {
        cs.mensaje = "El monto no puede ser mayor al monto del documento o es inválido";
        this.alertMessageOpen = true;
        this.disabledSaveButton = true;
        cs.amountPaid = cs.documentSalesBackup[index].nuBalance;
        cs.amountPaymentPartial = cs.documentSalesBackup[index].nuBalance;
        return;
      } */
      this.disabledSaveButton = false;
      if (cs.validNuRetention && doc.daVoucher === '') {
        this.disabledSaveButton = true;
      }
      cs.calculatePayment("", 0);
      this.cdr.detectChanges();
      return;
    }

    // Si es pago parcial
    if (cs.isPaymentPartial) {
      let montoDoc = 0;
      if (this.collectService.currencySelected.localCurrency.toString() === "true") {
        if (this.collectService.currencySelected.coCurrency === doc.coCurrency) {
          //moneda del cobro loca, moneda del documento local
          montoDoc = this.collectService.documentSales[index].nuBalance;
        } else {
          //moneda del cobro loca, moneda del documento hard
          montoDoc = this.collectService.toLocal(this.collectService.documentSales[index].nuBalance);
        }
      } else {
        if (this.collectService.currencySelected.coCurrency === doc.coCurrency) {
          //moneda del cobro hard, moneda documento hard
          montoDoc = this.collectService.documentSales[index].nuBalance;
        } else {
          //moneda del cobro hard, moneda en local
          montoDoc = this.collectService.toHard(this.collectService.documentSales[index].nuBalance);
        }
      }
      if (Math.abs(cs.amountPaid) >= this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(montoDoc))) {
        cs.mensaje = cs.collectionTags.get('COB_MSJ_PARTIALPAY_MAYOR_DOCAMOUNT')!;
        this.alertMessageOpen = true;
        this.disabledSaveButton = true;
        cs.amountPaid = doc.nuAmountPaid;
        cs.amountPaymentPartial = doc.nuBalance;
        cs.amountPaidDoc = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(cs.amountPaid));
        return;
      }
      this.disabledSaveButton = false;

      let amountPaid = 0;
      if (this.collectService.currencySelected.localCurrency.toString() == "true") {
        //estoy en moneda local
        if (this.collectService.currencySelected.coCurrency == doc.coCurrency) {
          //moneda del documento es local
          amountPaid = cs.amountPaid;
        } else {
          //moneda del documento es hard
          amountPaid = cs.amountPaid / this.collectService.collection.nuValueLocal;
        }
      } else {
        //estoy ne moneda hard
        if (this.collectService.currencySelected.coCurrency == doc.coCurrency) {
          //moneda del documento es hard
          amountPaid = cs.amountPaid;
        } else {
          //moneda del documento es local
          amountPaid = cs.amountPaid * this.collectService.collection.nuValueLocal;
        }
      }

      //cs.documentSales[index].nuBalance = amountPaid;
      cs.documentSales[index].nuAmountPaid = amountPaid;
      //cs.documentSalesBackup[index].nuBalance = amountPaid;
      cs.documentSalesBackup[index].nuAmountPaid = amountPaid;

      cs.calculatePayment("", 0);
      this.cdr.detectChanges();
      return;
    }

    // Si hay retenciones
    if (doc.nuAmountRetention || doc.nuAmountRetention2) {
      if (cs.validNuRetention) {
        // Usa el helper aquí también
        if (this.isEmptyOrZeroRetention()) {
          this.disabledSaveButton = true;
          return;
        }
        if (doc.daVoucher === "") {
          this.disabledSaveButton = true;
          if (Math.abs(cs.amountPaid) > doc.nuBalance || cs.amountPaid < 0) {
            cs.mensaje = "El monto no puede ser mayor al monto del documento";
            this.alertMessageOpen = true;
          }
          return;
        }
        if (Math.abs(cs.amountPaid) > doc.nuBalance || cs.amountPaid < 0) {
          cs.mensaje = "El monto no puede ser mayor al monto del documento";
          this.alertMessageOpen = true;
          this.disabledSaveButton = true;
          return;
        }
        cs.documentSales[index].nuBalance = cs.amountPaid;
        this.disabledSaveButton = false;
        cs.calculatePayment("", 0);
        this.cdr.detectChanges();
        return;
      }
    }

    // Si el monto pagado es mayor al saldo
    if (Math.abs(cs.amountPaid) > doc.nuBalance) {
      cs.mensaje = cs.isPaymentPartial
        ? cs.collectionTags.get('COB_MSJ_PARTIALPAY_MAYOR_DOCAMOUNT')!
        : cs.collectionTags.get('COB_MSJ_PAY_MAYOR_DOCAMOUNT')!;
      this.alertMessageOpen = true;
      this.disabledSaveButton = true;
      cs.amountPaid = doc.nuBalance;
      cs.amountPaymentPartial = doc.nuBalance;
      cs.amountPaidDoc = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(cs.amountPaid));
      return;
    }

    // Validación de retenciones vacías usando el helper
    if (cs.validNuRetention && this.isEmptyOrZeroRetention()) {
      this.disabledSaveButton = true;
      return;
    }

    this.disabledSaveButton = false;
    cs.amountPaymentPartial = 0;
    doc.nuBalance = doc.nuBalance - (cs.amountPaymentPartial + doc.nuAmountRetention + doc.nuAmountRetention2);
    doc.nuAmountPaid = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(cs.amountPaid));
    cs.amountPaidDoc = this.currencyService.cleanFormattedNumber(this.currencyService.formatNumber(cs.amountPaidDoc));

    if (!this.disabledSaveButton) {
      cs.calculatePayment("", 0);
      this.cdr.detectChanges();
    }

    if (cs.isChangePaymentPartial && !cs.isPaymentPartial) {
      this.disabledSaveButton = false;
      cs.calculatePayment("", 0);
      this.cdr.detectChanges();
    }
  }

  imprimir() {
    console.log(this.collectService.collection)
  }

  //[a-zA-Z ]

  validateNuVaucherRetention(sendMessage: boolean) {
    //sizeRetention esta variable nos dira el tamaño aceptado de la retencion
    if (this.collectService.sizeRetention != 0) {

      if (this.collectService.formatRetention === "number") {
        //SOLO NUMERO
        if (this.collectService.documentSaleOpen.nuVaucherRetention.toString().length != this.collectService.sizeRetention) {
          //console.warn("error, el campo nuVaucherRetention no puede ser mayor a", this.globalConfig.get('sizeRetention'))
          this.disabledSaveButton = true;
          //this.collectService.mensaje = this.collectService.collectionTags.get('COB_MSJ_RETENTION_LONG_CARACTERES')!;
          this.collectService.mensaje = 'El comprobante de retenci\u00f3n debe tener una longitud de ' + this.collectService.sizeRetention + ' caracteres ';
          if (sendMessage)
            this.alertMessageOpen = true;

          this.collectService.validNuRetention = false;
        } else {
          this.disabledSaveButton = false;
          this.collectService.validNuRetention = true;
        }
      } else if (this.collectService.formatRetention === "text") {
        //SOLO TEXTO
        if (this.collectService.documentSaleOpen.nuVaucherRetention.length != this.collectService.sizeRetention) {
          //this.regexLongitude.exec(this.clientLogic.coordenada.lng.toString())
          if (this.collectService.regexOnlyText.test(this.collectService.documentSaleOpen.nuVaucherRetention)) {
            //good
            this.disabledSaveButton = true;
            //this.collectService.mensaje = this.collectService.collectionTags.get('COB_MSJ_RETENTION_LONG_CARACTERES')!;
            this.collectService.mensaje = 'El comprobante de retenci\u00f3n debe tener una longitud de ' + this.collectService.sizeRetention + ' caracteres ';

            if (sendMessage)
              this.alertMessageOpen = true;
            this.collectService.validNuRetention = false;
          } else {
            //error
            this.disabledSaveButton = true;
            this.collectService.mensaje = this.collectService.collectionTags.get('COB_MSJ_RETENTION_ONLY_TEXT')!;
            if (sendMessage)
              this.alertMessageOpen = true;
            this.collectService.validNuRetention = false;
          }

        } else {
          this.disabledSaveButton = false;
          this.collectService.validNuRetention = true;
        }


      } else {
        //alphanumeric
        if (this.collectService.documentSaleOpen.nuVaucherRetention.length != this.collectService.sizeRetention) {
          //this.regexLongitude.exec(this.clientLogic.coordenada.lng.toString())
          if (this.collectService.regexAlphaNumeric.test(this.collectService.documentSaleOpen.nuVaucherRetention)) {
            //good
            this.disabledSaveButton = true;
            //this.collectService.mensaje = this.collectService.collectionTags.get('COB_MSJ_RETENTION_LONG_CARACTERES')!;
            this.collectService.mensaje = 'El comprobante de retenci\u00f3n debe tener una longitud de ' + this.collectService.sizeRetention + ' caracteres ';
            this.alertMessageOpen = true;
            this.collectService.validNuRetention = false;
          } else {
            //error
            this.disabledSaveButton = true;
            this.collectService.mensaje = this.collectService.collectionTags.get('COB_MSJ_RETENTION_ALPHANUMERIC')!;
            this.alertMessageOpen = true;
            this.collectService.validNuRetention = false;
          }

        } else {
          this.disabledSaveButton = false;
          this.collectService.validNuRetention = true;
        }
      }
    } else {
      //si es 0 no hay validaciones
      this.disabledSaveButton = false;
      if (this.collectService.documentSaleOpen.nuVaucherRetention == "")
        this.collectService.validNuRetention = false;
      else
        this.collectService.validNuRetention = true;
    }

    if (this.collectService.validNuRetention && this.isEmptyOrZeroRetention()) {
      this.disabledSaveButton = true;
      return;
    }

    if (this.collectService.validNuRetention && this.collectService.documentSaleOpen.daVoucher == "") {
      this.collectService.validateDaVoucher = false;
      this.disabledSaveButton = true;
    }


  }


  setResult(ev: any) {
    console.log('Apretó:' + ev.detail.role);

    this.collectService.separateIgtf = false;
    this.collectService.collection.hasIGTF = false;
    if (ev.detail.role === 'confirm') {
      this.alertMessageOpen = false;
    } else {
      this.alertMessageOpen = false;
    }
  }

  setResult2(ev: any) {
    if (ev.detail.role === 'confirm') {
      this.alertMessageOpen2 = false;
      //DEBO MOSTRAR LA MISMA TABLA(MODAL) D PAGOS PARCIALES QUE EN LA TABLA DOCUMENTOS
      this.openPartialPayment(this.collectService.documentSaleOpen.coDocument);
    } else {
      this.alertMessageOpen2 = false;
    }
  }

  setDaVoucher() {
    console.log(this.daVoucher);
    this.collectService.validateDaVoucher = true;
    this.daVoucher = this.daVoucher.split("T")[0];
    this.collectService.documentSaleOpen.daVoucher = this.daVoucher;
    if (this.collectService.validNuRetention) {
      if (!this.collectService.retencion) {
        this.disabledSaveButton = false;
      } else if (this.collectService.documentSaleOpen.nuAmountRetention + this.collectService.documentSaleOpen.nuAmountRetention2 == 0) {
        this.disabledSaveButton = true;
      } else
        this.disabledSaveButton = false;

    } else
      this.disabledSaveButton = false;
  }

  openPartialPayment(coDocument: string) {
    this.collectService.getPaymentPartialByDocument(this.synchronizationServices.getDatabase(), coDocument).then(resp => {
      this.collectService.openPaymentPartial = true;
    })
  }
  print() {
    console.log(this.collectService.collection);
  }

  formatNumber(num: number) {
    return this.currencyService.formatNumber(num);
  }

  getTasaByAmount(amount: number, nuValueLocal: number) {
    if (nuValueLocal == null) return this.formatNumber(amount);
    if (amount < 0) {
      this.collectService.calculateDifference = true;
      return this.formatNumber(nuValueLocal);
    } else {
      this.collectService.calculateDifference = true;
      return this.formatNumber(this.collectService.getNuValueLocal());
    }
  }

  oppositeCoCurrency(coCurrency: string): string {
    return this.currencyService.getOppositeCurrency(coCurrency)?.coCurrency ?? '';
  }
}