import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { ChangeDetectorRef } from '@angular/core';


import { Client } from 'src/app/modelos/tables/client';
import { Collection, CollectionDetail, CollectionPayment } from 'src/app/modelos/tables/collection';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { Currencies } from 'src/app/modelos/tables/currencies';
import { ConversionType } from 'src/app/modelos/tables/conversionType';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { IgtfList } from 'src/app/modelos/tables/igtfList';
import { GlobalConfigService } from '../globalConfig/global-config.service';
import { PagoCheque } from 'src/app/modelos/pago-cheque';
import { BankAccount } from 'src/app/modelos/tables/bankAccount';
import { ServicesService } from '../services.service';
import { DateServiceService } from '../dates/date-service.service';
import { PagoDeposito } from 'src/app/modelos/pago-deposito';
import { PagoEfectivo } from 'src/app/modelos/pago-efectivo';
import { PagoOtros } from 'src/app/modelos/pago-otros';
import { PagoTransferencia } from 'src/app/modelos/pago-transferencia';
import { TiposPago } from 'src/app/modelos/tipos-pago';
import { CurrencyService } from '../currency/currency.service';
import { Retention } from 'src/app/modelos/retention';
import { Bank } from 'src/app/modelos/tables/bank';
import { PaymentPartials } from 'src/app/modelos/paymentPartial';
import { ClientBankAccount } from 'src/app/modelos/tables/clientBankAccount';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { HistoryTransaction } from '../historyTransaction/historyTransaction';
import { ItemListaCobros } from 'src/app/cobros/item-lista-cobros';

@Injectable({
  providedIn: 'root'
})

export class CollectionService {
  public globalConfig = inject(GlobalConfigService);
  public services = inject(ServicesService);
  public dateServ = inject(DateServiceService);
  public historyTransaction = inject(HistoryTransaction);

  private currencyService = inject(CurrencyService);
  public adjuntoService = inject(AdjuntoService);

  private database!: SQLiteObject
  public collection!: Collection;
  public enterprise!: Enterprise;
  public client!: Client;
  public newClient!: Client;
  public currencies!: Currencies[];
  public currencySelected!: Currencies;
  public currencyConversion!: Currencies;
  public conversionTypes: ConversionType[] = [];
  public documentSales: DocumentSale[] = [];
  public documentSalesBackup: DocumentSale[] = [];
  public igtfSelected!: IgtfList;
  public igtfList!: IgtfList[];
  public retention!: Retention;
  public listCollect: Collection[] = [];
  public listBankAccounts!: BankAccount[];
  public listBanks!: Bank[];
  public clientBankAccounts!: ClientBankAccount[];
  public enterpriseSelected!: Enterprise;
  public localCurrency!: Currencies;
  public hardCurrency!: Currencies;
  public currencyList!: Currencies[];
  public enterpriseList: Enterprise[] = [];
  public currencySelectedDocument!: Currencies;
  public documentSaleOpen!: DocumentSale;
  public pagoEfectivo: PagoEfectivo[] = [];
  public pagoCheque: PagoCheque[] = [];
  public pagoDeposito: PagoDeposito[] = [];
  public pagoTransferencia: PagoTransferencia[] = [];
  public pagoOtros: PagoOtros[] = [];
  public tiposPago: TiposPago[] = [];
  public bankAccountSelected!: BankAccount[];
  public paymentPartials: PaymentPartials[] = [];
  public itemListaCobros: ItemListaCobros[] = [];
  public coDocumentToUpdate: string[] = [];

  public anticipoAutomatico!: any;

  public collectionTags = new Map<string, string>([]);
  public collectionTagsDenario = new Map<string, string>([]);

  public tipoPagoEfectivo!: boolean;
  public tipoPagoCheque!: boolean;
  public tipoPagoDeposito!: boolean;
  public tipoPagoTransferencia!: boolean;
  public tipoPagoOtros!: boolean;
  public haveRate: boolean = false;
  public initCollect: boolean = true;
  public showHeaderButtons: Boolean = false;
  public disableSavedButton: boolean = true;
  public disableSenddButton: boolean = true;
  public saveOrExitOpen = false;
  public alertMessageOpen: boolean = false;
  public alertMessageChangeCurrency: boolean = false;
  public isLocalCurrency: boolean = false;
  public isHardCurrency: boolean = false;
  public multiCurrency!: boolean;
  public isOpen: boolean = false;
  public isPaymentPartial: boolean = false;
  public isChangePaymentPartial: boolean = false;
  public igtfDefault: boolean = false;
  public separateIgtf: boolean = false;
  public userMustActivateGPS: boolean = true; //si la pongo en false puedes entrar al clickear rapido
  public disabledCurrency: boolean = false;
  public enterpriseEnabled: boolean = false;
  public disabledClient: boolean = false;
  public createAutomatedPrepaid: boolean = false;
  public addRetention: boolean = false;
  public documentsSaleComponent: boolean = false;
  public cobroComponent: boolean = false;
  public cobrosComponent: boolean = true;
  public cobrosDocumentComponent: boolean = true;
  public cobroListComponent: boolean = false;
  public collectionIsSave: boolean = false;
  public collectValid: boolean = false;

  public requiredComment: boolean = false;
  public validComment: boolean = false;
  public isAnticipo: boolean = false;
  public isRetention: boolean = false;
  public changeClient: boolean = false;
  public onChangeClient: boolean = false;
  public changeEnterprise: boolean = false;
  public isOpenCollect: boolean = false;
  public recentOpenCollect: boolean = false;
  public hideDocuments: boolean = false;
  public hidePayments: boolean = false;
  public userCanSelectIGTF: boolean = false;
  public historicoTasa: boolean = false;
  public retentionDocTypeCR: boolean = false;
  public validNuRetention: boolean = false;
  public clientBankAccount: boolean = false;
  public retencion: boolean = false;
  public validateDaVoucher: boolean = true;
  public haveDocumentSale: boolean = false;
  public newCollect: boolean = false;
  public alertMessageChangeEnterprise: boolean = false;
  public cobroValid: boolean = false;
  public validateCollectionDate: boolean = false;
  public enableDate: boolean = true;
  public historicPartialPayment: boolean = false;
  public userCanCollectIva: boolean = true;
  public sendCollection: boolean = false;
  public openPaymentPartial: boolean = false;
  public showNuevaCuenta: boolean = false;
  public cobro25: boolean = false;
  public disabledInputClient: boolean = false;
  //public conversionDocument: boolean = false;
  public currencyBank: boolean = false;
  public currencyLocal: boolean = false;
  public currencyHard: boolean = false;
  public disableCheckIGTF: boolean = false;
  public tolerancia0: boolean = false;
  public MonedaToleranciaIsLocal: boolean = false;
  public MonedaToleranciaIsHard: boolean = false;
  public automatedPrepaid: boolean = false;
  public existPartialPayment: boolean = false;
  public disabledSelectCollectMethodDisabled: boolean = true;
  public collectValidTabs: boolean = true;
  public calculateDifference: boolean = false;

  public totalEfectivo: number = 0;
  public totalCheque: number = 0;
  public totalDeposito: number = 0;
  public totalTransferencia: number = 0;
  public totalOtros: number = 0;
  public coTypeModule!: string;
  public lengthMethodPaid: number = -1;
  public montoTotalPagar: number = 0;
  public montoTotalPagarConversion: number = 0;
  public montoTotalPagado: number = 0;
  public montoTotalPagadoConversion: number = 0;
  public montoIgtf: number = 0;
  public montoIgtfConversion: number = 0;
  public montoIgtfLocal: number = 0;
  public rateList: number[] = [];
  public rateSelected!: number;
  public parteDecimal: number = 0;
  public montoaPagar: number = 0;
  public indexDocumentSaleOpen: number = 0;
  public sizeRetention: number = 0;
  public amountPaymentPartial: number = 0;
  public amountPaid: number = 0;
  public amountPaidConversion: number = 0;
  public amountPaidDoc: number = 0;
  public amountPaidRetention: number = 0;
  public nuAmountTotal: number = 0;
  public nuBalance: number = 0;
  public RangoTolerancia: number = 0;
  public prepaidRangeAmount: number = 0;
  public RangoToleranciaPositiva: number = 0;
  public RangoToleranciaNegativa: number = 0;
  public TipoTolerancia: number = 0;
  public difDocsNegativosByRate: number = 0;
  public difDocsNegativosByOriginalRate: number = 0;
  public difference: number = 0;

  public documentCurrency!: string;
  public dateTasa!: string;
  public fechaMayor: string = this.dateServ.hoyISO();
  public fechaMenor!: string;
  public dateRate: string = "";
  public dateRateVisual: string = "";
  public formatRetention: string = "";
  public titleModule: string = "";
  public nuevaCuenta!: string;
  public nameClient: string = "";
  public mensaje: string = '';
  public coDocumentPaymentPartial: string = '';
  public MonedaTolerancia: string = "";
  public prepaidRangeCurrency: string = "";

  public backRoute = new Subject<string>;
  public saveCollect = new Subject<string>;
  public saveSend = new Subject<string>;
  public validCollection = new Subject<Boolean>;
  public showButtons = new Subject<Boolean>;
  public collectValidToSave = new Subject<Boolean>;
  public collectValidToSend = new Subject<Boolean>;

  public mapDocumentsSales = new Map<number, DocumentSale>([]);

  public regexOnlyText = new RegExp("[A-Za-z]", "i");
  public regexAlphaNumeric = new RegExp("[A-Za-z0-9]", "i");

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

  public alertButtonsSend = [
    {
      text: '',
      role: 'cancel'
    },
    {
      text: '',
      role: 'confirm'
    },
  ];

  initLogicService() {
    //this.coTypeModule = '0';
    //this.titleModule = this.collectionTags.get('COB_NOMBRE_MODULO')!;
    this.disabledClient = false;

    //SETEAMOS LAS VARIABLES PARA COBROS
    this.parteDecimal = Number(this.globalConfig.get('parteDecimal'));
    this.enterpriseEnabled = this.globalConfig.get('enterpriseEnabled') === 'true' ? true : false;
    this.sizeRetention = Number(this.globalConfig.get('sizeRetention'));
    this.retentionDocTypeCR = this.globalConfig.get('retentionDocTypeCR') === "true" ? true : false;
    this.clientBankAccount = this.globalConfig.get('clientBankAccount') === "true" ? true : false;
    this.userCanSelectIGTF = this.globalConfig.get('userCanSelectIGTF') === "true" ? true : false;
    this.retencion = this.globalConfig.get('retencion') === "true" ? true : false;
    this.historicoTasa = this.globalConfig.get('historicoTasa') === "true" ? true : false;
    this.validateCollectionDate = this.globalConfig.get('validateCollectionDate') === "true" ? true : false;
    this.historicPartialPayment = this.globalConfig.get('historicPartialPayment') === "true" ? true : false;
    this.userCanCollectIva = this.globalConfig.get('userCanCollectIva') === "true" ? true : false;
    //this.conversionDocument = this.globalConfig.get('conversionDocument') === "true" ? true : false;
    this.currencyBank = this.globalConfig.get('currencyBank') == "true" ? true : false;
    this.disableCheckIGTF = this.globalConfig.get('disableCheckIGTF') == "true" ? true : false;
    this.tolerancia0 = this.globalConfig.get('tolerancia0') == "true" ? true : false;
    this.TipoTolerancia = Number(this.globalConfig.get('TipoTolerancia'));
    this.RangoTolerancia = Number(this.globalConfig.get('RangoTolerancia'));
    this.MonedaTolerancia = this.globalConfig.get('MonedaTolerancia');
    this.multiCurrency = this.globalConfig.get('multiCurrency') === 'true' ? true : false;
    this.prepaidRangeCurrency = this.globalConfig.get('prepaidRangeCurrency');
    this.prepaidRangeAmount = Number(this.globalConfig.get('prepaidRangeAmount'));
    this.igtfDefault = this.globalConfig.get('igtfDefault') === 'true' ? true : false;
    this.automatedPrepaid = this.globalConfig.get('automatedPrepaid') === 'true' ? true : false;
    this.RangoToleranciaNegativa = Number(this.globalConfig.get('RangoToleranciaNegativa'));
    this.RangoToleranciaPositiva = Number(this.globalConfig.get('RangoToleranciaPositiva'));

    this.showNuevaCuenta = this.clientBankAccount === true ? true : false;

    this.changeClient = false;
    this.newCollect = true;
    this.cobroValid = false;
    this.disabledInputClient = false;
    this.alertMessageOpen = false;
    this.alertMessageChangeCurrency = false;


    if (this.globalConfig.get('formatRetention') === '0')
      this.formatRetention = "number";
    else if (this.globalConfig.get('formatRetention') === '1')
      this.formatRetention = "text";
    else if (this.globalConfig.get('formatRetention') === '2')
      this.formatRetention = "alpha";

    this.alertButtonsSend[0].text = this.collectionTagsDenario.get('DENARIO_BOTON_CANCELAR')!
    this.alertButtonsSend[1].text = this.collectionTagsDenario.get('DENARIO_BOTON_ACEPTAR')!
    this.alertButtons[0].text = this.collectionTagsDenario.get('DENARIO_BOTON_ACEPTAR')!


    return Promise.resolve(true);
  }

  showBackRoute(route: string) {
    console.log('Back-Service: ' + route);
    this.backRoute.next(route);
    // this.titleModule = this.collectionTags.get('COB_NOMBRE_MODULO')!;
  }

  loadPaymentMethods() {
    //CARGAMOS LOS TIPOS DE PAGO DEPENDIENDO DE LAS VARIABLES DE CONFIGURACION

    this.pagoEfectivo = [] as PagoEfectivo[];
    this.pagoCheque = [] as PagoCheque[];
    this.pagoDeposito = [] as PagoDeposito[];
    this.pagoTransferencia = [] as PagoTransferencia[];
    this.pagoOtros = [] as PagoOtros[];
    this.tiposPago = [] as TiposPago[];

    this.tipoPagoEfectivo = this.globalConfig.get('colletionPayment').split("-")[0] === 'true' ? true : false;
    this.tipoPagoCheque = this.globalConfig.get('colletionPayment').split("-")[1] === 'true' ? true : false;
    this.tipoPagoDeposito = this.globalConfig.get('colletionPayment').split("-")[2] === 'true' ? true : false;
    this.tipoPagoTransferencia = this.globalConfig.get('colletionPayment').split("-")[3] === 'true' ? true : false;
    this.tipoPagoOtros = this.globalConfig.get('colletionPayment').split("-")[4] === 'true' ? true : false;

    if (this.tipoPagoEfectivo) {
      this.tiposPago.push({
        type: "ef",
        name: "Efectivo",
        selected: false
      });
    }
    if (this.tipoPagoCheque) {
      this.tiposPago.push({
        type: "ch",
        name: "Cheque",
        selected: false
      });
    }
    if (this.tipoPagoDeposito) {
      this.tiposPago.push({
        type: "de",
        name: "Depósito",
        selected: false
      });
    }
    if (this.tipoPagoTransferencia) {
      this.tiposPago.push({
        type: "tr",
        name: "Transferencia",
        selected: false
      });
    }
    if (this.tipoPagoOtros) {
      this.tiposPago.push({
        type: "ot",
        name: "Otros",
        selected: false
      });
    }

    return Promise.resolve(true);
  }


  getTags(dbServ: SQLiteObject) {
    return this.services.getTags(dbServ, "COB", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.collectionTags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      return Promise.resolve(true);
    })
  }
  getTagsDenario(dbServ: SQLiteObject) {
    return this.services.getTags(dbServ, "DEN", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.collectionTagsDenario.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      return Promise.resolve(true);
    })
  }

  getCurrencies(dbServ: SQLiteObject, idEnterprise: number) {
    return this.getCurrenciesEnterprise(dbServ, idEnterprise).then((result) => {
      this.currencyList = result;

      for (var i = 0; i < this.currencyList.length; i++) {

        if (this.currencyList[i].localCurrency.toString() == "true") {
          this.localCurrency = this.currencyList[i];
        } else {
          this.hardCurrency = this.currencyList[i];
        }
      }

      for (var i = 0; i < this.currencyList.length; i++) {
        if (this.collection.stCollection == 1) {
          if (this.currencyList[i].coCurrency == this.collection.coCurrency) {
            this.currencySelected = this.currencyList[i];
            this.currencySelectedDocument = this.currencyList[i];

            this.collection.idCurrency = this.currencyList[i].idCurrency;
            this.collection.coCurrency = this.currencyList[i].coCurrency;
          }
        } else {
          if (this.collection.stCollection == 3) {
            if (this.currencyList[i].coCurrency == this.collection.coCurrency) {
              this.currencySelected = this.currencyList[i];
              this.currencySelectedDocument = this.currencyList[i];
              this.collection.idCurrency = this.currencyList[i].idCurrency;
              this.collection.coCurrency = this.currencyList[i].coCurrency;
              if (this.currencySelectedDocument.coCurrency == this.localCurrency.coCurrency) {
                this.isLocalCurrency = true;
                this.isHardCurrency = false;
              } else {
                this.isHardCurrency = true;
                this.isLocalCurrency = false;
              }
            }
          } else if (this.currencyList[i].coCurrency == this.enterpriseSelected.coCurrencyDefault) {
            this.currencySelected = this.currencyList[i];
            this.currencySelectedDocument = this.currencyList[i];
            this.collection.idCurrency = this.currencyList[i].idCurrency;
            this.collection.coCurrency = this.currencyList[i].coCurrency;
            if (this.currencySelectedDocument.coCurrency == this.localCurrency.coCurrency) {
              this.isLocalCurrency = true;
              this.isHardCurrency = false;
            } else {
              this.isHardCurrency = true;
              this.isLocalCurrency = false;
            }
          }

        }
      }

      if (this.currencySelected.localCurrency.toString() == 'true') {
        this.currencyLocal = true;
        this.currencyHard = false;
      }

      if (this.currencySelected.hardCurrency.toString() == 'true') {
        this.currencyHard = true;
        this.currencyLocal = false;
      }

      if (this.multiCurrency) {
        this.setCurrencyConversion();
      }


      /* {{this.globalConfig.get('multiCurrency') === 'true' ? false: true}} && {{collectService.isIGTF}} */
      if (this.coTypeModule == "3") {
        //4 es IGTF SOLO SE USA LA MONEDA LOCAL                
        //this.currencySelected = this.currencyServices.getLocalCurrency();
        //this.disabledCurrency = true
      } else
        this.disabledCurrency = this.globalConfig.get('multiCurrency') === 'true' ? false : true;


      if (this.currencyService.localCurrency.coCurrency == this.MonedaTolerancia)
        this.MonedaToleranciaIsLocal = true;

      if (this.multiCurrency)
        if (this.currencyService.hardCurrency.coCurrency == this.MonedaTolerancia)
          this.MonedaToleranciaIsHard = true;



      Promise.resolve(true);

    })
  }

  setCurrencyConversion() {
    if (this.currencySelected.localCurrency.toString() === 'true')
      this.currencyConversion = this.hardCurrency;
    else
      this.currencyConversion = this.localCurrency;
  }

  getTasasHistorico(dbServ: SQLiteObject, idEnterprise: number) {
    this.getTasasHistoricoFunction(dbServ, idEnterprise).then((result) => {
      this.conversionTypes = result;
      /*       this.dateMayor = new Date(result[0].date_conversion);
            this.dateMenor = new Date(result[result.length - 1].date_conversion); */
      //this.dateServ.hoyISOFullTime();
      let hora = this.dateServ.hoyISOFullTime();
      let dateMayor = new Date(result[0].dateConversion);
      let yearMayor = dateMayor.getFullYear();
      let diaMayor = dateMayor.getDate().toString();
      let monthMayor = dateMayor.getMonth().toString();
      let dateMenor = new Date(result[result.length - 1].dateConversion);
      let yearMenor = dateMenor.getFullYear();
      let diaMenor = dateMenor.getDate().toString();
      let monthMenor = dateMenor.getMonth().toString();

      monthMenor = (Number(monthMenor) + 1).toString();
      monthMayor = (Number(monthMayor) + 1).toString();
      if (Number(diaMayor) < 10)
        diaMayor = "0" + diaMayor;

      if (Number(diaMenor) < 10)
        diaMenor = "0" + diaMenor;

      if (Number(monthMayor) < 10)
        monthMayor = "0" + monthMayor;

      if (Number(monthMenor) < 10)
        monthMenor = "0" + monthMenor;

      this.fechaMenor = yearMenor + "-" + monthMenor + "-" + diaMenor + "T00:00:00";
      /* this.fechaMayor = yearMayor + "-" + monthMayor + "-" + diaMayor + " " + hora.split(" ")[1]; */
      this.dateRate = yearMayor + "-" + monthMayor + "-" + diaMayor + " " + hora.split(" ")[1];

      if (this.collection.stCollection == 1) {
        this.dateRateVisual = this.collection.daRate + "T00:00:00";
      } else
        this.dateRateVisual = yearMayor + "-" + monthMayor + "-" + diaMayor + "T00:00:00";
    })
  }

  getDateRate(dbServ: SQLiteObject, fecha: string) {

    this.dateRate = fecha;
    //LUEGO DE SELECCIONAR LA FECHA, HAY QUE BUSCAR LA TASA CORRESPONDE A LA FECHA
    this.rateList = [];

    //if (this.collection.stCollection == 0)
    this.collection.daRate = fecha.substring(0, 10);
    ;
    /* this.valueTasa = this.mapFechas.get(fecha.split("T")[0])!; */

    this.conversionTypes.find((ct) => {
      if (fecha.substring(0, 10) == ct.dateConversion.split("T")[0]) {
        this.rateList.push(ct.nuValueLocal);
      }
    })
    if (this.rateList.length > 0) {
      this.rateSelected = this.collection.nuValueLocal = this.rateList[0];
      this.haveRate = true;

      //si ya tengo la tasa correspondiente a la fecha, debo buscar los documentos
      this.getDocumentsSales(dbServ, this.collection.idClient, this.collection.coCurrency, this.collection.coCollection, this.collection.idEnterprise);

      if (this.globalConfig.get('historicoTasa') === 'true' ? true : false) {
        this.historicoTasa = true;
      } else {
        this.historicoTasa = false;
      }
      this.unlockTabs().then((resp) => {
        this.onCollectionValid(resp);
      })

    } else {
      //no tengo tasa para ese dia
      if (this.collection.stCollection === 3) {
        this.rateSelected = this.collection.nuValueLocal;
        this.historicoTasa = true;
      } else {
        this.historicoTasa = false;
        this.unlockTabs().then((resp) => {
          this.mensaje = "No hay tasa para la fecha seleccionada";
          this.alertMessageOpen = true;
          this.onCollectionValid(resp);
        })
      }

      this.getDocumentsSales(dbServ,
        this.collection.idClient, this.collection.coCurrency, this.collection.coCollection, this.collection.idEnterprise);

    }
  }

  async calculatePayment(type: string, index: number) {
    this.montoTotalPagar = 0;
    let monto = 0;
    let montoConversion = 0;
    let montoDesc = 0;

    if (this.collection.stCollection == 1) {
      for (var j = 0; j < this.collection.collectionDetails.length; j++) {
        monto += this.collection.collectionDetails[j].nuBalanceDoc;
      }
    } else {
      for (var j = 0; j < this.collection.collectionDetails.length; j++) {
        for (var i = 0; i < this.documentSales.length; i++) {
          //for (var j = 0; j < this.collection.collectionDetails.length; j++) {
          if (this.documentSales[i].isSave) {
            if (this.collection.collectionDetails[j].idDocument == this.documentSales[i].idDocument) {
              /*  monto += this.documentSalesBackup[i].nuAmountPaid;
               montoConversion += await this.convertAmount(this.documentSalesBackup[i].nuAmountPaid, 'local', 'hard', this.documentSales[i].coDocumentSaleType, this.documentSales[i].nuValueLocal); */

              if (this.currencySelected.localCurrency.toString() == "true") {
                if (this.documentSales[i].coCurrency == this.localCurrency.coCurrency) {
                  //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;
                  monto += this.documentSalesBackup[i].nuAmountPaid - montoDesc;
                  montoConversion += await this.convertAmount(
                    this.documentSalesBackup[i].nuAmountPaid - montoDesc,
                    'local', 'hard', this.documentSales[i].coDocumentSaleType, this.documentSales[i].nuValueLocal);
                } else {
                  //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;

                  monto += await this.convertAmount(
                    this.documentSalesBackup[i].nuAmountPaid - montoDesc, 'hard', 'local', this.documentSales[i].coDocumentSaleType, this.documentSales[i].nuValueLocal);
                  montoConversion += this.documentSalesBackup[i].nuAmountPaid;
                }
              } else {
                if (this.documentSales[i].coCurrency == this.hardCurrency.coCurrency) {
                  //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;

                  monto += this.documentSalesBackup[i].nuAmountPaid - montoDesc;
                  montoConversion += await this.convertAmount(this.documentSalesBackup[i].nuAmountPaid - montoDesc,
                    'hard', 'local', this.documentSales[i].coDocumentSaleType, this.documentSales[i].nuValueLocal);

                } else {
                  //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;

                  monto += await this.convertAmount(this.documentSalesBackup[i].nuAmountPaid - montoDesc,
                    'local', 'hard', this.documentSales[i].coDocumentSaleType, this.documentSales[i].nuValueLocal);
                  montoConversion += this.documentSalesBackup[i].nuAmountPaid - montoDesc;

                }
              }

            }

          } else if (this.collection.collectionDetails[j].idDocument == this.documentSales[i].idDocument) {
            if (this.collection.stCollection == 1 && this.collection.collectionDetails[j].isSave) {
              if (this.documentSales[i].isSelected) {
                //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;
                monto += this.documentSalesBackup[i].nuBalance - montoDesc;
              }
            } else if (this.documentSales[i].isSelected) {
              if (this.documentSales[i].nuAmountRetention + this.documentSales[i].nuAmountRetention2 > 0) {
                //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;

                monto += this.documentSalesBackup[i].nuBalance - montoDesc;
              } else if (this.documentSales[i].inPaymentPartial) {
                //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;
                monto += this.documentSalesBackup[i].nuBalance - montoDesc;
              } else if (this.currencySelected.localCurrency.toString() == "true") {
                if (this.documentSales[i].coCurrency == this.localCurrency.coCurrency) {
                  //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;
                  monto += this.documentSalesBackup[i].nuBalance - montoDesc;
                  montoConversion += await this.convertAmount(this.documentSalesBackup[i].nuBalance - montoDesc, 'local', 'hard', this.documentSales[i].coDocumentSaleType, this.documentSales[i].nuValueLocal);
                } else {
                  //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;
                  monto += await this.convertAmount(this.documentSalesBackup[i].nuBalance - montoDesc, 'hard', 'local', this.documentSales[i].coDocumentSaleType, this.documentSales[i].nuValueLocal);
                  montoConversion += this.documentSalesBackup[i].nuBalance - montoDesc;
                }
              } else {
                if (this.documentSales[i].coCurrency == this.hardCurrency.coCurrency) {
                  //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;
                  monto += this.documentSalesBackup[i].nuBalance - montoDesc;
                  montoConversion += await this.convertAmount(this.documentSalesBackup[i].nuBalance - montoDesc, 'hard', 'local', this.documentSales[i].coDocumentSaleType, this.documentSales[i].nuValueLocal);

                } else {
                  //montoDesc += this.documentSalesBackup[i].nuAmountDiscount + this.documentSalesBackup[i].nuAmountRetention + this.documentSalesBackup[i].nuAmountRetention2;
                  monto += await this.convertAmount(this.documentSalesBackup[i].nuBalance - montoDesc, 'local', 'hard', this.documentSales[i].coDocumentSaleType, this.documentSales[i].nuValueLocal);
                  montoConversion += this.documentSalesBackup[i].nuBalance - montoDesc;

                }
              }
            }
          }

        }
        if (this.userCanSelectIGTF) {
          if (this.igtfSelected.price > 0) {
            if (!this.separateIgtf) {
              this.collection.collectionDetails[j].nuAmountPaid += this.cleanFormattedNumber(this.currencyService.formatNumber((this.collection.collectionDetails[j].nuAmountPaid * this.igtfSelected.price) / 100));
            }
          }
        }
      }
    }

    if (this.userCanSelectIGTF) {
      this.montoIgtf = this.cleanFormattedNumber(this.currencyService.formatNumber(((monto * this.igtfSelected.price) / 100)));
      this.montoIgtfConversion = this.convertirMonto(this.montoIgtf, 0, this.collection.coCurrency);

      if (this.separateIgtf) {
        if (this.currencySelected.hardCurrency.toString() === "true")
          this.montoIgtfLocal = (this.montoIgtf * this.collection.nuValueLocal);

        this.montoTotalPagar = this.cleanFormattedNumber(this.currencyService.formatNumber(monto));
      }
      else
        this.montoTotalPagar = this.cleanFormattedNumber(this.currencyService.formatNumber(this.montoIgtf)) + this.cleanFormattedNumber(this.currencyService.formatNumber(monto));
    } else {
      this.montoTotalPagar = this.cleanFormattedNumber(this.currencyService.formatNumber(monto));
      this.montoIgtf = 0;
      this.montoIgtfConversion = 0;
    }

    this.collection.nuAmountPaid = this.montoTotalPagar;
    this.collection.nuAmountFinal = this.montoTotalPagar;
    this.collection.nuAmountFinalConversion = this.convertirMonto(this.collection.nuAmountFinal, 0, this.collection.coCurrency);
    this.collection.nuAmountTotal = this.montoTotalPagado;
    this.collection.nuAmountIgtf = this.montoIgtf;
    this.collection.nuAmountIgtfConversion = this.convertirMonto(this.montoIgtf, 0, this.collection.coCurrency);

    if (this.separateIgtf) {
      this.montoTotalPagarConversion = this.cleanFormattedNumber(this.currencyService.formatNumber(montoConversion));
      this.collection.nuDifference = this.cleanFormattedNumber(this.currencyService.formatNumber(this.montoTotalPagado)) - this.cleanFormattedNumber(this.currencyService.formatNumber(monto));
    } else {
      this.collection.nuDifference = this.cleanFormattedNumber(this.currencyService.formatNumber(this.montoTotalPagado)) - this.cleanFormattedNumber(this.currencyService.formatNumber(monto + this.montoIgtf));
      this.montoTotalPagarConversion = this.cleanFormattedNumber(this.currencyService.formatNumber(montoConversion + this.montoIgtfConversion));

    }


    //if (this.multiCurrency) {

    this.collection.nuDifferenceConversion = this.convertirMonto(this.collection.nuDifference, 0, this.collection.coCurrency);
    this.collection.nuAmountTotalConversion = this.convertirMonto(this.collection.nuAmountTotal, 0, this.collection.coCurrency);
    //SI ESTA VARIABLE ESDTAS EN TRUE, DEBO CREAR UN ANTICIPO
    if (this.automatedPrepaid && this.coTypeModule == "0") {
      let isEqualCurrency = true;
      //en que moneda sacar la cuenta del exceso
      if (this.prepaidRangeCurrency === this.collection.coCurrency) {
        isEqualCurrency = true;
      } else {
        isEqualCurrency = false;
      }

      if (!this.existPartialPayment) {
        //con esta variable prepaidRangeAmount debo calcular el rango de exceso del monto pagado para crear el anticipo
        if (isEqualCurrency) {
          if (Number(this.prepaidRangeAmount < this.collection.nuDifference)) {
            console.log("SE DEBE MANDAR MENSAJE DE ALERTA SI QUIERE MANDAR O NO EL ANTICIPO AUTOMATICO")
            this.createAutomatedPrepaid = true;
          } else {
            this.createAutomatedPrepaid = false;
          }
        } else {
          if (Number(this.prepaidRangeAmount < this.collection.nuDifferenceConversion)) {
            console.log("SE DEBE MANDAR MENSAJE DE ALERTA SI QUIERE MANDAR O NO EL ANTICIPO AUTOMATICO")
            this.createAutomatedPrepaid = true;
          } else {
            this.createAutomatedPrepaid = false;
          }
        }
      } else {
        this.createAutomatedPrepaid = false;
      }


      if (this.createAutomatedPrepaid)
        this.setAutomatedPrepaid(type, index);
      else
        this.checkTiposPago()

      //this.disabledSelectCollectMethodDisabled  = this.createAutomatedPrepaid;


      this.validateToSend();
      return Promise.resolve(this.createAutomatedPrepaid);
    } else {
      this.validateToSend();
      return Promise.resolve(this.createAutomatedPrepaid);
    }
  }

  checkTiposPago() {

    if (this.tipoPagoEfectivo && this.pagoEfectivo.length > 0) {
      for (let ef in this.pagoEfectivo) {
        if (this.pagoEfectivo[ef].anticipoPrepaid) {
          this.pagoEfectivo[ef].anticipoPrepaid = false;
          break;
        }
      }
    }

    if (this.tipoPagoCheque && this.pagoCheque.length > 0) {
      for (let ef in this.pagoCheque) {
        if (this.pagoCheque[ef].anticipoPrepaid) {
          this.pagoCheque[ef].anticipoPrepaid = false;
          break;
        }
      }
    }

    if (this.tipoPagoDeposito && this.pagoDeposito.length > 0) {
      for (let ef in this.pagoDeposito) {
        if (this.pagoDeposito[ef].anticipoPrepaid) {
          this.pagoDeposito[ef].anticipoPrepaid = false;
          break;
        }
      }
    }

    if (this.tipoPagoTransferencia && this.pagoTransferencia.length > 0) {
      for (let ef in this.pagoTransferencia) {
        if (this.pagoTransferencia[ef].anticipoPrepaid) {
          this.pagoTransferencia[ef].anticipoPrepaid = false;
          break;
        }
      }
    }

    if (this.tipoPagoOtros && this.pagoOtros.length > 0) {
      for (let ef in this.pagoOtros) {
        if (this.pagoOtros[ef].anticipoPrepaid) {
          this.pagoOtros[ef].anticipoPrepaid = false;
          break;
        }
      }
    }
  }

  setAutomatedPrepaid(type: string, index: number) {
    if (this.pagoOtros.length === 0 && this.pagoCheque.length === 0 && this.pagoDeposito.length === 0 && this.pagoTransferencia.length === 0 && this.pagoEfectivo.length === 0)
      this.disabledSelectCollectMethodDisabled = false;
    else
      this.disabledSelectCollectMethodDisabled = true;

    switch (type) {
      case "ef": {
        this.anticipoAutomatico = [] as PagoEfectivo[];
        this.anticipoAutomatico.push(this.pagoEfectivo[index]);
        this.pagoEfectivo[index].anticipoPrepaid = true;
        break
      }
      case "ch": {

        this.anticipoAutomatico = [] as PagoCheque[];
        this.anticipoAutomatico.push(this.pagoCheque[index]);
        this.pagoCheque[index].anticipoPrepaid = true;
        break
      }

      case "de": {
        this.anticipoAutomatico = [] as PagoDeposito[];
        this.anticipoAutomatico.push(this.pagoDeposito[index]);
        this.pagoDeposito[index].anticipoPrepaid = true;
        break;
      }

      case "tr": {
        this.anticipoAutomatico = [] as PagoTransferencia[];
        this.anticipoAutomatico.push(this.pagoTransferencia[index]);
        this.pagoTransferencia[index].anticipoPrepaid = true;
        break;
      }

      case "ot": {
        this.anticipoAutomatico = [] as PagoOtros[];
        this.anticipoAutomatico.push(this.pagoOtros[index]);
        this.pagoOtros[index].anticipoPrepaid = true;
        break;
      }
      default: {
        break;
      }
    }
  }

  getNuValueLocal() {
    return this.collection.nuValueLocal;
  }

  convertirMonto(monto: number, rate: number, currency: string) {

    if (this.multiCurrency) {
      //let rateReal = this.getNuValueLocal(rate);
      let rateReal = rate;
      if (rate == 0)
        rateReal = this.collection.nuValueLocal;

      if (monto > 0)
        rateReal = this.collection.nuValueLocal;
      /* if (this.currencySelected.coCurrency != currency) { */
      if (this.currencySelected.localCurrency.toString() === "true") {
        if (currency == this.currencyConversion.coCurrency) {
          if (this.historicoTasa)
            return this.cleanFormattedNumber(this.currencyService.formatNumber(monto * rateReal));
          else
            return this.cleanFormattedNumber(this.currencyService.formatNumber(monto * rateReal));
        } else if (this.historicoTasa)
          return this.cleanFormattedNumber(this.currencyService.formatNumber(monto / rateReal));
        else
          return this.cleanFormattedNumber(this.currencyService.formatNumber(monto / rateReal));
      } else {
        if (currency == this.currencyConversion.coCurrency) {
          if (this.historicoTasa)
            return this.cleanFormattedNumber(this.currencyService.formatNumber(monto / rateReal));
          else
            return this.cleanFormattedNumber(this.currencyService.formatNumber(monto / rateReal));
        } else if (this.historicoTasa)
          return this.cleanFormattedNumber(this.currencyService.formatNumber(monto * rateReal));
        else
          return this.cleanFormattedNumber(this.currencyService.formatNumber(monto * rateReal));
      }
    } else {
      return 0
    }

  }

  calcularMontos(type: string, index: number) {
    this.montoTotalPagado = 0;
    if (this.tipoPagoEfectivo) {
      this.totalEfectivo = 0;
      for (let efe = 0; efe < this.pagoEfectivo.length; efe++) {
        this.totalEfectivo += this.pagoEfectivo[efe].monto;
        this.montoTotalPagado += this.pagoEfectivo[efe].monto;
      }
    }
    if (this.tipoPagoCheque) {
      this.totalCheque = 0;
      for (let ch = 0; ch < this.pagoCheque.length; ch++) {
        this.totalCheque += this.pagoCheque[ch].monto;
        this.montoTotalPagado += this.pagoCheque[ch].monto;
      }
    }
    if (this.tipoPagoDeposito) {
      this.totalDeposito = 0;
      for (let dep = 0; dep < this.pagoDeposito.length; dep++) {
        this.totalDeposito += this.pagoDeposito[dep].monto;
        this.montoTotalPagado += this.pagoDeposito[dep].monto;
      }
    }
    if (this.tipoPagoTransferencia) {
      this.totalTransferencia = 0;
      for (let tr = 0; tr < this.pagoTransferencia.length; tr++) {
        this.totalTransferencia += this.pagoTransferencia[tr].monto;
        this.montoTotalPagado += this.pagoTransferencia[tr].monto;
      }
    }
    if (this.tipoPagoOtros) {
      this.totalOtros = 0;
      for (let otros = 0; otros < this.pagoOtros.length; otros++) {
        this.totalOtros += this.pagoOtros[otros].monto;
        this.montoTotalPagado += this.pagoOtros[otros].monto;
      }
    }

    this.montoTotalPagado = this.cleanFormattedNumber(this.currencyService.formatNumber(this.montoTotalPagado));

    this.calculatePayment(type, index).then(response => {

      if (this.coTypeModule == "0") {
        if (this.createAutomatedPrepaid) {
          if (!this.recentOpenCollect) {
            this.mensaje = this.collectionTags.get('COB_MSG_AUTOMATED_PREPAID')! + " " + this.currencyService.formatNumber(this.collection.nuDifference);
            this.alertMessageOpen = true;
          }


          this.onCollectionValidToSend(true);
        } else if (this.disabledSelectCollectMethodDisabled && this.collection.collectionDetails.length > 0) {
          this.disabledSelectCollectMethodDisabled = false;
        }
        if (this.recentOpenCollect)
          this.recentOpenCollect = false;
      }
    });

    return Promise.resolve(true);
  }

  validateToSend() {
    this.montoTotalPagar = this.cleanFormattedNumber(this.currencyService.formatNumber(this.montoTotalPagar));
    this.montoTotalPagado = this.cleanFormattedNumber(this.currencyService.formatNumber(this.montoTotalPagado));

    this.alertMessageOpen = false;
    if (this.collection.coType == '1') {
      //SI ERES ANTICIPO
      if (this.collection.collectionPayments.length > 0)
        this.onCollectionValidToSend(true);
    } else if (this.collection.coType == '2') {
      //SI ERES RETENCION Y ESTAS ACA, LA RETENCION ES VALIDA
      if (this.collection.collectionDetails.length > 0) {
        //DEBO VALIDAR SI LOS DETAILS TIENEN MONTO DE RETENCION O IVA

        let sum = 0;
        for (var i = 0; i < this.collection.collectionDetails.length; i++) {
          sum = this.collection.collectionDetails[i].nuAmountRetention + this.collection.collectionDetails[i].nuAmountRetention2;
        }
        if (sum > 0)
          this.onCollectionValidToSend(true);
        else
          this.onCollectionValidToSend(false);
      }

    } else {
      //DEBO VALIDAR SI HAY ALGUN PAGO PARCIAL, EL MONTO DEBE PAGADO DEBE SER IGUAL AL MONTO A PAGAR
      for (var i = 0; i < this.collection.collectionDetails.length; i++) {
        if (this.collection.collectionDetails[i].inPaymentPartial.toString() == "true") {
          this.existPartialPayment = true
          break;
        } else {
          this.existPartialPayment = false;
        }

      }

      if (this.existPartialPayment) {
        if (this.montoTotalPagado == this.montoTotalPagar) {
          this.onCollectionValidToSend(true);
        } else {
          this.onCollectionValidToSend(false);
        }
      } else {
        if (isNaN(this.montoTotalPagado))
          this.montoTotalPagado = 0;
        if (isNaN(this.montoTotalPagar))
          this.montoTotalPagado = 0;

        if (this.collection.collectionPayments.length == 0) {
          this.onCollectionValidToSend(false);
        } else {
          if (this.tolerancia0) {
            //TOLERANCIA0 TRUE PERMITO DIFERENCIA SE DEBEN VALIDAR LAS SIGUIENTES VARIABLES TipoTolerancia, RangoTolerancia, MonedaTolerancia
            if (this.TipoTolerancia == 0) {
              if (this.collection.coCurrency == this.MonedaTolerancia) {
                //COMO LA MONEDA DEL COBRO Y LA MONEDA DE LA TOLERANCIA SON IGUALES, ENTONCES COMPARO DIRECTAMENTE 
                let amount = this.montoTotalPagado - this.montoTotalPagar;
                if (amount > 0) {
                  if (amount < this.RangoToleranciaPositiva)
                    this.onCollectionValidToSend(true);
                  else
                    this.onCollectionValidToSend(false);
                } else if (amount < 0) {
                  if (Math.abs(amount) < this.RangoToleranciaNegativa)
                    this.onCollectionValidToSend(true);
                  else
                    this.onCollectionValidToSend(false);
                } else {
                  this.onCollectionValidToSend(true);
                }


              } else {
                //LA MONEDA DEL COBRO Y DE LA TOLERANCIA SON DISTINTAS, DEBO SABER QUE MONEDA ES PARA REALIZAR LA CONVERSION
                //CORRESPONDIENTE PARA CALCULAR BIEN LA DIFERENCIA
                if (this.MonedaToleranciaIsLocal) {
                  if (this.collection.coCurrency == this.MonedaTolerancia) {
                    //LA MONEDA ES LOCAL, NO DEBO CONVERTIR
                    let amount = this.montoTotalPagado - this.montoTotalPagar;
                    if (amount > 0) {
                      if (amount < this.RangoToleranciaPositiva)
                        this.onCollectionValidToSend(true);
                      else
                        this.onCollectionValidToSend(false);
                    } else if (amount < 0) {
                      if (Math.abs(amount) < this.RangoToleranciaNegativa)
                        this.onCollectionValidToSend(true);
                      else
                        this.onCollectionValidToSend(false);
                    } else {
                      this.onCollectionValidToSend(true);
                    }
                  } else {
                    //LA MONEDA TOLERANCIA ES LOCA, PERO LA MONEDA DEL COBRO ES LA HARD, DEBO CONVERTIR LA TOLERANCIA A HARD
                    let amount = this.montoTotalPagado - this.montoTotalPagar;
                    if (amount > 0) {
                      if (amount < this.currencyService.toHardCurrency(this.RangoToleranciaPositiva))
                        this.onCollectionValidToSend(true);
                      else
                        this.onCollectionValidToSend(false);
                    } else if (amount < 0) {
                      if (Math.abs(amount) < this.currencyService.toHardCurrency(this.RangoToleranciaPositiva))
                        this.onCollectionValidToSend(true);
                      else
                        this.onCollectionValidToSend(false);
                    } else {
                      this.onCollectionValidToSend(true);
                    }
                  }
                } else {
                  //LA MONEDA TOLERANCIA ES HARD
                  if (this.collection.coCurrency == this.MonedaTolerancia) {
                    //LA MONEDA ES LOCAL, NO DEBO CONVERTIR
                    let amount = this.montoTotalPagado - this.montoTotalPagar;
                    if (amount > 0) {
                      if (amount < this.RangoToleranciaPositiva)
                        this.onCollectionValidToSend(true);
                      else
                        this.onCollectionValidToSend(false);
                    } else if (amount < 0) {
                      if (Math.abs(amount) < this.RangoToleranciaNegativa)
                        this.onCollectionValidToSend(true);
                      else
                        this.onCollectionValidToSend(false);
                    } else {
                      this.onCollectionValidToSend(true);
                    }
                  } else {
                    //LA MONEDA TOLERANCIA ES HARD, PERO LA MONEDA DEL COBRO ES LA HARD, DEBO CONVERTIR LA TOLERANCIA A LOCAL
                    let amount = this.montoTotalPagado - this.montoTotalPagar;
                    if (amount > 0) {
                      if (amount < this.currencyService.toLocalCurrency(this.RangoToleranciaPositiva))
                        this.onCollectionValidToSend(true);
                      else
                        this.onCollectionValidToSend(false);
                    } else if (amount < 0) {
                      if (Math.abs(amount) < this.currencyService.toLocalCurrency(this.RangoToleranciaNegativa))
                        this.onCollectionValidToSend(true);
                      else
                        this.onCollectionValidToSend(false);
                    } else {
                      this.onCollectionValidToSend(true);
                    }
                  }
                }
              }
            } else {
              //EL TIPO DE TOLERANCIA ES POR RANGO, SE DEBE SACAR PORCENTAJE Y CALCULAR SI SE PUEDE ENVIAR O NO
              let dif = Math.abs(this.montoTotalPagado) - Math.abs(this.montoTotalPagar);
              let porcentaje = (Math.abs(this.montoTotalPagar * this.RangoTolerancia)) / 100;
              if (dif <= porcentaje) {
                this.onCollectionValidToSend(true);
              } else {
                this.onCollectionValidToSend(false);
              }
            }
          } else {
            if (Math.abs(this.montoTotalPagado) == Math.abs(this.montoTotalPagar)) {
              this.onCollectionValidToSend(true);
            } else {
              this.onCollectionValidToSend(false);
            }
          }
        }
      }
      this.validateReferencePayment();
    }
  }

  validateReferencePayment() {
    const existePagoSinReferencia = this.collection.collectionPayments.some(
      pago =>
        pago.coType !== 'ef' && // Solo valida si NO es efectivo
        (!pago.nuPaymentDoc || pago.nuPaymentDoc.toString().trim() === '')
    );

    if (existePagoSinReferencia) {
      // Hay al menos un pago (no efectivo) sin número de referencia
      this.onCollectionValidToSend(false);
    } else {
      // Todos los pagos tienen número de referencia o son efectivo
      if (this.collection.collectionPayments.length <= 0)
        this.onCollectionValidToSend(false);
      // else no hacer nada para evitar recursión infinita
    }
  }

  cleanString(str: string): string {
    // Elimina espacios al principio y al final
    str = str.trim();
    // Elimina ;
    str = str.replace(/;/g, '');
    // Elimina comillas simples
    str = str.replace(/'/g, '');
    // Elimina comillas dobles
    str = str.replace(/"/g, '');


    return str;
  }

  public cleanFormattedNumber(str: string): number {
    // Elimina espacios
    str = str.trim();
    // Elimina separador de miles (puntos)
    str = str.replace(/\./g, '');
    // Cambia la coma decimal por punto
    str = str.replace(/,/g, '.');
    // Convierte a número
    return Number(str);
  }

  ///////////////////QUERYS////////////////

  getAllBanks(dbServ: SQLiteObject, idEnterprise: number) {
    this.listBanks = [] as Bank[];


    var selectStatement = 'SELECT * FROM banks WHERE id_enterprise = ?';
    dbServ.executeSql(selectStatement, [idEnterprise]).then(data => {
      if (this.clientBankAccount) {
        this.listBanks.push({
          idBank: 0,
          coBank: "Nueva Cuenta",
          naBank: "Nueva Cuenta",
          coEnterprise: this.collection.coEnterprise,
          idEnterprise: this.collection.idEnterprise
        });
      }
      for (let i = 0; i < data.rows.length; i++) {
        const item = data.rows.item(i);
        this.listBanks.push({
          idBank: item.id_bank,
          coBank: item.co_bank,
          naBank: item.na_bank,
          coEnterprise: item.co_enterprise,
          idEnterprise: item.id_enterprise,
        });
      }
    })
  }

  getDocumentsSales(dbServ: SQLiteObject, idClient: number, coCurrency: string, coCollection: string, idEnterprise: number) {

    /* this.documentSales = [] as DocumentSale[];
    this.documentSalesBackup = [] as DocumentSale[]; */


    let selectStatement = ""
    if (this.coTypeModule != "3") {
      selectStatement = 'SELECT ' +
        'd.* FROM document_sales d ' +
        'LEFT JOIN document_st ds ' +
        'ON d.co_document = ds.co_document ' +
        'WHERE d.id_client = ? AND ds.st_document < 2 AND d.co_currency = ? AND d.id_enterprise = ? ' +
        'AND d.co_document_sale_type != "IGTF" ' +
        'OR d.co_document in (SELECT co_document ' +
        'FROM collection_details WHERE co_collection= ?);'

      dbServ.executeSql(selectStatement,
        //[idClient, coCurrency, coCollection, idEnterprise]).then(data => {
        [idClient, coCurrency, idEnterprise, coCollection]).then(data => {


          if (data.rows.length > 0) {
            // Convierte data.rows a un array estándar
            const rows = Array.from({ length: data.rows.length }, (_, i) => data.rows.item(i));
            // Busca el primer elemento que cumpla la condición
            const found = rows.find(row => row.co_currency === coCurrency);

            if (found) {
              this.documentsSaleComponent = true;
              console.log('Moneda coincide:', found);
            } else {
              this.documentsSaleComponent = false;
            }

          }
          for (let i = 0; i < data.rows.length; i++) {
            if (this.mapDocumentsSales.get(data.rows.item(i).id_document) == undefined) {

              let documentSales = {} as DocumentSale;
              let documentSalesBackup = {} as DocumentSale;
              documentSales.idDocument = data.rows.item(i).id_document;
              documentSales.idClient = data.rows.item(i).id_client;
              documentSales.coClient = data.rows.item(i).co_client;
              documentSales.idDocumentSaleType = data.rows.item(i).id_document_sale_type;
              documentSales.coDocumentSaleType = data.rows.item(i).co_document_sale_type;
              documentSales.daDocument = data.rows.item(i).da_document;
              documentSales.daDueDate = data.rows.item(i).da_due_date;

              if (data.rows.item(i).na_amount_base === null || data.rows.item(i).na_amount_base === undefined) {
                documentSales.nuAmountBase = 0;
              } else {
                documentSales.nuAmountBase = data.rows.item(i).na_amount_base;
              }

              if (data.rows.item(i).nu_amount_discount === null || data.rows.item(i).nu_amount_discount === undefined) {
                documentSales.nuAmountDiscount = 0;
              } else {
                documentSales.nuAmountDiscount = data.rows.item(i).nu_amount_discount;
              }

              if (data.rows.item(i).nu_amount_tax === null || data.rows.item(i).nu_amount_tax === undefined) {
                documentSales.nuAmountTax = 0;
              } else {
                documentSales.nuAmountTax = data.rows.item(i).nu_amount_tax;
              }

              documentSales.nuAmountTotal = data.rows.item(i).nu_amount_total;
              documentSales.nuAmountPaid = data.rows.item(i).nu_balance;
              documentSales.nuBalance = data.rows.item(i).nu_balance;
              documentSales.coCurrency = data.rows.item(i).co_currency;
              documentSales.idCurrency = data.rows.item(i).id_currency;
              documentSales.nuDocument = data.rows.item(i).nu_document;
              documentSales.txComment = data.rows.item(i).tx_comment;
              documentSales.coDocument = data.rows.item(i).co_document;
              documentSales.coCollection = data.rows.item(i).co_collection;
              documentSales.nuValueLocal = data.rows.item(i).nu_value_local;
              documentSales.stDocumentSale = data.rows.item(i).st_document_sale;
              documentSales.coEnterprise = data.rows.item(i).co_enterprise;
              documentSales.idEnterprise = data.rows.item(i).id_enterprise;
              documentSales.naType = data.rows.item(i).naType;
              documentSales.isSelected = false;
              documentSales.positionCollecDetails = data.rows.item(i).positionCollecDetails;
              documentSales.nuAmountRetention = data.rows.item(i).nuAmountRetention == undefined ? 0 : data.rows.item(i).nuAmountRetention;
              documentSales.nuAmountRetention2 = data.rows.item(i).nuAmountRetention2 == undefined ? 0 : data.rows.item(i).nuAmountRetention2;
              documentSales.daVoucher = data.rows.item(i).daVoucher == undefined ? "" : data.rows.item(i).daVoucher;
              documentSales.nuVaucherRetention = data.rows.item(i).nuVaucherRetention == undefined ? 0 : data.rows.item(i).nuVaucherRetention;
              documentSales.igtfAmount = data.rows.item(i).igtfAmount == undefined ? 0 : data.rows.item(i).igtfAmount;
              documentSales.txConversion = data.rows.item(i).txConversion == undefined ? "" : data.rows.item(i).txConversion;
              documentSales.inPaymentPartial = false;
              documentSales.isSave = false;


              //documentSalesBackup = { ...documentSales };
              documentSalesBackup = Object.assign({}, documentSales);

              this.documentSales.push(documentSales);
              this.documentSalesBackup.push(documentSalesBackup);

              this.mapDocumentsSales.set(
                data.rows.item(i).id_document, documentSales
              )

              if (!this.isOpenCollect) {
                for (var cd = 0; cd < this.collection.collectionDetails.length; cd++) {
                  if (data.rows.item(i).id_document == this.collection.collectionDetails[cd].idDocument) {
                    this.disabledSelectCollectMethodDisabled = false;
                    this.documentSales[i].isSelected = true;

                    this.documentSalesBackup[i].isSelected = true;
                    this.documentSalesBackup[i].daVoucher = this.collection.collectionDetails[cd].daVoucher!;
                    this.documentSalesBackup[i].nuAmountDiscount = this.collection.collectionDetails[cd].nuAmountDiscount;
                    this.documentSalesBackup[i].nuBalance = this.collection.collectionDetails[cd].nuBalanceDoc;
                    this.documentSalesBackup[i].nuAmountPaid = this.collection.collectionDetails[cd].nuAmountPaid;
                    this.documentSalesBackup[i].nuAmountRetention = this.collection.collectionDetails[cd].nuAmountRetention;
                    this.documentSalesBackup[i].nuAmountRetention2 = this.collection.collectionDetails[cd].nuAmountRetention2;
                    this.documentSalesBackup[i].nuValueLocal = this.collection.collectionDetails[cd].nuValueLocal;
                    this.documentSalesBackup[i].nuVaucherRetention = this.collection.collectionDetails[cd].nuVoucherRetention;

                    this.documentSales[i].positionCollecDetails = cd;
                    this.documentSalesBackup[i].positionCollecDetails = cd;
                  }


                }
              } else {
                documentSales.isSelected = false;
                documentSalesBackup.isSelected = false;
              }

            }
          }

          if (this.historicPartialPayment) {
            this.findIsPaymentPartial(dbServ);
          }
        })
    } else if (this.coTypeModule == "3") {
      selectStatement = "SELECT DISTINCT  d.* FROM document_sales d " +
        "LEFT JOIN document_st ds " +
        "ON d.co_document = ds.co_document " +
        "WHERE d.id_client = ? AND ds.st_document < 2 AND d.co_currency = ?  AND d.id_enterprise = ? " +
        "AND d.co_document_sale_type = 'IGTF' "

      dbServ.executeSql(selectStatement,
        [idClient, coCurrency, idEnterprise]).then(data => {
          //[idClient, coCurrency, idEnterprise]).then(data => {

          if (data.rows.length > 0) {
            this.documentsSaleComponent = true;
          }

          for (let i = 0; i < data.rows.length; i++) {
            if (this.mapDocumentsSales.get(data.rows.item(i).id_document) == undefined) {
              let documentSales = {} as DocumentSale;
              let documentSalesBackup = {} as DocumentSale;

              documentSales.idDocument = data.rows.item(i).id_document;
              documentSales.idClient = data.rows.item(i).id_client;
              documentSales.coClient = data.rows.item(i).co_client;
              documentSales.idDocumentSaleType = data.rows.item(i).id_document_sale_type;
              documentSales.coDocumentSaleType = data.rows.item(i).co_document_sale_type;
              documentSales.daDocument = data.rows.item(i).da_document;
              documentSales.daDueDate = data.rows.item(i).da_due_date;
              if (data.rows.item(i).na_amount_base === null || data.rows.item(i).na_amount_base === undefined) {
                documentSales.nuAmountBase = 0;
              } else {
                documentSales.nuAmountBase = data.rows.item(i).na_amount_base;
              }

              if (data.rows.item(i).nu_amount_discount === null || data.rows.item(i).nu_amount_discount === undefined) {
                documentSales.nuAmountDiscount = 0;
              } else {
                documentSales.nuAmountDiscount = data.rows.item(i).nu_amount_discount;
              }

              if (data.rows.item(i).nu_amount_tax === null || data.rows.item(i).nu_amount_tax === undefined) {
                documentSales.nuAmountTax = 0;
              } else {
                documentSales.nuAmountTax = data.rows.item(i).nu_amount_tax;
              }
              documentSales.nuAmountTotal = data.rows.item(i).nu_amount_total;
              documentSales.nuAmountPaid = data.rows.item(i).nu_amount_paid;
              documentSales.nuBalance = data.rows.item(i).nu_balance;
              documentSales.coCurrency = data.rows.item(i).co_currency;
              documentSales.idCurrency = data.rows.item(i).id_currency;
              documentSales.nuDocument = data.rows.item(i).nu_document;
              documentSales.txComment = data.rows.item(i).tx_comment;
              documentSales.coDocument = data.rows.item(i).co_document;
              documentSales.coCollection = data.rows.item(i).co_collection;
              documentSales.nuValueLocal = data.rows.item(i).nu_value_local;
              documentSales.stDocumentSale = data.rows.item(i).st_document_sale;
              documentSales.coEnterprise = data.rows.item(i).co_enterprise;
              documentSales.idEnterprise = data.rows.item(i).id_enterprise;
              documentSales.naType = data.rows.item(i).naTypev;
              documentSales.inPaymentPartial = false;
              documentSales.isSelected = false;
              documentSales.isSave = false;

              if (!this.isOpenCollect) {
                for (var cd = 0; cd < this.collection.collectionDetails.length; cd++) {
                  if (data.rows.item(i).id_document == this.collection.collectionDetails[cd].idDocument) {
                    documentSales.isSelected = true;
                  }
                }
              } else {
                documentSales.isSelected = false;
              }



              documentSales.positionCollecDetails = data.rows.item(i).positionCollecDetails;
              documentSales.nuAmountRetention = data.rows.item(i).nuAmountRetention == undefined ? 0 : data.rows.item(i).nuAmountRetention;
              documentSales.nuAmountRetention2 = data.rows.item(i).nuAmountRetention2 == undefined ? 0 : data.rows.item(i).nuAmountRetention2;
              documentSales.daVoucher = data.rows.item(i).daVoucher == undefined ? "" : data.rows.item(i).daVoucher;
              documentSales.nuVaucherRetention = data.rows.item(i).nuVaucherRetention == undefined ? 0 : data.rows.item(i).nuVaucherRetention;
              documentSales.igtfAmount = data.rows.item(i).igtfAmount == undefined ? 0 : data.rows.item(i).igtfAmount;
              documentSales.txConversion = data.rows.item(i).txConversion == undefined ? "" : data.rows.item(i).txConversion;


              this.documentSales.push(documentSales);
              //documentSalesBackup = { ...documentSales };
              documentSalesBackup = Object.assign({}, documentSales);

              this.documentSalesBackup.push(documentSalesBackup);

              this.mapDocumentsSales.set(
                data.rows.item(i).id_document, documentSales
              )




            }
          }

          if (this.historicPartialPayment) {
            this.findIsPaymentPartial(dbServ);
          }
        })
    }
  }

  findIsPaymentPartial(dbServ: SQLiteObject) {
    const coDocuments = Array.from(this.mapDocumentsSales.values()).map(obj => obj.coDocument);
    if (coDocuments.length === 0) return Promise.resolve();

    const selectStatement = `
    SELECT code.id_document, code.in_payment_partial 
    FROM collection_details code 
    JOIN collection_payments copa ON code.co_collection = copa.co_collection 
    WHERE co_document IN ('${coDocuments.join("', '")}')
  `;

    return dbServ.executeSql(selectStatement, []).then(data => {
      // Crea un Map para acceso rápido por id_document
      const docSalesMap = new Map<number, DocumentSale>();
      this.documentSales.forEach(ds => docSalesMap.set(ds.idDocument, ds));
      const docSalesBackupMap = new Map<number, DocumentSale>();
      this.documentSalesBackup.forEach(ds => docSalesBackupMap.set(ds.idDocument, ds));

      for (let i = 0; i < data.rows.length; i++) {
        const idDoc = data.rows.item(i).id_document;
        const isPartial = data.rows.item(i).in_payment_partial === 'true';

        // Actualiza documentSales
        if (docSalesMap.has(idDoc)) {
          docSalesMap.get(idDoc)!.inPaymentPartial = isPartial;
        }
        // Actualiza documentSalesBackup
        if (docSalesBackupMap.has(idDoc)) {
          docSalesBackupMap.get(idDoc)!.inPaymentPartial = isPartial;
        }
        // Actualiza mapDocumentsSales
        if (this.mapDocumentsSales.has(idDoc)) {
          this.mapDocumentsSales.get(idDoc)!.inPaymentPartial = isPartial;
        }
      }
    }).catch(e => {
      console.error('Error en findIsPaymentPartial:', e);
      return Promise.resolve();
    });
  }

  getPaymentPartialByDocument(dbServ: SQLiteObject, coDocument: string) {

    let selectStatement = "SELECT " +
      "co.co_currency, " +
      "co.da_collection, " +
      "co.id_collection, " +
      "co.st_collection, " +
      "code.*, " +
      "copa.nu_payment_doc, " +
      "copa.co_payment_method " +
      "FROM collections co " +
      "JOIN collection_details code  ON co.co_collection = code.co_collection " +
      "JOIN collection_payments copa ON co.co_collection = copa.co_collection " +
      "WHERE code.co_document = ? AND code.in_payment_partial = 'true'";

    return dbServ.executeSql(selectStatement, [coDocument]).then(data => {
      //return dbServ.executeSql(selectStatement, [this.mapDocumentsSales.get(idDocument)!.coDocument]).then(data => {
      if (data.rows.length > 0) {
        this.coDocumentPaymentPartial = data.rows.item(0).co_document;
        this.paymentPartials = [] as PaymentPartials[];
        var status = ["No Status", "Guardado", "Por Enviar", "Enviado"]
        for (var i = 0; i < data.rows.length; i++) {
          this.paymentPartials.push({
            idCollection: data.rows.item(i).id_collection,
            daCollection: data.rows.item(i).da_collection,
            coCurrency: data.rows.item(i).co_currency,
            nuAmountPaid: data.rows.item(i).nu_balance,
            nuBalanceDoc: data.rows.item(i).nu_balance_doc,
            coPaymentMethod: data.rows.item(i).co_payment_method,
            stCollection: status[data.rows.item(i).st_collection],
            nuPaymentDoc: data.rows.item(i).nu_payment_doc == "" ? "No Ref" : data.rows.item(i).nu_payment_doc,
          })
        }
      }
    })
  }


  getIgtfList(dbServ: SQLiteObject) {

    this.igtfList = [] as IgtfList[];

    return dbServ.executeSql('SELECT ' +
      'id_igtf as idIgtf, ' +
      'na_igtf as naIgtf, ' +
      'price as price, ' +
      'descripcion as descripcion, ' +
      'default_igtf as defaultIgtf ' +
      'FROM igtf_lists;', []).then(data => {
        for (let i = 0; i < data.rows.length; i++) {
          const item = data.rows.item(i);
          this.igtfList.push(item);
          if (item.defaultIgtf === "true")
            this.igtfSelected = item;
        }

        return Promise.resolve(this.igtfList)
      })
  }

  showHeaderButtonsFunction(headerButtos: boolean) {
    this.showButtons.next(headerButtos);
  }

  onCollectionValidToSave(valid: boolean) {
    console.log('returnLogicService: onReturnValid');
    this.collectValidToSave.next(valid);
  }

  onCollectionValidToSend(validToSend: boolean) {
    console.log('returnLogicService: onReturnValidToSend');
    this.collectValidToSend.next(validToSend);
  }


  onCollectionValid(valid: boolean) {
    console.log('clientStockService: onClientStockValid');
    if (valid) {
      if (this.onChangeClient)
        this.cobroValid = true;

      if (this.collection.stCollection == 1 || this.collection.stCollection == 3)
        this.cobroValid = true;

      this.onCollectionValidToSave(true);
    } else {
      if (this.onChangeClient)
        this.cobroValid = true;
    }
    if (this.collection.stCollection == 3)
      this.cobroValid = true;

    this.validCollection.next(valid);
  }

  unlockTabs() {
    let banderaMulticurrency = false;
    let banderaHistoricoTasa = true;
    let banderaChangeEnterprise = true;
    let banderaRequiredComment = true;

    if (this.globalConfig.get('multiCurrency') === "false") {
      banderaMulticurrency = true;
    } else
      banderaMulticurrency = true

    if (this.globalConfig.get('historicoTasa') === "true" && !this.historicoTasa) {
      banderaHistoricoTasa = false;
    }

    if (this.changeEnterprise) {
      banderaChangeEnterprise = false;
    }

    if (this.globalConfig.get("requiredComment") === 'true' ? true : false) {
      if (this.collection.txComment.trim() == "") {
        banderaRequiredComment = false;
      } else {
        banderaRequiredComment = true;
      }
    } else {
      banderaRequiredComment = true;

    }

    return Promise.resolve(banderaMulticurrency && banderaHistoricoTasa && banderaChangeEnterprise && banderaRequiredComment);
  }


  resetCollection(collection: Collection) {
    collection = {
      idUser: Number(localStorage.getItem("idUser")),
      coUser: localStorage.getItem("coUser")!,
      idCollection: null,
      coCollection: "",
      coOriginalCollection: null,
      daCollection: "",
      daRate: "",
      naResponsible: "",
      idCurrency: 0,
      idCurrencyConversion: 0,
      coCurrency: "",
      coCurrencyConversion: "",
      coType: this.coTypeModule,
      txComment: "",
      lbClient: "",
      naClient: "",
      idClient: 0,
      coClient: "",
      idEnterprise: 0,
      coEnterprise: "",
      stCollection: 0,
      isEdit: 0,
      isEditTotal: 0,
      isSave: 0,
      nuValueLocal: 0,
      //idConversionType: 0,
      txConversion: "",
      nuAmountTotal: 0,
      nuAmountTotalConversion: 0,
      nuAmountPaid: 0,
      nuAmountPaidConversion: 0,
      nuDifference: 0,
      nuDifferenceConversion: 0,
      nuIgtf: 0,
      nuAmountIgtf: 0,
      nuAmountFinal: 0,
      nuAmountIgtfConversion: 0,
      nuAmountFinalConversion: 0,
      hasIGTF: false,
      document: new DocumentSale,
      coordenada: "",
      //daVoucher: "",
      nuAttachments: 0,
      hasAttachments: false,
      collectionDetails: [] as CollectionDetail[],
      collectionPayments: [] as CollectionPayment[],
    }
    return Promise.resolve(collection);
  }


  initCollection(collection: Collection) {
    this.pagoEfectivo = [] as PagoEfectivo[];
    this.pagoCheque = [] as PagoCheque[];
    this.pagoDeposito = [] as PagoDeposito[];
    this.pagoTransferencia = [] as PagoTransferencia[];
    this.pagoOtros = [] as PagoOtros[];
    this.lengthMethodPaid = -1;
    this.bankAccountSelected = [] as BankAccount[];
    this.collectionIsSave = false;
    this.igtfList = [] as IgtfList[];
    this.igtfSelected = {} as IgtfList;
    this.alertMessageOpen = false;

    //this.enterpriseSelected = {} as Enterprise;
    this.listBankAccounts = [] as BankAccount[];
    this.documentSales = [] as DocumentSale[];
    this.documentSalesBackup = [] as DocumentSale[];
    this.mapDocumentsSales = new Map<number, DocumentSale>([]);

    this.montoTotalPagar = 0;
    this.montoTotalPagarConversion = 0;

    if (this.coTypeModule == '0')
      this.disabledSelectCollectMethodDisabled = true;
    else
      this.disabledSelectCollectMethodDisabled = false;


    return collection = {
      idUser: Number(localStorage.getItem("idUser")),
      coUser: localStorage.getItem("coUser")!,
      idCollection: null,
      coCollection: "",
      coOriginalCollection: null,
      daCollection: "",
      daRate: "",
      naResponsible: "",
      idCurrency: 0,
      idCurrencyConversion: 0,
      coCurrency: "",
      coCurrencyConversion: "",
      coType: this.coTypeModule,
      txComment: "",
      lbClient: "",
      naClient: "",
      idClient: 0,
      coClient: "",
      idEnterprise: 0,
      coEnterprise: "",
      stCollection: 0,
      isEdit: 0,
      isEditTotal: 0,
      isSave: 0,
      nuValueLocal: 0,
      //idConversionType: 0,
      txConversion: "",
      nuAmountTotal: 0,
      nuAmountTotalConversion: 0,
      nuAmountPaid: 0,
      nuAmountPaidConversion: 0,
      nuDifference: 0,
      nuDifferenceConversion: 0,
      nuIgtf: 0,
      nuAmountIgtf: 0,
      nuAmountFinal: 0,
      nuAmountIgtfConversion: 0,
      nuAmountFinalConversion: 0,
      hasIGTF: false,
      document: new DocumentSale,
      coordenada: "",
      //daVoucher: "",
      nuAttachments: 0,
      hasAttachments: false,
      collectionDetails: [] as CollectionDetail[],
      collectionPayments: [] as CollectionPayment[],
    }
  }

  getCurrenciesEnterprise(dbServ: SQLiteObject, idEnterprise: number) {

    return dbServ.executeSql('SELECT ' +
      'id_currency_enterprise as idCurrencyEnterprise, ' +
      'id_currency as idCurrency, ' +
      'co_currency as coCurrency, ' +
      'local_currency as localCurrency, ' +
      'hard_currency as hardCurrency, ' +
      'co_enterprise as coEnterprise, ' +
      'id_enterprise as idEnterprise ' +
      'FROM currency_enterprises WHERE id_enterprise = ?', [idEnterprise]).then(data => {
        let currencies: Currencies[] = [];
        for (let i = 0; i < data.rows.length; i++) {
          const item = data.rows.item(i);
          item.localCurrency === "true" ? true : false;
          item.hardCurrency === "true" ? true : false;
          currencies.push(item);
        }
        return currencies;
      })
  }

  getTasasHistoricoFunction(dbServ: SQLiteObject, idEnterprise: number) {

    return dbServ.executeSql('SELECT ' +
      'co_conversion_type as coConversionType, ' +
      'co_currency_hard as coCurrencyHard, ' +
      'co_currency_local as coCurrencyLocal, ' +
      'co_enterprise as coEnterprise, ' +
      'date_conversion as dateConversion, ' +
      'id_conversion_type as idConversionType, ' +
      'id_enterprise as idEnterprise, ' +
      'nu_value_local as nuValueLocal ' +
      'FROM conversion_types WHERE id_enterprise = ? ORDER BY date_conversion DESC;',
      [idEnterprise]).then(data => {
        let conversionTypes: ConversionType[] = [];
        for (let i = 0; i < data.rows.length; i++) {
          const item = data.rows.item(i);
          conversionTypes.push(item);
        }
        return conversionTypes;
      })
  }

  getDocumentById(dbServ: SQLiteObject, idEnterprise: number, idDocument: number, index: number, posicion: number) {

    return dbServ.executeSql('SELECT ' +
      'co_client as coClient,co_collection as coCollection, co_currency as coCurrency, co_document as coDocument,' +
      'co_document_sale_type as coDocumentSaleType, co_enterprise as coEnterprise, da_document as daDocument,' +
      'da_due_date as daDueDate,id_client as idClient,id_currency as idCurrency, id_document as idDocument,' +
      'id_document_sale_type as idDocumentSaleType, id_enterprise as idEnterprise,nu_amount_base as nuAmountBase,' +
      'nu_amount_discount as nuAmountDiscount, nu_amount_tax as nuAmountTax,nu_amount_total as nuAmountTotal,' +
      'nu_balance as nuBalance,nu_document as nuDocument, nu_value_local as nuValueLocal, st_document_sale as stDocumentSale,' +
      'tx_comment as txComment ' +
      'FROM document_sales d WHERE d.id_enterprise = ? AND d.id_document = ?',
      [idEnterprise, idDocument]).then(data => {
        this.documentSales[index] = {
          idDocument: data.rows.item(0).idDocument,
          idClient: data.rows.item(0).idClient,
          coClient: data.rows.item(0).coClient,
          idDocumentSaleType: data.rows.item(0).idDocumentSaleType,
          coDocumentSaleType: data.rows.item(0).coDocumentSaleType,
          daDocument: data.rows.item(0).daDocument,
          daDueDate: this.documentSales[index].daDueDate,
          nuAmountBase: data.rows.item(0).nuAmountBase == undefined ? 0 : data.rows.item(0).nuAmountBase,
          nuAmountDiscount: data.rows.item(0).nuAmountDiscount == undefined ? 0 : data.rows.item(0).nuAmountDiscount,
          nuAmountTax: data.rows.item(0).nuAmountTax == undefined ? 0 : data.rows.item(0).nuAmountTax,
          nuAmountTotal: data.rows.item(0).nuAmountTotal == undefined ? 0 : data.rows.item(0).nuAmountTotal,
          nuAmountPaid: this.coTypeModule != '2' ? data.rows.item(0).nuAmountPaid : this.amountPaidRetention,
          nuBalance: data.rows.item(0).nuBalance,
          coCurrency: data.rows.item(0).coCurrency,
          idCurrency: data.rows.item(0).idCurrency,
          nuDocument: data.rows.item(0).nuDocument,
          txComment: data.rows.item(0).txComment,
          coDocument: data.rows.item(0).coDocument,
          coCollection: data.rows.item(0).coCollection,
          nuValueLocal: data.rows.item(0).nuValueLocal,
          stDocumentSale: data.rows.item(0).stDocumentSale,
          coEnterprise: data.rows.item(0).coEnterprise,
          idEnterprise: data.rows.item(0).idEnterprise,
          naType: data.rows.item(0).naType,
          positionCollecDetails: this.documentSales[index].positionCollecDetails,
          nuAmountRetention: data.rows.item(0).nuAmountRetention == undefined ? 0 : data.rows.item(0).nuAmountRetention,
          nuAmountRetention2: data.rows.item(0).nuAmountRetention2 == undefined ? 0 : data.rows.item(0).nuAmountRetention2,
          daVoucher: data.rows.item(0).daVoucher == undefined ? "" : data.rows.item(0).daVoucher,
          nuVaucherRetention: data.rows.item(0).nuVaucherRetention == undefined ? "" : this.documentSales[index].nuVaucherRetention,
          igtfAmount: data.rows.item(0).igtfAmount == undefined ? 0 : this.documentSales[index].igtfAmount,
          txConversion: this.documentSales[index].txConversion,
          inPaymentPartial: this.documentSales[index].inPaymentPartial,
          isSelected: this.documentSales[index].isSelected,
          isSave: false,
        }

        this.documentSalesBackup[index] = Object.assign({}, this.documentSales[index]);
        this.documentSalesBackup[index].positionCollecDetails = -1;
        return Promise.resolve(posicion);
      }).catch(e => {
        //this.documentSales
        return Promise.resolve(0);
      })
  }

  setDocumentSale() {

  }


  getAllDocuments(dbServ: SQLiteObject, idClient: number, coCurrency: string, coCollection: string, idEnterprise: number) {
    /* this.documentSales = [] as DocumentSale[];
    this.documentSalesBackup = [] as DocumentSale[]; */


    let selectStatement = "";
    if (this.coTypeModule == "3") {
      selectStatement = 'SELECT ' +
        'd.* FROM document_sales d ' +
        'LEFT JOIN document_st ds ' +
        'ON d.co_document = ds.co_document ' +
        'WHERE d.id_client = ? AND ds.st_document < 2 AND d.co_currency = ? AND d.id_enterprise = ? ' +
        'AND d.co_document_sale_type == "IGTF" ' +
        'OR d.co_document in (SELECT co_document ' +
        'FROM collection_details WHERE co_collection= ?);'
    } else {
      selectStatement = 'SELECT ' +
        'd.* FROM document_sales d ' +
        'LEFT JOIN document_st ds ' +
        'ON d.co_document = ds.co_document ' +
        'WHERE d.id_client = ? AND ds.st_document < 2 AND d.co_currency = ? AND d.id_enterprise = ? ' +
        'AND d.co_document_sale_type != "IGTF" ' +
        'OR d.co_document in (SELECT co_document ' +
        'FROM collection_details WHERE co_collection= ?);'
    }

    return dbServ.executeSql(selectStatement,
      [idClient, coCurrency, idEnterprise, coCollection]).then(data => {
        if (data.rows.length == 0) {
          this.documentSales = [] as DocumentSale[];
          this.documentSalesBackup = [] as DocumentSale[];
          this.mapDocumentsSales.clear()
        } else
          for (let i = 0; i < data.rows.length; i++) {
            let documentSales = {} as DocumentSale;
            let documentSalesBackup = {} as DocumentSale;
            if (this.mapDocumentsSales.get(data.rows.item(i).id_document) == undefined) {
              documentSales.idDocument = data.rows.item(i).id_document;
              documentSales.idClient = data.rows.item(i).id_client;
              documentSales.coClient = data.rows.item(i).co_client;
              documentSales.idDocumentSaleType = data.rows.item(i).id_document_sale_type;
              documentSales.coDocumentSaleType = data.rows.item(i).co_document_sale_type;
              documentSales.daDocument = data.rows.item(i).da_document;
              documentSales.daDueDate = data.rows.item(i).da_due_date;
              if (data.rows.item(i).na_amount_base === null || data.rows.item(i).na_amount_base === undefined) {
                documentSales.nuAmountBase = 0;
              } else {
                documentSales.nuAmountBase = data.rows.item(i).na_amount_base;
              }

              if (data.rows.item(i).nu_amount_discount === null || data.rows.item(i).nu_amount_discount === undefined) {
                documentSales.nuAmountDiscount = 0;
              } else {
                documentSales.nuAmountDiscount = data.rows.item(i).nu_amount_discount;
              }

              if (data.rows.item(i).nu_amount_tax === null || data.rows.item(i).nu_amount_tax === undefined) {
                documentSales.nuAmountTax = 0;
              } else {
                documentSales.nuAmountTax = data.rows.item(i).nu_amount_tax;
              }
              documentSales.nuAmountTotal = data.rows.item(i).nu_amount_total == undefined ? 0 : data.rows.item(i).nu_amount_total;
              documentSales.nuBalance = data.rows.item(i).nu_balance == undefined ? 0 : data.rows.item(i).nu_balance;
              documentSales.coCurrency = data.rows.item(i).co_currency;
              documentSales.idCurrency = data.rows.item(i).id_currency;
              documentSales.nuDocument = data.rows.item(i).nu_document;
              documentSales.txComment = data.rows.item(i).tx_comment;
              documentSales.coDocument = data.rows.item(i).co_document;
              documentSales.coCollection = data.rows.item(i).co_collection;
              documentSales.nuValueLocal = data.rows.item(i).nu_value_local;
              documentSales.stDocumentSale = data.rows.item(i).st_document_sale;
              documentSales.coEnterprise = data.rows.item(i).co_enterprise;
              documentSales.idEnterprise = data.rows.item(i).id_enterprise;
              documentSales.naType = data.rows.item(i).naType;
              documentSales.inPaymentPartial = false;
              documentSales.isSelected = false;
              documentSales.isSave = false;


              if (!this.isOpenCollect) {
                for (var cd = 0; cd < this.collection.collectionDetails.length; cd++) {
                  if (data.rows.item(i).id_document == this.collection.collectionDetails[cd].idDocument) {
                    documentSales.isSelected = true;
                  }

                  /* else
                    documentSales.isSelected = false; */
                }
              } else {
                documentSales.isSelected = false;
              }


              documentSales.positionCollecDetails = data.rows.item(i).positionCollecDetails;
              documentSales.nuAmountRetention = data.rows.item(i).nuAmountRetention == undefined ? 0 : data.rows.item(i).nuAmountRetention;
              documentSales.nuAmountRetention2 = data.rows.item(i).nuAmountRetention2 == undefined ? 0 : data.rows.item(i).nuAmountRetention2;
              documentSales.daVoucher = data.rows.item(i).daVoucher == undefined ? "" : data.rows.item(i).daVoucher;
              documentSales.nuVaucherRetention = data.rows.item(i).nuVaucherRetention == undefined ? 0 : data.rows.item(i).nuVaucherRetention;
              documentSales.igtfAmount = data.rows.item(i).igtfAmount == undefined ? 0 : data.rows.item(i).igtfAmount;
              documentSales.txConversion = data.rows.item(i).txConversion == undefined ? "" : data.rows.item(i).txConversion;

              this.documentSales.push(documentSales);
              //documentSalesBackup = { ...documentSales };
              documentSalesBackup = Object.assign({}, documentSales);

              this.documentSalesBackup.push(documentSalesBackup);

              this.mapDocumentsSales.set(
                data.rows.item(i).id_document, documentSales
              )

            }

          }

        if (this.historicPartialPayment) {
          this.findIsPaymentPartial(dbServ);
        }
        return this.documentSales
      }).catch(e => {
        //this.documentSales
        return Promise.resolve(this.documentSales);
      })
  }

  getIgtf(dbServ: SQLiteObject) {
    dbServ.executeSql('SELECT ' +
      'id_igtf as idIgtf, ' +
      'na_igtf as naIgtf, ' +
      'price as price, ' +
      'descripcion as descripcion, ' +
      'default_igtf as defaultIgtf ' +
      'FROM igtf_lists;', []).then(data => {
        let igtfList: IgtfList[] = [];
        for (let i = 0; i < data.rows.length; i++) {
          const item = data.rows.item(i);
          igtfList.push(item);
        }
        this.igtfList = [] as IgtfList[];
        this.igtfList = igtfList;
      })
  }

  getRate(dbServ: SQLiteObject, idEnterprise: number) {

    return dbServ.executeSql('SELECT * FROM conversion_types WHERE id_enterprise = ? ORDER BY date_conversion DESC LIMIT 1;',
      [idEnterprise]).then(data => {
        let rate: ConversionType;
        if (data.rows.length > 0)
          rate = data.rows.item(0);
        else
          rate = {} as ConversionType;
        return rate;
      })
  }

  getAllClientBankAccountByEnterprise(dbServ: SQLiteObject, idEnterprise: number, coClient: string,) {


    if (this.clientBankAccount) { }
    return dbServ.executeSql('SELECT * FROM client_bank_accounts, banks WHERE client_bank_accounts.id_enterprise = ? ' +
      'AND client_bank_accounts.co_bank = banks.co_bank AND client_bank_accounts.co_client = ?',
      [idEnterprise, coClient]).then(data => {
        let clientBankAccounts: ClientBankAccount[] = [];

        if (this.clientBankAccount) {
          clientBankAccounts.push({
            idBank: 0,
            idClient: 0,
            idClientBankAccount: 0,
            idCurrency: this.collection.idCurrency,
            idEnterprise: this.collection.idEnterprise,
            coBank: "Nueva Cuenta",
            coClient: "0",
            coClientBankAccount: "Nueva Cuenta",
            coCurrency: this.collection.coCurrency,
            coEnterprise: this.collection.coEnterprise,
            coType: "0",
            naBank: "Nueva Cuenta",
            nuAccount: "Nueva Cuenta",
          })
        }

        if (data.rows.length > 0)
          for (let i = 0; i < data.rows.length; i++) {
            clientBankAccounts.push({
              idBank: data.rows.item(i).id_bank,
              idClient: data.rows.item(i).id_client,
              idClientBankAccount: data.rows.item(i).id_client_bank_account,
              idCurrency: data.rows.item(i).id_currency,
              idEnterprise: data.rows.item(i).id_enterprise,
              coBank: data.rows.item(i).co_bank,
              coClient: data.rows.item(i).co_client,
              coClientBankAccount: data.rows.item(i).co_client_bank_account,
              coCurrency: data.rows.item(i).co_currency,
              coEnterprise: data.rows.item(i).co_enterprise,
              coType: data.rows.item(i).co_type,
              naBank: data.rows.item(i).na_bank,
              nuAccount: data.rows.item(i).nu_account,
            })
          }
        return clientBankAccounts;
      });
  }

  getAllBankAccountsByEnterprise(dbServ: SQLiteObject, idEnterprise: number, coCurrency: string) {

    let selectStatement = ""
    if (this.currencyBank) {
      selectStatement = 'SELECT * FROM bank_accounts ba, banks b WHERE ba.id_enterprise = ?' +
        ' AND b.co_enterprise = (SELECT co_enterprise FROM enterprises WHERE id_enterprise = ?)' +
        ' AND ba.co_bank = b.co_bank';

      return dbServ.executeSql(selectStatement,
        [idEnterprise, idEnterprise]).then(data => {
          let bankAccount: BankAccount[] = [];
          if (data.rows.length > 0)
            for (let i = 0; i < data.rows.length; i++) {
              bankAccount.push({
                idBankAccount: data.rows.item(i).id_bank_account,
                coBank: data.rows.item(i).co_bank,
                idBank: data.rows.item(i).id_bank,
                coAccount: data.rows.item(i).co_account,
                nuAccount: data.rows.item(i).nu_account,
                coType: data.rows.item(i).co_type,
                coCurrency: data.rows.item(i).co_currency,
                idCurrency: data.rows.item(i).id_currency,
                coEnterprise: data.rows.item(i).co_enterprise,
                idEnterprise: data.rows.item(i).id_enterprise,
                nameBank: data.rows.item(i).na_bank
              })
            }

          return bankAccount;
        })
    } else {
      selectStatement = 'SELECT * FROM bank_accounts ba, banks b WHERE ba.id_enterprise = ?' +
        ' AND b.co_enterprise = (SELECT co_enterprise FROM enterprises WHERE id_enterprise = ?)' +
        ' AND ba.co_bank = b.co_bank AND ba.co_currency = ?';
      return dbServ.executeSql(selectStatement,
        [idEnterprise, idEnterprise, coCurrency]).then(data => {
          let bankAccount: BankAccount[] = [];
          if (data.rows.length > 0)
            for (let i = 0; i < data.rows.length; i++) {
              bankAccount.push({
                idBankAccount: data.rows.item(i).id_bank_account,
                coBank: data.rows.item(i).co_bank,
                idBank: data.rows.item(i).id_bank,
                coAccount: data.rows.item(i).co_account,
                nuAccount: data.rows.item(i).nu_account,
                coType: data.rows.item(i).co_type,
                coCurrency: data.rows.item(i).co_currency,
                idCurrency: data.rows.item(i).id_currency,
                coEnterprise: data.rows.item(i).co_enterprise,
                idEnterprise: data.rows.item(i).id_enterprise,
                nameBank: data.rows.item(i).na_bank
              })
            }

          return bankAccount;
        }).catch(e => {
          let bankAccount: BankAccount[] = [];
          return bankAccount;
        })
    }
  }
  createDocumentSaleIGTF(dbServ: SQLiteObject, collection: Collection) {
    let igtfDocument = [] as DocumentSale[];
    let date = this.dateServ.hoyISO();
    igtfDocument.push({
      idDocument: 0,
      idClient: collection.idClient,
      coClient: collection.coClient,
      idDocumentSaleType: 4,
      coDocumentSaleType: "IGTF",
      daDocument: date.split("T")[0],
      daDueDate: date.split("T")[0],
      nuAmountBase: 0,
      nuAmountDiscount: 0,
      nuAmountTax: 0,
      nuAmountTotal: collection.nuAmountIgtf,
      nuAmountPaid: 0,
      nuBalance: collection.nuAmountIgtf,
      coCurrency: collection.coCurrency,
      idCurrency: collection.idCurrency,
      nuDocument: "",
      txComment: "IGTF " + collection.nuAmountIgtf + " " + collection.coCollection,
      coDocument: "IGTF-" + date.split("T")[0],
      coCollection: collection.coCollection,
      nuValueLocal: collection.nuValueLocal,
      stDocumentSale: 0,
      coEnterprise: collection.coEnterprise,
      idEnterprise: collection.idEnterprise,
      naType: "IGTF",
      isSelected: false,
      positionCollecDetails: 0,
      nuAmountRetention: 0,
      nuAmountRetention2: 0,
      daVoucher: "",
      nuVaucherRetention: "",
      igtfAmount: 0,
      txConversion: 0,
      inPaymentPartial: false,
      isSave: false
    });

    this.insertDocumentSaleBatch(dbServ, igtfDocument).then((resp) => {
      console.log("SE GUARDO DOCUMETNO IGTF EN DOCUMETN SALES DESDE COLLECT");
    });
  }

  insertDocumentSaleBatch(dbServ: SQLiteObject, arr: DocumentSale[]) {
    var statements = [];
    let insertStatement = 'INSERT OR REPLACE INTO document_sales(' +
      'id_document,id_client,co_client,id_document_sale_type, co_document_sale_type,' +
      'da_document,da_due_date,nu_amount_base,nu_amount_discount,nu_amount_tax,' +
      'nu_amount_total,nu_balance,id_currency,co_currency,id_enterprise,' +
      'co_enterprise,nu_document,tx_comment,co_document,co_collection,' +
      'nu_value_local,st_document_sale' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idDocument, obj.idClient, obj.coClient, obj.idDocumentSaleType, obj.coDocumentSaleType,
      obj.daDocument, obj.daDueDate, obj.nuAmountBase, obj.nuAmountDiscount, obj.nuAmountTax,
      obj.nuAmountTotal, obj.nuBalance, obj.idCurrency, obj.coCurrency, obj.idEnterprise,
      obj.coEnterprise, obj.nuDocument, obj.txComment, obj.coDocument, obj.coCollection,
      obj.nuValueLocal, obj.stDocumentSale]]);
    }

    return dbServ.sqlBatch(statements).then(res => {
      var statements = [];

      let statementsDocumentSt = 'INSERT OR REPLACE INTO document_st (' +
        'id_document, co_document, st_document' +
        ') VALUES (' +
        '?,?,?)'
      for (var i = 0; i < arr.length; i++) {
        var obj = arr[i];
        statements.push([statementsDocumentSt, [obj.idDocument, obj.coDocument, 0]]);
      }
      dbServ.sqlBatch(statements).then(res => {
        console.log(res)
      }).catch(e => {
        console.log(e);
      })
    }).catch(e => {
      console.log(e);
    })
  }

  saveCollection(dbServ: SQLiteObject, collection: Collection,) {


    return this.adjuntoService.getQuantityAdjuntos().then(number => {
      this.collection.nuAttachments = number;
      if (this.collection.nuAttachments > 0)
        this.collection.hasAttachments = true;

      if (collection.hasIGTF) {
        //SE DEBE CREAR UN DOCUMENTO DE VENTA TIPO IGTF
        this.createDocumentSaleIGTF(dbServ, collection);
      }

      this.collection.nuAmountFinal = this.montoTotalPagar;
      this.collection.nuAmountFinalConversion = this.convertirMonto(this.collection.nuAmountFinal, 0, this.collection.coCurrency);

      let insertCollection = "INSERT OR REPLACE INTO collections (" +
        "id_collection," +
        "co_collection," +
        "co_original_collection," +
        "id_client," +
        "co_client," +
        "lb_client," +
        "st_collection," +
        "da_collection," +
        "da_rate," +
        "na_responsible," +
        "id_enterprise," +
        "co_enterprise," +
        "id_currency," +
        "co_currency," +
        "co_type," +
        "tx_comment," +
        "coordenada," +
        "nu_value_local," +
        "nu_difference," +
        "nu_difference_conversion," +
        "tx_conversion," +
        "nu_amount_total," +
        "nu_amount_total_conversion," +
        "nu_amount_igtf," +
        "nu_amount_igtf_conversion," +
        "nu_amount_final," +
        "nu_amount_final_conversion," +
        "nu_igtf," +
        "hasIGTF," +
        "nu_attachments," +
        "has_attachments" +
        ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      return dbServ.executeSql(insertCollection,
        [
          0,
          collection.coCollection,
          collection.coOriginalCollection,
          collection.idClient,
          collection.coClient,
          collection.lbClient,
          collection.stCollection,
          collection.daCollection,
          collection.daRate,
          collection.naResponsible,
          collection.idEnterprise,
          collection.coEnterprise,
          collection.idCurrency,
          collection.coCurrency,
          collection.coType,
          collection.txComment,
          collection.coordenada,
          collection.nuValueLocal,
          collection.nuDifference,
          collection.nuDifferenceConversion,
          collection.txConversion,
          collection.nuAmountTotal,
          collection.nuAmountTotalConversion,
          collection.nuAmountIgtf,
          collection.nuAmountIgtfConversion,
          collection.nuAmountFinal,
          collection.nuAmountFinalConversion,
          collection.nuIgtf,
          collection.hasIGTF,
          collection.nuAttachments,
          collection.hasAttachments
        ]
      ).then(data => {
        console.log("COLLECTION INSERT", data);

        if (collection.coType == '0') {
          return this.updateDocumentSt(dbServ, this.documentSales).then((resp) => {
            console.log("TERMINE DOCUMENT ST")
            return this.saveCollectionDetail(dbServ, this.collection.collectionDetails, this.collection.coCollection).then(resp => {
              return this.saveCollectionPayment(dbServ, this.collection.collectionPayments, this.collection.coCollection).then(resp => {
                this.documentSales = [] as DocumentSale[];
                this.documentSalesBackup = [] as DocumentSale[];
                return resp
              })
            });
          });
        } else if (collection.coType == '1') {
          //es ancitipo solo debo guardar el payment
          return this.saveCollectionPayment(dbServ, this.collection.collectionPayments, this.collection.coCollection).then(resp => {
            return resp
          })
        } else if (collection.coType == '2') {
          //es retencion, solo debo guardar el detalle
          return this.updateDocumentSt(dbServ, this.documentSales).then((resp) => {
            console.log("TERMINE DOCUMENT ST")
            return this.saveCollectionDetail(dbServ, this.collection.collectionDetails, this.collection.coCollection).then(resp => {
              this.documentSales = [] as DocumentSale[];
              this.documentSalesBackup = [] as DocumentSale[];
              return resp;
            });

          });

        } else {
          //es cobranza normal debo guardar el payment y el detalle
          return this.updateDocumentSt(dbServ, this.documentSales).then((resp) => {
            console.log("TERMINE DOCUMENT ST")
            return this.saveCollectionDetail(dbServ, this.collection.collectionDetails, this.collection.coCollection).then(resp => {
              //this.documentSales = [] as DocumentSale[];
              //this.documentSalesBackup = [] as DocumentSale[];
              return resp;
            });
          });

        }


        /* if (this.createAutomatedPrepaid)
          this.createAnticipoCollection(collection, inserStatement); */


      }).catch(e => {
        return Promise.resolve(e);
      })
    })

  }

  saveCollectionBatch(dbServ: SQLiteObject, collection: Collection[],) {
    let insertCollection = "INSERT OR REPLACE INTO collections (" +
      "id_collection," +
      "co_collection," +
      "co_original_collection," +
      "id_client," +
      "co_client, " +
      "lb_client," +
      "st_collection," +
      "da_collection," +
      "da_rate," +
      "na_responsible," +
      "id_enterprise," +
      "co_enterprise," +
      "id_currency," +
      "co_currency," +
      "co_type," +
      "tx_comment," +
      "coordenada," +
      "nu_value_local," +
      "nu_difference," +
      "nu_difference_conversion," +
      "tx_conversion," +
      "nu_amount_total," +
      "nu_amount_total_conversion," +
      "nu_amount_igtf," +
      "nu_amount_igtf_conversion," +
      "nu_amount_final," +
      "nu_amount_final_conversion," +
      "nu_igtf," +
      "hasIGTF," +
      "nu_attachments," +
      "has_attachments" +
      ") VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    let inserStatementCollectionDetail = "INSERT OR REPLACE INTO collection_details(" +
      "id_collection_detail," +
      "co_collection," +
      "co_document," +
      "in_payment_partial," +
      "nu_voucher_retention," +
      "nu_amount_retention," +
      "nu_amount_retention2," +
      "nu_amount_paid," +
      "nu_amount_paid_conversion," +
      "nu_amount_discount," +
      "nu_amount_discount_conversion," +
      "nu_amount_doc," +
      "nu_amount_doc_conversion," +
      "da_document," +
      "nu_balance_doc," +
      "nu_balance_doc_conversion," +
      "co_original," +
      "co_type_doc," +
      "id_document," +
      "nu_amount_retention_iva_conversion," +
      "nu_amount_retention_islr_conversion," +
      "nu_amount_igtf," +
      "nu_amount_igtf_conversion," +
      "da_voucher" +
      ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    let insertCollectionPayment = "INSERT OR REPLACE INTO collection_payments(" +
      "id_collection_payment," +
      "co_collection, " +
      "id_collection_detail, " +
      "co_payment_method, " +
      "id_bank, " +
      "nu_payment_doc, " +
      "na_bank, " +
      "co_client_bank_account, " +
      "nu_client_bank_account, " +
      "da_value, " +
      "da_collection_payment, " +
      "nu_collection_payment, " +
      "nu_amount_partial, " +
      "nu_amount_partial_conversion, " +
      "co_type" +
      ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    let queries: any[] = []//(string | (string | number | boolean)[])[] = [];

    for (var co = 0; co < collection.length; co++) {
      const collect = collection[co];
      queries.push([insertCollection, [
        collect.idCollection,
        collect.coCollection,
        collect.coOriginalCollection,
        collect.idClient,
        collect.coClient,
        collect.lbClient,
        collect.stCollection,
        collect.daCollection,
        collect.daRate,
        collect.naResponsible,
        collect.idEnterprise,
        collect.coEnterprise,
        collect.idCurrency,
        collect.coCurrency,
        collect.coType,
        collect.txComment,
        collect.coordenada,
        collect.nuValueLocal,
        collect.nuDifference,
        collect.nuDifferenceConversion,
        collect.txConversion,
        collect.nuAmountTotal,
        collect.nuAmountTotalConversion,
        collect.nuAmountIgtf,
        collect.nuAmountIgtfConversion,
        collect.nuAmountFinal,
        collect.nuAmountFinalConversion,
        collect.nuIgtf,
        collect.hasIGTF,
        collect.nuAttachments,
        collect.hasAttachments
      ]]);

      for (var coDetail = 0; coDetail < collect.collectionDetails.length; coDetail++) {
        const collectionDetail = collection[co].collectionDetails[coDetail];

        if (collectionDetail.inPaymentPartial == true) {
          this.coDocumentToUpdate.push(collectionDetail.coDocument);
        }

        queries.push([inserStatementCollectionDetail, [
          collectionDetail.idCollectionDetail,
          collectionDetail.coCollection,
          collectionDetail.coDocument,
          collectionDetail.inPaymentPartial,
          collectionDetail.nuVoucherRetention,
          collectionDetail.nuAmountRetention,
          collectionDetail.nuAmountRetention2,
          collectionDetail.nuAmountPaid,
          collectionDetail.nuAmountPaidConversion,
          collectionDetail.nuAmountDiscount,
          collectionDetail.nuAmountDiscountConversion,
          collectionDetail.nuAmountDoc,
          collectionDetail.nuAmountDocConversion,
          collectionDetail.daDocument,
          collectionDetail.nuBalanceDoc,
          collectionDetail.nuBalanceDocConversion,
          collectionDetail.coOriginal,
          collectionDetail.coTypeDoc,
          collectionDetail.idDocument,
          collectionDetail.nuAmountRetentionConversion,
          collectionDetail.nuAmountRetention2Conversion,
          collectionDetail.nuAmountIgtf,
          collectionDetail.nuAmountIgtfConversion,
          collectionDetail.daVoucher
        ]]);

        for (var coDetailPayment = 0; coDetailPayment < collect.collectionPayments.length; coDetailPayment++) {
          const collectionPayment = collect.collectionPayments[coDetailPayment];
          queries.push([insertCollectionPayment, [
            collectionPayment.idCollectionPayment,
            collectionPayment.coCollection,
            collectionPayment.idCollectionDetail,
            collectionPayment.coPaymentMethod,
            collectionPayment.idBank,
            collectionPayment.nuPaymentDoc,
            collectionPayment.naBank,
            collectionPayment.coClientBankAccount,
            collectionPayment.nuClientBankAccount,
            collectionPayment.daValue,
            collectionPayment.daCollectionPayment,
            collectionPayment.nuCollectionPayment,
            collectionPayment.nuAmountPartial,
            collectionPayment.nuAmountPartialConversion,
            collectionPayment.coType
          ]]);
        }
      }
      /* if (this.coDocumentToUpdate.length > 0) {
        // Actualizar los documentos en la base de datos
        this.updateDocuments(dbServ, this.coDocumentToUpdate);
      } */
    }
    return dbServ.sqlBatch(queries).then(() => { }).catch(error => { });
    /*  if (collection.hasIGTF) {
       //SE DEBE CREAR UN DOCUMENTO DE VENTA TIPO IGTF
       this.createDocumentSaleIGTF(collection);
     } */



  }

  saveCollectionDetail(dbServ: SQLiteObject, collectionDetail: CollectionDetail[], coCollection: string) {


    //if (collectionDetail.length > 0)
    dbServ.executeSql("DELETE FROM collection_details WHERE co_collection = ?", [coCollection]).then(res => {
    }).catch(e => {
      console.log(e);
    })

    let statementsCollectionDetails = [];
    let inserStatementCollectionDetail = "INSERT OR REPLACE INTO collection_details(" +
      "id_collection_detail," +
      "co_collection," +
      "co_document," +
      "in_payment_partial," +
      "nu_voucher_retention," +
      "nu_amount_retention," +
      "nu_amount_retention2," +
      "nu_amount_paid," +
      "nu_amount_paid_conversion," +
      "nu_amount_discount," +
      "nu_amount_discount_conversion," +
      "nu_amount_doc," +
      "nu_amount_doc_conversion," +
      "da_document," +
      "nu_balance_doc," +
      "nu_balance_doc_conversion," +
      "co_original," +
      "co_type_doc," +
      "id_document," +
      "nu_amount_retention_iva_conversion," +
      "nu_amount_retention_islr_conversion," +
      "nu_amount_igtf," +
      "nu_amount_igtf_conversion," +
      "da_voucher" +
      ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    for (var i = 0; i < collectionDetail.length; i++) {
      statementsCollectionDetails.push([inserStatementCollectionDetail, [
        0,
        collectionDetail[i].coCollection,
        collectionDetail[i].coDocument,
        collectionDetail[i].inPaymentPartial,
        collectionDetail[i].nuVoucherRetention,
        collectionDetail[i].nuAmountRetention,
        collectionDetail[i].nuAmountRetention2,
        collectionDetail[i].nuAmountPaid,
        collectionDetail[i].nuAmountPaidConversion,
        collectionDetail[i].nuAmountDiscount,
        collectionDetail[i].nuAmountDiscountConversion,
        collectionDetail[i].nuAmountDoc,
        collectionDetail[i].nuAmountDocConversion,
        collectionDetail[i].daDocument,
        collectionDetail[i].nuBalanceDoc,
        collectionDetail[i].nuBalanceDocConversion,
        collectionDetail[i].coOriginal,
        collectionDetail[i].coTypeDoc,
        collectionDetail[i].idDocument,
        collectionDetail[i].nuAmountRetentionConversion,
        collectionDetail[i].nuAmountRetention2Conversion,
        collectionDetail[i].nuAmountIgtf,
        collectionDetail[i].nuAmountIgtfConversion,
        collectionDetail[i].daVoucher
      ]]);
    }

    return dbServ.sqlBatch(statementsCollectionDetails).then(res => {
      console.log("COLLECTION DETAILS INSERT", res);
      if (this.collection.coType != "1" && this.collection.coType != "2") {
        return this.saveCollectionPayment(dbServ, this.collection.collectionPayments, coCollection).then(resp => {
          return resp
        })
      } else {
        return res
      }

    }).catch(e => {
      console.log(e);
    })
  }

  saveCollectionPayment(dbServ: SQLiteObject, collectionPayment: CollectionPayment[], coCollection: string) {

    //if (collectionPayment.length > 0)
    dbServ.executeSql("DELETE FROM collection_payments WHERE co_collection = ?", [coCollection]).then(res => {

    }).catch(e => {
      console.log(e);
    })

    let statementsCollectionPayment = [];
    let insertStatement = "INSERT OR REPLACE INTO collection_payments(" +
      "id_collection_payment," +
      "co_collection, " +
      "id_collection_detail, " +
      "co_payment_method, " +
      "id_bank, " +
      "nu_payment_doc, " +
      "na_bank, " +
      "co_client_bank_account, " +
      "nu_client_bank_account, " +
      "da_value, " +
      "da_collection_payment, " +
      "nu_collection_payment, " +
      "nu_amount_partial, " +
      "nu_amount_partial_conversion, " +
      "co_type" +
      ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    for (var i = 0; i < collectionPayment.length; i++) {
      statementsCollectionPayment.push([insertStatement, [
        0,
        collectionPayment[i].coCollection,
        collectionPayment[i].idCollectionDetail,
        collectionPayment[i].coPaymentMethod,
        collectionPayment[i].idBank,
        collectionPayment[i].nuPaymentDoc,
        collectionPayment[i].naBank,
        collectionPayment[i].coClientBankAccount,
        collectionPayment[i].nuClientBankAccount,
        collectionPayment[i].daValue,
        collectionPayment[i].daCollectionPayment,
        collectionPayment[i].nuCollectionPayment,
        collectionPayment[i].nuAmountPartial,
        collectionPayment[i].nuAmountPartialConversion,
        collectionPayment[i].coType
      ]]);
    }

    return dbServ.sqlBatch(statementsCollectionPayment).then(res => {
      console.log("COLLECTION PAYMENTS INSERT", res);
      return ("TERMINE");
      //this.saveCollectionPayment(this.collection.collectPayment)
    }).catch(e => {
      console.log(e);
    })
  }

  saveSendCollection(coCollection: string) {
    this.saveSend.next(coCollection);
  }

  //createAnticipoCollection(collection: Collection, inserStatement: string) {
  createAnticipoCollection(dbServ: SQLiteObject, collection: Collection) {
    let inserStatement = "INSERT OR REPLACE INTO collections (" +
      "id_collection," +
      "co_collection," +
      "co_original_collection," +
      "id_client," +
      "co_client," +
      "lb_client," +
      "st_collection," +
      "da_collection," +
      "da_rate," +
      "na_responsible," +
      "id_enterprise," +
      "co_enterprise," +
      "id_currency," +
      "co_currency," +
      "co_type," +
      "tx_comment," +
      "coordenada," +
      "nu_value_local," +
      "nu_difference," +
      "nu_difference_conversion," +
      "tx_conversion," +
      "nu_amount_total," +
      "nu_amount_total_conversion," +
      "nu_amount_igtf," +
      "nu_amount_igtf_conversion," +
      "nu_amount_final," +
      "nu_amount_final_conversion," +
      "nu_igtf," +
      "hasIGTF," +
      "nu_attachments," +
      "has_attachments" +
      ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";


    let newCoCollection = this.dateServ.generateCO(0);
    return dbServ.executeSql(inserStatement,
      [
        0,
        newCoCollection,
        collection.coCollection,
        collection.idClient,
        collection.coClient,
        collection.lbClient,
        collection.stCollection,
        collection.daCollection,
        collection.daRate,
        collection.naResponsible,
        collection.idEnterprise,
        collection.coEnterprise,
        collection.idCurrency,
        collection.coCurrency,
        1, //TIPO ANTICIPO
        collection.txComment,
        collection.coordenada,
        collection.nuValueLocal,
        0,//collection.nuDifference,
        0,//collection.nuDifferenceConversion,
        collection.txConversion,
        collection.nuDifference,//collection.nuAmountTotal,
        collection.nuDifferenceConversion,//collection.nuAmountTotalConversion,
        0,//collection.nuAmountIgtf,
        0,//collection.nuAmountIgtfConversion,
        collection.nuDifference,//collection.nuAmountFinal,
        collection.nuDifferenceConversion,//collection.nuAmountFinalConversion,
        collection.nuIgtf,
        collection.hasIGTF,
        collection.nuAttachments,
        collection.hasAttachments
      ]).then(data => {
        console.log("CREE ANTICIPO AUTOMATICO, DEBO CREAR EL PAYMENT")
        return this.createAnticipoCollectionPayment(dbServ, collection, newCoCollection);
      }).catch(e => {
        console.log(e);
      })
  }

  createAnticipoCollectionPayment(dbServ: SQLiteObject, collection: Collection, newCoCollection: string) {

    let insertStatement = "INSERT OR REPLACE INTO collection_payments(" +
      "id_collection_payment," +
      "co_collection," +
      "id_collection_detail," +
      "co_payment_method," +
      "id_bank," +
      "nu_payment_doc," +
      "na_bank," +
      "co_client_bank_account," +
      "nu_client_bank_account," +
      "da_value," +
      "da_collection_payment," +
      "nu_collection_payment," +
      "nu_amount_partial," +
      "nu_amount_partial_conversion," +
      "co_type" +
      ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    return dbServ.executeSql(insertStatement,
      [
        0,
        newCoCollection,
        collection.collectionPayments[this.anticipoAutomatico[0].posCollectionPayment].idCollectionDetail,
        collection.collectionPayments[this.anticipoAutomatico[0].posCollectionPayment].coPaymentMethod,
        collection.collectionPayments[this.anticipoAutomatico[0].posCollectionPayment].idBank,
        collection.collectionPayments[this.anticipoAutomatico[0].posCollectionPayment].nuPaymentDoc,
        collection.collectionPayments[this.anticipoAutomatico[0].posCollectionPayment].naBank,
        collection.collectionPayments[this.anticipoAutomatico[0].posCollectionPayment].coClientBankAccount,
        collection.collectionPayments[this.anticipoAutomatico[0].posCollectionPayment].nuClientBankAccount,
        collection.collectionPayments[this.anticipoAutomatico[0].posCollectionPayment].daValue,
        collection.collectionPayments[this.anticipoAutomatico[0].posCollectionPayment].daCollectionPayment,
        collection.collectionPayments[this.anticipoAutomatico[0].posCollectionPayment].nuCollectionPayment,
        collection.nuDifference,
        collection.nuDifferenceConversion,
        this.anticipoAutomatico[0].type,
      ]).then(data => {
        console.log("SE CREO COLLECTION PAYMENTS AUTOMATICO POR EL ANTICIPO");
        this.saveSendCollection(newCoCollection);
        return true;
      }).catch(e => {
        console.log(e);
        return false;
      })
  }

  updateDocumentSt(dbServ: SQLiteObject, documentSales: DocumentSale[]) {
    if (documentSales[0].coDocumentSaleType == "IGTF") {
      let updateStatement = "UPDATE document_st SET st_document = 2 WHERE co_document = ?"
      return dbServ.executeSql(updateStatement,
        [documentSales[0].coDocument]
      ).then(data => {
        console.log("UPDATE DOCUMENTO IGTF", documentSales[0].coDocument)
      }).catch(e => {
        console.log(e);
      })
    } else {
      let stamentenDocumentSt = []
      /*     let insertStatement = 'INSERT OR REPLACE INTO document_st (' +
            'id_document,co_document,st_document' +
            ') VALUES (?,?,?)'; */
      let updateStatement = "UPDATE document_st SET st_document = ? WHERE co_document = ?"
      for (var i = 0; i < documentSales.length; i++) {
        let stCollection = 0;
        if (documentSales[i].isSelected) {
          if (documentSales[i].inPaymentPartial)
            stCollection = 0;
          else //if (this.sendCollection)
            stCollection = 2;
          /* 
                    stamentenDocumentSt.push([insertStatement, [
                      documentSales[i].idDocument,
                      documentSales[i].coDocument,
                      stCollection
                    ]]); */

          stamentenDocumentSt.push([updateStatement, [
            stCollection,
            documentSales[i].coDocument,
          ]]);
        } else {
          /*  stamentenDocumentSt.push([insertStatement, [
             documentSales[i].idDocument,
             documentSales[i].coDocument,
             0
           ]]); */
          stamentenDocumentSt.push([updateStatement, [
            stCollection,
            documentSales[i].coDocument,
          ]]);
        }
      }

      return dbServ.sqlBatch(stamentenDocumentSt).then(res => {
        console.log("SE ACTUALIZARON LOS DOCUMENT ST")
        setTimeout(() => {
          return Promise.resolve(true)
        }, 1000);
        //return Promise.resolve(true)
      }).catch(e => {
        console.log(e);
        return e;
      })
    }
  }



  getDocumentIGTF(dbServ: SQLiteObject, collection: Collection) {
    return dbServ.executeSql(
      'SELECT * FROM document_sales WHERE co_collection=?', [collection.coCollection
    ]).then(data => {
      if (data.rows.length > 0) {
        let documentSales = {} as DocumentSale;
        documentSales.idDocument = data.rows.item(0).id_document;
        documentSales.idClient = data.rows.item(0).id_client;
        documentSales.coClient = data.rows.item(0).co_client;
        documentSales.idDocumentSaleType = data.rows.item(0).id_document_sale_type;
        documentSales.coDocumentSaleType = data.rows.item(0).co_document_sale_type;
        documentSales.daDocument = data.rows.item(0).da_document;
        documentSales.daDueDate = data.rows.item(0).da_due_date;

        if (data.rows.item(0).na_amount_base === null || data.rows.item(0).na_amount_base === undefined) {
          documentSales.nuAmountBase = 0;
        } else {
          documentSales.nuAmountBase = data.rows.item(0).na_amount_base;
        }

        if (data.rows.item(0).nu_amount_discount === null || data.rows.item(0).nu_amount_discount === undefined) {
          documentSales.nuAmountDiscount = 0;
        } else {
          documentSales.nuAmountDiscount = data.rows.item(0).nu_amount_discount;
        }

        if (data.rows.item(0).nu_amount_tax === null || data.rows.item(0).nu_amount_tax === undefined) {
          documentSales.nuAmountTax = 0;
        } else {
          documentSales.nuAmountTax = data.rows.item(0).nu_amount_tax;
        }
        documentSales.nuAmountTotal = data.rows.item(0).nu_amount_total;
        documentSales.nuAmountPaid = data.rows.item(0).nu_amount_paid;
        documentSales.nuBalance = data.rows.item(0).nu_balance;
        documentSales.coCurrency = data.rows.item(0).co_currency;
        documentSales.idCurrency = data.rows.item(0).id_currency;
        documentSales.nuDocument = data.rows.item(0).nu_document;
        documentSales.txComment = data.rows.item(0).tx_comment;
        documentSales.coDocument = data.rows.item(0).co_document;
        documentSales.coCollection = data.rows.item(0).co_collection;
        documentSales.nuValueLocal = data.rows.item(0).nu_value_local;
        documentSales.stDocumentSale = data.rows.item(0).st_document_sale;
        documentSales.coEnterprise = data.rows.item(0).co_enterprise;
        documentSales.idEnterprise = data.rows.item(0).id_enterprise;
        documentSales.naType = data.rows.item(0).na_type;
        documentSales.inPaymentPartial = false;
        documentSales.isSelected = false;
        documentSales.isSave = false;

        collection.document = documentSales;


      }
      return collection;
    })
  }

  getCollection(dbServ: SQLiteObject, coCollection: string) {
    return dbServ.executeSql(
      'SELECT * FROM collections WHERE co_collection = ?', [coCollection
    ]).then(res => {
      let collection = {} as Collection;
      if (res.rows.length > 0) {
        //collection.idCollection = res.rows.item(0).id_collection;
        collection.coCollection = res.rows.item(0).co_collection;
        collection.coOriginalCollection = res.rows.item(0).co_original_collection;
        collection.daCollection = res.rows.item(0).da_collection;
        collection.naResponsible = res.rows.item(0).na_responsible;
        collection.coCurrency = res.rows.item(0).co_currency;
        collection.coType = res.rows.item(0).co_type;
        collection.txComment = res.rows.item(0).tx_comment;
        collection.naClient = res.rows.item(0).lb_client;
        collection.idClient = res.rows.item(0).id_client;
        collection.coClient = res.rows.item(0).co_client;
        collection.idEnterprise = res.rows.item(0).id_enterprise;
        collection.coEnterprise = res.rows.item(0).co_enterprise;
        collection.stCollection = res.rows.item(0).st_collection;
        collection.isEdit = 0;
        collection.isEditTotal = 0;
        collection.isSave = 1;
        collection.nuValueLocal = res.rows.item(0).nu_value_local;
        //collection.idConversionType = res.rows.item(0).id_conversion_type;
        collection.idCurrency = res.rows.item(0).id_currency;
        collection.txConversion = res.rows.item(0).tx_conversion;
        collection.nuAmountTotal = res.rows.item(0).nu_amount_total == null ? 0 : res.rows.item(0).nu_amount_total;
        collection.nuAmountTotalConversion = res.rows.item(0).nu_amount_total_conversion == null ? 0 : res.rows.item(0).nu_amount_total_conversion;
        collection.nuDifference = res.rows.item(0).nu_difference == null ? 0 : res.rows.item(0).nu_difference;
        collection.nuDifferenceConversion = res.rows.item(0).nu_difference_conversion == null ? 0 : res.rows.item(0).nu_difference_conversion;
        collection.nuIgtf = res.rows.item(0).nu_igtf == null ? 0 : res.rows.item(0).nu_igtf;
        collection.nuAmountFinal = res.rows.item(0).nu_amount_final == null ? 0 : res.rows.item(0).nu_amount_final;
        collection.nuAmountFinalConversion = res.rows.item(0).nu_amount_final_conversion == null ? 0 : res.rows.item(0).nu_amount_final_conversion;
        collection.nuAmountIgtf = res.rows.item(0).nu_amount_igtf == null ? 0 : res.rows.item(0).nu_amount_igtf;
        collection.nuAmountIgtfConversion = res.rows.item(0).nu_amount_igtf_conversion == null ? 0 : res.rows.item(0).nu_amount_igtf_conversion;
        collection.nuAmountPaid = res.rows.item(0).nu_amount_paid == null ? 0 : res.rows.item(0).nu_amount_paid;
        collection.nuAmountPaidConversion = res.rows.item(0).nu_amount_paid_conversion == null ? 0 : res.rows.item(0).nu_amount_paid_conversion;
        collection.hasIGTF = res.rows.item(0).hasIGTF == undefined ? false : res.rows.item(0).hasIGTF;
        //collection.daVoucher = res.rows.item(0).daVoucher;
        collection.document = {} as DocumentSale;
        collection.coordenada = res.rows.item(0).coordenada;
        collection.hasAttachments = res.rows.item(0).has_attachments == "true" ? true : false;
        collection.nuAttachments = res.rows.item(0).nu_attachments;
        collection.collectionDetails = [] as CollectionDetail[];
        collection.collectionPayments = [] as CollectionPayment[];
      }


      if (collection.hasIGTF.toString() === "true" ? true : false) {
        return this.getDocumentIGTF(dbServ, collection).then(resp => {
          return collection
        })
      } else
        return collection;
    }).catch(e => {
      let collection = {} as Collection;
      console.log(e);
      return collection;
    })
  }

  getCollectionDetails(dbServ: SQLiteObject, coCollection: string) {
    return dbServ.executeSql(
      'SELECT * FROM collection_details WHERE co_collection=?', [coCollection
    ]).then(res => {
      let collectionDetails: CollectionDetail[] = [];
      for (var i = 0; i < res.rows.length; i++) {
        collectionDetails.push({
          //idCollectionDetail: null,
          coCollection: res.rows.item(i).co_collection,
          coDocument: res.rows.item(i).co_document,
          idDocument: res.rows.item(i).id_document,
          inPaymentPartial: res.rows.item(i).in_payment_partial,
          nuVoucherRetention: res.rows.item(i).nu_voucher_retention,
          nuAmountRetention: res.rows.item(i).nu_amount_retention,
          nuAmountRetention2: res.rows.item(i).nu_amount_retention2,
          nuAmountRetentionConversion: res.rows.item(i).nu_amount_retention_iva_conversion,
          nuAmountRetentionIvaConversion: res.rows.item(i).nu_amount_retention_iva_conversion,
          nuAmountRetention2Conversion: res.rows.item(i).nu_amount_retention_iva_conversion,
          nuAmountRetentionIslrConversion: res.rows.item(i).nu_amount_retention_islr_conversion,
          nuAmountPaid: res.rows.item(i).nu_amount_paid,
          nuAmountPaidConversion: res.rows.item(i).nu_amount_paid_conversion,
          nuAmountDiscount: res.rows.item(i).nu_amount_discount,
          nuAmountDiscountConversion: res.rows.item(i).nu_amount_discount_conversion,
          nuAmountDoc: res.rows.item(i).nu_amount_doc,
          nuAmountDocConversion: res.rows.item(i).nu_amount_doc_conversion,
          daDocument: res.rows.item(i).da_document,
          nuBalanceDoc: res.rows.item(i).nu_balance_doc,
          nuBalanceDocConversion: res.rows.item(i).nu_balance_doc_conversion,
          coOriginal: res.rows.item(i).co_original,
          coTypeDoc: res.rows.item(i).co_type_doc,
          nuValueLocal: res.rows.item(i).nu_value_local,
          nuAmountIgtf: res.rows.item(i).nu_amount_igtf,
          nuAmountIgtfConversion: res.rows.item(i).nu_amount_igtf_conversion,
          st: res.rows.item(i).st,
          isSave: true,
          daVoucher: res.rows.item(i).da_voucher == "" ? null : res.rows.item(i).da_voucher
        })
      }
      return collectionDetails;
    }).catch(e => {
      let collectionDetails: CollectionDetail[] = [];
      console.log(e);
      return collectionDetails;
    })
  }

  getCollectionPayments(dbServ: SQLiteObject, coCollection: string) {
    return dbServ.executeSql(
      'SELECT * FROM collection_payments WHERE co_collection = ?', [coCollection
    ]).then(res => {
      let collectionPayments: CollectionPayment[] = [];
      let daCollectionPayment = null;
      let daValue = null;
      for (var i = 0; i < res.rows.length; i++) {
        /* if (res.rows.item(i).da_collection_payment.split("T").length > 1) {
          daCollectionPayment = res.rows.item(i).da_collection_payment.split("T")[0] + " " + res.rows.item(i).da_collection_payment.split("T")[1]
        }
        if (res.rows.item(i).da_value.split("T").length > 1) {
          daValue = res.rows.item(i).da_value.split("T")[0] + " " + res.rows.item(i).da_value.split("T")[1]
        } */

        collectionPayments.push({
          //idCollectionPayment: null,
          /* idCollection: res.rows.item(i).id_collection, */
          coCollection: res.rows.item(i).co_collection,
          idCollectionDetail: res.rows.item(i).id_collection_detail,
          coPaymentMethod: res.rows.item(i).co_payment_method,
          idBank: res.rows.item(i).id_bank,
          nuPaymentDoc: res.rows.item(i).nu_payment_doc,
          naBank: res.rows.item(i).na_bank,
          coClientBankAccount: res.rows.item(i).co_client_bank_account,
          nuClientBankAccount: res.rows.item(i).nu_client_bank_account,
          //daValue: daValue,
          //daCollectionPayment: daCollectionPayment,
          daValue: res.rows.item(i).da_value,
          daCollectionPayment: res.rows.item(i).da_collection_payment,
          nuCollectionPayment: res.rows.item(i).nu_client_bank_account,
          newNuClientBankAccount: res.rows.item(i).newNuClientBankAccount,
          nuAmountPartial: res.rows.item(i).nu_amount_partial,
          nuAmountPartialConversion: res.rows.item(i).nu_amount_partial_conversion,
          coType: res.rows.item(i).co_type,
          st: 0,
          isSave: true,
          isAnticipoPrepaid: false
        })
      }
      return collectionPayments;
    }).catch(e => {
      let collectionPayments: CollectionPayment[] = [];
      console.log(e);
      return collectionPayments;
    })
  }

  async findCollect(dbServ: SQLiteObject) {
    this.listCollect = [] as Collection[];
    this.itemListaCobros = [] as ItemListaCobros[];

    const res = await dbServ.executeSql(
      'SELECT c.* FROM collections c ORDER BY c.id_collection DESC', []
    );

    const promises: Promise<void>[] = [];

    for (let i = 0; i < res.rows.length; i++) {
      let respCollect = {} as Collection;
      respCollect.idCollection = res.rows.item(i).id_collection;
      respCollect.coCollection = res.rows.item(i).co_collection;
      respCollect.coOriginalCollection = res.rows.item(i).co_original_collection;
      respCollect.daCollection = res.rows.item(i).da_collection;
      respCollect.daRate = res.rows.item(i).da_rate;
      respCollect.naResponsible = res.rows.item(i).na_responsible;
      respCollect.coCurrency = res.rows.item(i).co_currency;
      respCollect.coType = res.rows.item(i).co_type;
      respCollect.txComment = res.rows.item(i).tx_comment;
      respCollect.lbClient = res.rows.item(i).lb_client;
      respCollect.idClient = res.rows.item(i).id_client;
      respCollect.coClient = res.rows.item(i).co_client;
      respCollect.idEnterprise = res.rows.item(i).id_enterprise;
      respCollect.coEnterprise = res.rows.item(i).co_enterprise;
      respCollect.stCollection = res.rows.item(i).st_collection;
      respCollect.isEdit = 0;
      respCollect.isEditTotal = 0;
      respCollect.isSave = 1;
      respCollect.nuValueLocal = res.rows.item(i).nu_value_local;
      respCollect.idCurrency = res.rows.item(i).id_currency;
      respCollect.txConversion = res.rows.item(i).tx_conversion;
      respCollect.nuAmountTotal = res.rows.item(i).nu_amount_total;
      respCollect.nuAmountTotalConversion = res.rows.item(i).nu_amount_total_conversion;
      respCollect.nuDifference = res.rows.item(i).nu_difference;
      respCollect.nuDifferenceConversion = res.rows.item(i).nu_difference_conversion;
      respCollect.nuIgtf = res.rows.item(i).nu_igtf;
      respCollect.nuAmountFinal = res.rows.item(i).nu_amount_final;
      respCollect.nuAmountFinalConversion = res.rows.item(i).nu_amount_final_conversion;
      respCollect.nuAmountIgtf = res.rows.item(i).nu_amount_igtf;
      respCollect.nuAmountIgtfConversion = res.rows.item(i).nu_amount_igtf_conversion;
      respCollect.nuAmountPaid = res.rows.item(i).nu_amount_paid;
      respCollect.nuAmountPaidConversion = res.rows.item(i).nu_amount_paid_conversion;
      respCollect.hasIGTF = res.rows.item(i).hasIGTF;
      respCollect.document = {} as DocumentSale;
      respCollect.coordenada = res.rows.item(i).coordenada;
      this.listCollect.push(respCollect);

      let item = res.rows.item(i);

      // Agrega la promesa al array antes del then
      const p = this.historyTransaction.getStatusTransaction(dbServ, 3, item.id_collection).then(status => {
        let itemListaCobro = {} as ItemListaCobros;
        itemListaCobro.id_collection = item.id_collection;
        itemListaCobro.co_collection = item.co_collection;
        itemListaCobro.co_client = item.co_client;
        itemListaCobro.lb_client = item.lb_client;
        itemListaCobro.st_collection = item.st_collection;
        itemListaCobro.da_collection = item.da_collection;
        itemListaCobro.na_status = status;
        itemListaCobro.co_type = item.co_type;

        this.itemListaCobros.push(itemListaCobro);
      });
      promises.push(p);
    }

    await Promise.all(promises);
    return this.itemListaCobros;
  }

  //var updateStatement = 'UPDATE document_st SET st_document = 0 where co_document in (SELECT co_document FROM collection_detail where co_collection= ?)';

  updateDocumentStForDelete(dbServ: SQLiteObject, coCollection: string) {
    return dbServ.executeSql(
      "UPDATE document_st SET st_document = 0 WHERE co_document IN " +
      "(SELECT co_document FROM collection_details WHERE co_collection = ?)", [coCollection]).then(res => {
        return Promise.resolve(true);
      }).catch(e => {
        return Promise.resolve(true);
      })
  }

  deleteCollection(dbServ: SQLiteObject, coCollection: string) {
    return dbServ.executeSql(
      "DELETE FROM collections WHERE co_collection = ?", [coCollection]).then(res => {
        this.updateDocumentStForDelete(dbServ, coCollection).then(resp => {
          this.deleteCollectionDetails(dbServ, coCollection);
        })
        return Promise.resolve(true);
      }).catch(e => {
        let collection = {} as Collection;
        console.log(e);
        return Promise.resolve(true);
      })
  }

  deleteCollectionDetails(dbServ: SQLiteObject, coCollection: string) {
    return dbServ.executeSql(
      "DELETE FROM collection_details WHERE co_collection = ?", [coCollection]).then(res => {
        this.deleteCollectionPayments(dbServ, coCollection);
        return Promise.resolve(true);
      }).catch(e => {
        let collection = {} as Collection;
        console.log(e);
        return Promise.resolve(true);
      })
  }
  deleteCollectionPayments(dbServ: SQLiteObject, coCollection: string) {
    return dbServ.executeSql(
      "DELETE FROM collection_payments WHERE co_collection = ?", [coCollection]).then(res => {
        return Promise.resolve(true);
      }).catch(e => {
        let collection = {} as Collection;
        console.log(e);
        return Promise.resolve(true);
      })
  }


  public async convertAmount(
    value: number,
    from: 'local' | 'hard',
    to: 'local' | 'hard',
    coTypeDoc: string,
    nuValueLocalDoc: number
  ): Promise<number> {
    let tasa = 0;
    if (nuValueLocalDoc == 0)
      tasa = this.getNuValueLocal();
    else
      tasa = nuValueLocalDoc;

    if (value > 0)
      tasa = this.collection.nuValueLocal;

    if (from === to) return value;

    if (to === 'local') {
      // Si tu método es síncrono, puedes dejarlo así
      return this.currencyService.toLocalCurrencyByNuValueLocal(value, coTypeDoc, tasa);
    } else {
      // Espera la llamada asíncrona
      return this.currencyService.toHardCurrencyByNuValueLocal(value, coTypeDoc, tasa);
    }
  }

  public async toHardCurrencyByNuValueLocal(localAmount: number, coTypeDoc: string, nuValueLocal: number
  ): Promise<number> {
    // Si necesitas lógica asíncrona, usa await aquí
    if (nuValueLocal == null)
      return 0;
    else if (localAmount < 0) {
      this.calculateDifference = true;
      return nuValueLocal;
    } else {
      this.calculateDifference = false;
      return (localAmount * 1) / nuValueLocal;
    }
  }

  // Helper para asegurar valores numéricos
  public ensureNumber(obj: any, prop: string) {
    if (obj[prop] == null || obj[prop] == undefined) obj[prop] = 0;
  }

  public toLocal(value: number): number {
    return this.currencyService.toLocalCurrency(value);
  }

  public toHard(value: number): number {
    return this.currencyService.toHardCurrency(value);
  }

  public updateBalancesOnPartialPay(index: number) {
    const backup = this.documentSalesBackup[index];

    if (this.currencySelected.localCurrency.toString() === 'true') {
      if (this.currencySelectedDocument.localCurrency.toString() === 'true') {
        this.amountPaid = backup.nuBalance;
      } else {
        this.amountPaid = this.currencyService.toLocalCurrency(backup.nuBalance);
        //this.documentSales[index].nuBalance = this.currencyService.toLocalCurrency(backup.nuBalance);
      }
    } else {
      if (this.currencySelectedDocument.hardCurrency.toString() === 'true') {
        this.amountPaid = backup.nuBalance;
      } else {
        this.amountPaid = this.currencyService.toHardCurrency(backup.nuBalance);
        // this.documentSales[index].nuBalance = this.currencyService.toHardCurrency(backup.nuBalance);
      }
    }
    this.amountPaid = this.cleanFormattedNumber(this.currencyService.formatNumber(this.amountPaid));
  }

  public isRetentionInvalid(nuAmountRetention: number, nuAmountRetention2: number, nuBalance: number): boolean {
    const suma = nuAmountRetention + nuAmountRetention2;
    return suma > nuBalance || suma < 0 || (nuAmountRetention === 0 && nuAmountRetention2 === 0);
  }

  restoreDocumentSaleState(index: number) {
    // Copia los datos de documentSales[index] a documentSaleOpen y documentSalesBackup[index]
    const original = { ...this.documentSalesBackup[index] };
    this.documentSaleOpen = { ...original };
    this.documentSales[index] = { ...original };

  }

  public copyDocumentSaleOpenToSalesAndDetails() {
    const open = this.documentSaleOpen;
    const idx = this.indexDocumentSaleOpen;
    const detailIdx = open.positionCollecDetails;

    // Copia a documentSales
    this.documentSales[idx].inPaymentPartial = this.isPaymentPartial;
    this.documentSales[idx].isSave = true;
    this.documentSalesBackup[idx].inPaymentPartial = this.isPaymentPartial;
    this.documentSalesBackup[idx].isSave = true;
    // this.documentSales[idx] = { ...open, inPaymentPartial: this.isPaymentPartial, isSave: true };`
    // this.documentSalesBackup[idx] = { ...open, inPaymentPartial: this.isPaymentPartial, isSave: true };`

    // Copia a collectionDetails
    const detail = this.collection.collectionDetails[detailIdx];
    if (detail) {
      detail.nuAmountDiscount = open.nuAmountDiscount;
      detail.nuAmountPaid = this.amountPaid;
      detail.nuAmountPaidConversion = this.amountPaidConversion;
      detail.nuBalanceDoc = open.nuBalance;
      detail.daVoucher = open.daVoucher;
      detail.nuAmountRetention = open.nuAmountRetention;
      detail.nuAmountRetention2 = open.nuAmountRetention2;
      detail.nuVoucherRetention = open.nuVaucherRetention;
      detail.nuValueLocal = open.nuValueLocal;
      // ...otros campos...
    }
  }

  async printAllTransactionStatuses(dbServ: SQLiteObject) {
    return this.historyTransaction.printAllTransactionStatuses(dbServ).then(statuses => {
      console.log("Transaction Statuses:", statuses);
      return statuses;
    }).catch(error => {
      console.error("Error fetching transaction statuses:", error);
      return [];
    });
  }

}