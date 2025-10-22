import { Input, inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CollectionService } from 'src/app/services/collection/collection-logic.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { Collection, CollectionDetail, CollectionPayment } from 'src/app/modelos/tables/collection';
import { PagoEfectivo } from 'src/app/modelos/pago-efectivo';
import { PagoCheque } from 'src/app/modelos/pago-cheque';
import { PagoDeposito } from 'src/app/modelos/pago-deposito';
import { PagoTransferencia } from 'src/app/modelos/pago-transferencia';
import { PagoOtros } from 'src/app/modelos/pago-otros';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { TiposPago } from 'src/app/modelos/tipos-pago';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BankAccount } from 'src/app/modelos/tables/bankAccount';

@Component({
  selector: 'app-cobro-pagos',
  templateUrl: './cobro-pagos.component.html',
  styleUrls: ['./cobro-pagos.component.scss'],
  standalone: false
})
export class CobroPagosComponent implements OnInit {

  public collectService = inject(CollectionService);
  public globalConfig = inject(GlobalConfigService);
  public currencyService = inject(CurrencyService)
  public dateServ = inject(DateServiceService);

  public collectionPayment!: CollectionPayment;

  public alertMessageOpen: Boolean = false;
  public showEventModal: Boolean = false;
  public listBankAccount!: any;
  // estado por uid
  private centsMap: { [uid: string]: number } = {};
  private displayMap: { [uid: string]: string } = {};
  private __uidCounter = 0;
  // debounce timers por uid para evitar ejecutar la validación mientras se escribe
  private debounceTimers: { [uid: string]: any } = {};
  private debounceDelay = 800; // ms - ajustar si quieres más/menos espera

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

  constructor() {
    if (isNaN(this.collectService.montoTotalPagar))
      this.collectService.montoTotalPagar = 0;
  }

  ngOnInit() {
    this.alertButtons[0].text = this.collectService.collectionTagsDenario.get('DENARIO_BOTON_ACEPTAR')!
  }

  addTipoPago(type: string) {
    this.collectService.lengthMethodPaid++;
    this.collectService.collection.collectionPayments[this.collectService.collection.collectionPayments.length] = new CollectionPayment;
    this.collectService.collection.collectionPayments[this.collectService.collection.collectionPayments.length - 1].coCollection = this.collectService.collection.coCollection;
    this.collectService.tiposPago.forEach(tp => tp.selected = false);
    switch (type) {
      case "ef": {
        let newPagoEfectivo: PagoEfectivo = new PagoEfectivo;
        newPagoEfectivo.posCollectionPayment = this.collectService.collection.collectionPayments!.length - 1;
        this.collectService.pagoEfectivo.push(newPagoEfectivo);
        break
      }

      case "ch": {
        let newPagoCheque: PagoCheque = new PagoCheque;
        newPagoCheque.posCollectionPayment = this.collectService.collection.collectionPayments!.length - 1;

        if (this.collectService.validateCollectionDate) {
          newPagoCheque.fecha = this.collectService.dateRate + " 00:00:00";
          newPagoCheque.fechaValor = this.collectService.dateRate + " 00:00:00";
        } else {
          newPagoCheque.fecha = this.dateServ.hoyISO();
          newPagoCheque.fechaValor = this.dateServ.hoyISO();
        }

        this.collectService.pagoCheque.push(newPagoCheque);
        break;
      }

      case "de": {
        let newPagoDeposito: PagoDeposito = new PagoDeposito;
        newPagoDeposito.posCollectionPayment = this.collectService.collection.collectionPayments!.length - 1;

        if (this.collectService.validateCollectionDate) {
          newPagoDeposito.fecha = this.collectService.dateRate + " 00:00:00";
        } else {
          newPagoDeposito.fecha = this.dateServ.hoyISO();
        }
        this.collectService.pagoDeposito.push(newPagoDeposito);
        break
      }

      case "tr": {
        let newPagoTransferencia: PagoTransferencia = new PagoTransferencia;
        newPagoTransferencia.posCollectionPayment = this.collectService.collection.collectionPayments!.length - 1;

        if (this.collectService.validateCollectionDate) {
          newPagoTransferencia.fecha = this.collectService.dateRate + " 00:00:00";
        } else {
          newPagoTransferencia.fecha = this.dateServ.hoyISO();
        }

        this.collectService.pagoTransferencia.push(newPagoTransferencia);
        break;
      }

      case "ot": {
        let newPagoOtros: PagoOtros = new PagoOtros;
        newPagoOtros.posCollectionPayment = this.collectService.collection.collectionPayments!.length - 1;
        this.collectService.pagoOtros.push(newPagoOtros);
        break;
      }
    }
  }

  deleteTipoPago(index: number, type: string) {
    if (this.collectService.disabledSelectCollectMethodDisabled)
      this.collectService.disabledSelectCollectMethodDisabled = false;

    this.collectService.lengthMethodPaid--;
    this.collectService.anticipoAutomatico = [];

    // Diccionario para mapear tipo a arrays y propiedades
    type TipoPagoKey = 'ef' | 'ch' | 'de' | 'tr' | 'ot';
    const map: Record<TipoPagoKey, any[]> = {
      ef: this.collectService.pagoEfectivo,
      ch: this.collectService.pagoCheque,
      de: this.collectService.pagoDeposito,
      tr: this.collectService.pagoTransferencia,
      ot: this.collectService.pagoOtros,
    };

    if (!['ef', 'ch', 'de', 'tr', 'ot'].includes(type)) return;
    const pagoArray = map[type as TipoPagoKey];
    if (!pagoArray) return;

    const monto = pagoArray[index].monto;
    this.collectService.collection.nuAmountFinal -= monto;
    this.collectService.collection.nuAmountTotal -= monto;
    this.collectService.collection.nuDifference -= monto;

    this.collectService.collection.nuAmountFinalConversion = this.collectService.convertirMonto(
      this.collectService.collection.nuAmountFinal, 0, this.collectService.collection.coCurrency
    );
    this.collectService.collection.nuAmountTotalConversion = this.collectService.convertirMonto(
      this.collectService.collection.nuAmountTotal, 0, this.collectService.collection.coCurrency
    );

    this.collectService.collection.collectionPayments!.splice(pagoArray[index].posCollectionPayment, 1);

    this.collectService.bankAccountSelected.splice(pagoArray[index].posCollectionPayment, 1)
    pagoArray.splice(index, 1);
    pagoArray.forEach((pago, i) => {
      pago.posCollectionPayment -= 1;
    });

    if (pagoArray.length > 0)
      this.collectService.validateToSend();

    if (this.collectService.collection.collectionPayments.length == 0)
      this.collectService.onCollectionValidToSend(false);
  }

  getFecha(fecha: string, index: number, type: string) {

    switch (type) {
      case "ef": {
        break
      }

      case "ch": {
        this.collectService.pagoCheque[index].fecha = fecha + " 00:00:00";

        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.daCollectionPayment = fecha + " 00:00:00";
        this.collectService.validateToSend();
        break;
      }

      case "de": {
        this.collectService.pagoDeposito[index].fecha = fecha;
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.daCollectionPayment = fecha.split("T")[0] + " " + fecha.split("T")[1];;
        this.collectService.validateToSend();
        break;
      }

      case "tr": {
        this.collectService.pagoTransferencia[index].fecha = fecha;
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.daCollectionPayment = fecha.split("T")[0] + " " + fecha.split("T")[1];;
        this.collectService.validateToSend();
        break;
      }

      case "ot": {
        this.collectService.validateToSend();
        break;
      }
    }
  }

  getFechaValor(fecha: string, index: number, type: string) {

    switch (type) {
      case "ef": {
        break
      }

      case "ch": {
        if (this.collectService.validateCollectionDate) {
          this.collectService.pagoCheque[index].fechaValor = this.collectService.dateRate + " 00:00:00";
        } else {
          this.collectService.pagoCheque[index].fechaValor = fecha + " 00:00:00";
          fecha = fecha + " 00:00:00";
        }


        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.daValue = fecha.split("T")[0] + " " + fecha.split("T")[1];;
        this.collectService.validateToSend();
        break;
      }

      case "de": {
        if (this.collectService.validateCollectionDate) {
          this.collectService.pagoDeposito[index].fecha = this.collectService.dateRate + " 00:00:00";
        } else {
          this.collectService.pagoDeposito[index].fecha = fecha + " 00:00:00";
          fecha = fecha + " 00:00:00";
        }

        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.daValue = fecha.split("T")[0] + " " + fecha.split("T")[1];;
        this.collectService.validateToSend();
        break
      }

      case "tr": {
        if (this.collectService.validateCollectionDate) {
          this.collectService.pagoTransferencia[index].fecha = this.collectService.dateRate + " 00:00:00";
        } else {
          this.collectService.pagoTransferencia[index].fecha = fecha + " 00:00:00";
          fecha = fecha + " 00:00:00";
        }


        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.daCollectionPayment = fecha.split("T")[0] + " " + fecha.split("T")[1];;
        this.collectService.validateToSend();
        break;
      }

      case "ot": {
        this.collectService.validateToSend();
        break;
      }
    }


  }

  selectBankAccount(index: number, type: string,) {

    switch (type) {
      case "ef": {
        this.collectService.collection.collectionPayments![this.collectService.pagoEfectivo[index].posCollectionPayment]!.coCollection! = this.collectService.collection.coCollection;
        this.validatePayment("ef", index);

        break
      }

      case "ch": {

        if (this.collectService.clientBankAccount) {
          if (this.collectService.pagoCheque[index].nombreBanco == "Nueva Cuenta") {
            this.collectService.showNuevaCuenta = true;
          } else {
            this.collectService.showNuevaCuenta = false;
            this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.coClientBankAccount!
              = this.collectService.pagoCheque[index].nombreBanco;

            this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.newNuClientBankAccount = "";
          }
        } else {
          this.collectService.showNuevaCuenta = false;
        }

        if (this.collectService.validateCollectionDate) {
          //LA FECHA DE LOS PAGOS DEBE SER LA MISMA QUE LA FECHA DE LA TASA
          this.collectService.pagoCheque[index].fecha = this.collectService.dateRate + " 00:00:00";

          this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.daCollectionPayment!
            = this.collectService.dateRate + " 00:00:00";

          this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.daValue!
            = this.collectService.dateRate + " 00:00:00";

          this.collectService.enableDate = true;

        } else {
          this.collectService.pagoCheque[index].fecha = this.dateServ.hoyISO();

          this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.daCollectionPayment!
            = this.collectService.pagoCheque[index].fecha.split("T")[0] + " " + this.collectService.pagoCheque[index].fecha.split("T")[1];

          this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.daValue!
            = this.collectService.pagoCheque[index].fecha.split("T")[0] + " " + this.collectService.pagoCheque[index].fecha.split("T")[1];

          this.collectService.enableDate = false;

        }
        this.collectService.pagoCheque[index].fechaValor = this.dateServ.hoyISO();
        this.collectService.pagoCheque[index].disabled = false;


        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.coCollection!
          = this.collectService.collection.coCollection;


        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.coClientBankAccount
          = this.collectService.pagoCheque[index].nombreBanco;

        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.naBank
          = this.collectService.pagoCheque[index].nombreBanco;

        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.nuClientBankAccount
          = this.collectService.pagoCheque[index].nombreBanco;

        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.coPaymentMethod
          = type;

        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.coType = type;


        this.validatePayment("ch", index);

        break;
      }

      case "de": {
        console.log(this.collectService.bankAccountSelected);
        this.collectService.pagoDeposito[index].idBanco = this.collectService.bankAccountSelected[this.collectService.pagoDeposito[index].posCollectionPayment].idBank;
        this.collectService.pagoDeposito[index].nombreBanco = this.collectService.bankAccountSelected[this.collectService.pagoDeposito[index].posCollectionPayment].nameBank;
        this.collectService.pagoDeposito[index].numeroCuenta = this.collectService.bankAccountSelected[this.collectService.pagoDeposito[index].posCollectionPayment].nuAccount;

        if (this.collectService.validateCollectionDate) {
          //LA FECHA DE LOS PAGOS DEBE SER LA MISMA QUE LA FECHA DE LA TASA
          this.collectService.pagoDeposito[index].fecha = this.collectService.dateRate + " 00:00:00";

          this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.daCollectionPayment!
            = this.collectService.dateRate + " 00:00:00";

          this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.daValue!
            = this.collectService.dateRate + " 00:00:00";

          this.collectService.enableDate = true;

        } else {
          this.collectService.pagoDeposito[index].fecha = this.dateServ.hoyISO();

          this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.daCollectionPayment!
            = this.collectService.pagoDeposito[index].fecha.split("T")[0] + " " + this.collectService.pagoDeposito[index].fecha.split("T")[1];

          this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.daValue!
            = this.collectService.pagoDeposito[index].fecha.split("T")[0] + " " + this.collectService.pagoDeposito[index].fecha.split("T")[1];

          this.collectService.enableDate = false;

        }

        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.coCollection! = this.collectService.collection.coCollection;
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.coPaymentMethod = type;
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.idBank = this.collectService.pagoDeposito[index].idBanco;
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.naBank = this.collectService.pagoDeposito[index].nombreBanco;
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.nuClientBankAccount = this.collectService.pagoDeposito[index].numeroCuenta;
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.coType = type;

        this.collectService.pagoDeposito[index].disabled = false;
        this.validatePayment("de", index);
        break
      }

      case "tr": {
        this.collectService.pagoTransferencia[index].idBanco = this.collectService.bankAccountSelected[this.collectService.pagoTransferencia[index].posCollectionPayment].idBank;
        this.collectService.pagoTransferencia[index].nombreBanco = this.collectService.bankAccountSelected[this.collectService.pagoTransferencia[index].posCollectionPayment].nameBank;
        this.collectService.pagoTransferencia[index].numeroCuenta = this.collectService.bankAccountSelected[this.collectService.pagoTransferencia[index].posCollectionPayment].nuAccount;
        //
        if (this.collectService.clientBankAccount) {
          if (this.collectService.pagoTransferencia[index].numeroCuenta == "Nueva Cuenta") {
            this.collectService.showNuevaCuenta = true;
          } else {
            this.collectService.showNuevaCuenta = false;
            this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.coClientBankAccount!
              = this.collectService.pagoTransferencia[index].nombreBanco;

            this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.newNuClientBankAccount = "";
          }
        } else {
          this.collectService.showNuevaCuenta = false;
        }




        if (this.collectService.validateCollectionDate) {
          //LA FECHA DE LOS PAGOS DEBE SER LA MISMA QUE LA FECHA DE LA TASA
          this.collectService.pagoTransferencia[index].fecha = this.collectService.dateRate + " 00:00:00";

          this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.daCollectionPayment!
            = this.collectService.dateRate + " 00:00:00";

          this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.daValue!
            = this.collectService.dateRate + " 00:00:00";

          this.collectService.enableDate = true;

        } else {


          this.collectService.pagoTransferencia[index].fecha = this.dateServ.hoyISO();

          this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.daCollectionPayment!
            = this.collectService.pagoTransferencia[index].fecha.split("T")[0] + " " + this.collectService.pagoTransferencia[index].fecha.split("T")[1];

          this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.daValue!
            = this.collectService.pagoTransferencia[index].fecha.split("T")[0] + " " + this.collectService.pagoTransferencia[index].fecha.split("T")[1];

          this.collectService.enableDate = false;

        }

        this.collectService.pagoTransferencia[index].fecha = this.dateServ.hoyISO();
        this.collectService.pagoTransferencia[index].disabled = false;

        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.coCollection! = this.collectService.collection.coCollection;
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.coPaymentMethod = type;

        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.coType = type


        this.validatePayment("tr", index);
        break;
      }

      case "ot": {
        this.validatePayment("ot", index);
        break;
      }
    }
  }

  onOpenCalendar(i: number, type: string) {

    switch (type) {
      case "ef": {
        break
      }

      case "ch": {

        break;
      }

      case "de": {
        this.collectService.pagoDeposito[i].fecha = this.dateServ.hoyISO();
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[i].posCollectionPayment]!.daCollectionPayment
          = this.collectService.pagoDeposito[i].fecha.split("T")[0] + " " + this.collectService.pagoDeposito[i].fecha.split("T")[1];;
        this.collectService.validateToSend();
        break
      }

      case "tr": {
        this.collectService.pagoTransferencia[i].fecha = this.dateServ.hoyISO();
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[i].posCollectionPayment]!.daCollectionPayment
          = this.collectService.pagoTransferencia[i].fecha.split("T")[0] + " " + this.collectService.pagoTransferencia[i].fecha.split("T")[1];;
        this.collectService.validateToSend();
        break;
      }

      case "ot": {

        break;
      }
    }
  }

  setMonto(monto: number, index: number, type: string) {
    switch (type) {
      case "ef": {
        this.collectService.pagoEfectivo[index].monto = monto;

        this.collectService.pagoEfectivo[index].montoConversion = this.collectService.convertirMonto(monto, 0, this.collectService.collection.coCurrency);

        this.collectService.pagoEfectivo[index].fecha = this.dateServ.hoyISO();
        this.collectService.collection.collectionPayments![this.collectService.pagoEfectivo[index].posCollectionPayment]!.coType = type
        this.collectService.collection.collectionPayments![this.collectService.pagoEfectivo[index].posCollectionPayment]!.coPaymentMethod = type;
        this.collectService.collection.collectionPayments![this.collectService.pagoEfectivo[index].posCollectionPayment]!.nuAmountPartial = monto;
        this.collectService.collection.collectionPayments![this.collectService.pagoEfectivo[index].posCollectionPayment]!.nuAmountPartialConversion
          = this.collectService.convertirMonto(monto, 0, this.collectService.collection.coCurrency);

        this.collectService.collection.collectionPayments![this.collectService.pagoEfectivo[index].posCollectionPayment]!.daCollectionPayment
          = this.collectService.collection.collectionPayments![this.collectService.pagoEfectivo[index].posCollectionPayment]!.daValue
          = this.collectService.pagoEfectivo[index].fecha.split("T")[0] + " " + this.collectService.pagoEfectivo[index].fecha.split("T")[1];
        this.validatePayment("ef", index);
        break
      }

      case "ch": {
        this.collectService.pagoCheque[index].monto = monto;
        this.collectService.pagoCheque[index].montoConversion = this.collectService.convertirMonto(monto, 0, this.collectService.collection.coCurrency);
        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.nuAmountPartial = monto;
        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.nuAmountPartialConversion
          = this.collectService.convertirMonto(monto, 0, this.collectService.collection.coCurrency);
        this.validatePayment("ch", index);
        break;
      }

      case "de": {
        this.collectService.pagoDeposito[index].monto = monto;
        this.collectService.pagoDeposito[index].montoConversion = this.collectService.convertirMonto(monto, 0, this.collectService.collection.coCurrency);
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.nuAmountPartial = monto;
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.nuAmountPartialConversion
          = this.collectService.convertirMonto(monto, 0, this.collectService.collection.coCurrency);
        this.validatePayment("de", index);
        break
      }

      case "tr": {
        this.collectService.pagoTransferencia[index].monto = monto;
        this.collectService.pagoTransferencia[index].montoConversion = this.collectService.convertirMonto(monto, 0, this.collectService.collection.coCurrency);
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.nuAmountPartial = monto;
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.nuAmountPartialConversion
          = this.collectService.convertirMonto(monto, 0, this.collectService.collection.coCurrency);
        this.validatePayment("tr", index);
        break;
      }

      case "ot": {
        this.collectService.pagoOtros[index].monto = monto;
        this.collectService.pagoOtros[index].montoConversion = this.collectService.convertirMonto(monto, 0, this.collectService.collection.coCurrency);
        this.collectService.collection.collectionPayments![this.collectService.pagoOtros[index].posCollectionPayment]!.nuAmountPartial = monto;

        this.collectService.collection.collectionPayments![this.collectService.pagoOtros[index].posCollectionPayment]!.coType = type
        this.collectService.collection.collectionPayments![this.collectService.pagoOtros[index].posCollectionPayment]!.coPaymentMethod = type;

        this.collectService.collection.collectionPayments![this.collectService.pagoOtros[index].posCollectionPayment]!.nuAmountPartialConversion =
          this.collectService.convertirMonto(monto, 0, this.collectService.collection.coCurrency);

        this.collectService.collection.collectionPayments![this.collectService.pagoOtros[index].posCollectionPayment]!.daCollectionPayment
          = this.collectService.collection.collectionPayments![this.collectService.pagoOtros[index].posCollectionPayment]!.daValue
          = this.dateServ.hoyISOFullTime();

        this.validatePayment("ot", index);
        break;
      }
    }

    this.collectService.collection.nuAmountFinal = 0;
    this.collectService.collection.nuAmountTotal = 0;
    for (var i = 0; i < this.collectService.collection.collectionPayments!.length; i++) {
      this.collectService.collection.nuAmountFinal += this.collectService.collection.collectionPayments![i].nuAmountPartial;
      this.collectService.collection.nuAmountTotal += this.collectService.collection.collectionPayments![i].nuAmountPartial;
    }

    this.collectService.collection.nuAmountFinalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountFinal, 0, this.collectService.collection.coCurrency);
    this.collectService.collection.nuAmountTotal = this.collectService.convertirMonto(this.collectService.collection.nuAmountTotal, 0, this.collectService.collection.coCurrency);

  }

  setNroTransanccion(nroTrans: string, index: number, type: string) {

    nroTrans = this.collectService.cleanString(nroTrans);

    switch (type) {
      case "ef": {
        this.collectService.pagoEfectivo[index].nuRecibo = nroTrans;
        this.collectService.collection.collectionPayments![this.collectService.pagoEfectivo[index].posCollectionPayment]!.nuPaymentDoc = nroTrans;
        if (this.collectService.pagoEfectivo[index].monto > 0 && this.collectService.pagoEfectivo[index].nuRecibo != "")
          this.collectService.validateToSend();

        break
      }

      case "ch": {
        this.collectService.pagoCheque[index].numeroCheque = nroTrans;
        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.nuPaymentDoc = nroTrans;
        this.validatePayment("ch", index);

        break;
      }

      case "de": {
        this.collectService.pagoDeposito[index].numeroDeposito = nroTrans;
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.nuPaymentDoc = nroTrans;
        this.validatePayment("de", index);

        break
      }

      case "tr": {
        this.collectService.pagoTransferencia[index].numeroTransferencia = nroTrans;
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.nuPaymentDoc = nroTrans;
        this.validatePayment("tr", index);

        break;
      }

      case "ot": {
        this.collectService.pagoOtros[index].nombre = nroTrans;
        this.collectService.collection.collectionPayments![this.collectService.pagoOtros[index].posCollectionPayment]!.nuPaymentDoc = nroTrans;
        if (this.collectService.pagoOtros[index].monto > 0 && this.collectService.pagoOtros[index].nombre != "")
          this.validatePayment("ot", index);

        break;
      }
    }

    this.collectService.validateReferencePayment();

  }

  setNuevaCuenta(dato: string, index: number, type: string) {

    switch (type) {
      case "ef": {
        this.collectService.collection.collectionPayments![this.collectService.pagoEfectivo[index].posCollectionPayment]!.newNuClientBankAccount = dato;
        this.collectService.collection.collectionPayments![this.collectService.pagoEfectivo[index].posCollectionPayment]!.nuClientBankAccount = dato;
        break
      }

      case "ch": {
        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.newNuClientBankAccount = dato;
        this.collectService.collection.collectionPayments![this.collectService.pagoCheque[index].posCollectionPayment]!.nuClientBankAccount = dato;
        break;
      }

      case "de": {
        this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.newNuClientBankAccount = dato;
        //this.collectService.collection.collectionPayments![this.collectService.pagoDeposito[index].posCollectionPayment]!.nuClientBankAccount = dato;
        break
      }

      case "tr": {
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.newNuClientBankAccount = dato;
        //this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.nuClientBankAccount = dato;;
        break;
      }

      case "ot": {
        break;
      }
    }

  }
  imprimir() {
    console.log(this.collectService.collection)
  }

  addCollectMethod(e: any) {
    this.showEventModal = true;
    this.addTipoPago(e.target.value.type);
  }

  onAceptarTiposPago() {
    // Obtiene todos los tipos de pago seleccionados
    const seleccionados = this.collectService.tiposPago.filter(tp => tp.selected);
    // Llama a addCollectMethod por cada tipo seleccionado
    seleccionados.forEach(tp => this.addCollectMethod({ target: { value: tp } }));
    this.setShowEventModal(false);
  }

  checkPaymentPartialPay() {
    if (this.collectService.existPartialPayment)
      if (this.collectService.montoTotalPagado != this.collectService.montoTotalPagar) {
        this.collectService.mensaje = "Existe al menos un pago parcial, el monto pagado debe ser igual al monto a pagar";
        this.alertMessageOpen = true;
        this.collectService.onCollectionValidToSend(false)
      }
  }
  checkCreateAutomatedPrepaid() {
    if (!this.collectService.recentOpenCollect) {
      this.collectService.mensaje = this.collectService.collectionTags.get('COB_MSG_AUTOMATED_PREPAID')! + " " + this.currencyService.formatNumber(this.collectService.collection.nuDifference);
      this.alertMessageOpen = true;
    }
  }


  validatePayment(type: string, index: number) {
    this.collectService.alertMessageOpen = false;
    switch (type) {
      case "ef": {
        if (this.collectService.pagoEfectivo[index].monto >= 0) {
          this.collectService.calcularMontos(type, index).then(resp => {
            if (this.collectService.createAutomatedPrepaid)
              this.checkCreateAutomatedPrepaid();

            this.checkPaymentPartialPay();
            this.collectService.validateToSend();
            /*  if (this.collectService.pagoEfectivo[index].nuRecibo != "") {
               this.collectService.validateToSend();
             } */
          })
        }

        break
      }
      case "ch": {

        /* if (this.collectService.pagoCheque[index].fecha != "" && this.collectService.pagoCheque[index].fechaValor != "" && this.collectService.pagoCheque[index].monto > 0
          && this.collectService.pagoCheque[index].nombreBanco != "" && this.collectService.pagoCheque[index].nuevaCuenta != ""
          && this.collectService.pagoCheque[index].numeroCheque != "") {
          this.collectService.validateToSend();
        } */
        if (this.collectService.pagoCheque[index].monto >= 0) {
          this.collectService.calcularMontos(type, index).then(resp => {
            if (this.collectService.pagoCheque[index].fecha != ""
              && this.collectService.pagoCheque[index].fechaValor != ""
              && this.collectService.pagoCheque[index].nombreBanco != ""
              && this.collectService.pagoCheque[index].numeroCheque != "") {
              if (this.collectService.createAutomatedPrepaid)
                this.checkCreateAutomatedPrepaid();
              this.checkPaymentPartialPay();
              this.collectService.validateToSend();
            }
          })
        }

        break
      }

      case "de": {
        /* if (this.collectService.pagoDeposito[index].fecha != "" && this.collectService.pagoDeposito[index].monto > 0
          && this.collectService.pagoDeposito[index].nombreBanco != "" && this.collectService.pagoDeposito[index].numeroCuenta != ""
          && this.collectService.pagoDeposito[index].numeroDeposito != "") {
          this.collectService.validateToSend();
        } */
        if (this.collectService.pagoDeposito[index].monto >= 0) {
          this.collectService.calcularMontos(type, index).then(resp => {
            if (this.collectService.pagoDeposito[index].fecha != ""
              && this.collectService.pagoDeposito[index].nombreBanco != ""
              && this.collectService.pagoDeposito[index].numeroCuenta != ""
              && this.collectService.pagoDeposito[index].numeroDeposito != "") {
              if (this.collectService.createAutomatedPrepaid)
                this.checkCreateAutomatedPrepaid();
              this.checkPaymentPartialPay();
              this.collectService.validateToSend();
            }
          })
        }
        break;
      }

      case "tr": {
        /* if (this.collectService.pagoTransferencia[index].fecha != "" && this.collectService.pagoTransferencia[index].monto > 0
          && this.collectService.pagoTransferencia[index].nombreBanco != "" && this.collectService.pagoTransferencia[index].nuevaCuenta != ""
          && this.collectService.pagoTransferencia[index].numeroTransferencia != "") {
          this.collectService.validateToSend();
        } */
        if (this.collectService.clientBankAccount) {
          if (this.collectService.pagoTransferencia[index].monto >= 0) {
            this.collectService.calcularMontos(type, index).then(resp => {
              if (this.collectService.pagoTransferencia[index].fecha != ""
                && this.collectService.pagoTransferencia[index].nombreBanco != ""
                && this.collectService.pagoTransferencia[index].nuevaCuenta != ""
                && this.collectService.pagoTransferencia[index].numeroTransferencia != "") {
                if (this.collectService.createAutomatedPrepaid)
                  this.checkCreateAutomatedPrepaid();
                this.checkPaymentPartialPay();
                this.collectService.validateToSend();
              }
            })
          }
        } else {
          if (this.collectService.pagoTransferencia[index].monto >= 0) {
            this.collectService.calcularMontos(type, index).then(resp => {
              if (this.collectService.pagoTransferencia[index].fecha != ""
                && this.collectService.pagoTransferencia[index].nombreBanco != ""
                && this.collectService.pagoTransferencia[index].numeroTransferencia != "") {
                if (this.collectService.createAutomatedPrepaid)
                  this.checkCreateAutomatedPrepaid();
                this.checkPaymentPartialPay();
                this.collectService.validateToSend();
              }
            })
          }
        }

        break;
      }

      case "ot": {
        if (this.collectService.pagoOtros[index].monto >= 0) {
          this.collectService.calcularMontos(type, index).then(resp => {
            if (this.collectService.pagoOtros[index].nombre != "") {
              this.checkPaymentPartialPay();
              this.collectService.validateToSend();
            }
          })
        }
        /*  if (this.collectService.pagoOtros[index].monto > 0 && this.collectService.pagoOtros[index].nombre != "") {
           this.collectService.validateToSend();
         } */
        break;
      }
    }
  }

  selectListBankAccount(index: number, type: string,) {

    switch (type) {
      case "ef": {

        break
      }
      case "ch": {



        break
      }

      case "de": {


        break;
      }

      case "tr": {
        this.collectService.pagoTransferencia[index].idBanco = this.collectService.bankAccountSelected[this.collectService.pagoTransferencia[index].posCollectionPayment].idBank;
        this.collectService.pagoTransferencia[index].nombreBanco = this.collectService.bankAccountSelected[this.collectService.pagoTransferencia[index].posCollectionPayment].nameBank;
        this.collectService.pagoTransferencia[index].numeroCuenta = this.collectService.bankAccountSelected[this.collectService.pagoTransferencia[index].posCollectionPayment].nuAccount;
        //
        if (this.collectService.validateCollectionDate) {
          //LA FECHA DE LOS PAGOS DEBE SER LA MISMA QUE LA FECHA DE LA TASA
          this.collectService.pagoTransferencia[index].fecha = this.collectService.dateRate + " 00:00:00";

          this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.daCollectionPayment!
            = this.collectService.dateRate + " 00:00:00";

          this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.daValue!
            = this.collectService.dateRate + " 00:00:00";

          this.collectService.enableDate = true;

        } else {
          this.collectService.pagoTransferencia[index].fecha = this.dateServ.hoyISO();

          this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.daCollectionPayment!
            = this.collectService.pagoTransferencia[index].fecha.split("T")[0] + " " + this.collectService.pagoTransferencia[index].fecha.split("T")[1];

          this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.daValue!
            = this.collectService.pagoTransferencia[index].fecha.split("T")[0] + " " + this.collectService.pagoTransferencia[index].fecha.split("T")[1];

          this.collectService.enableDate = false;

        }

        this.collectService.pagoTransferencia[index].disabled = false;

        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.coCollection! = this.collectService.collection.coCollection;
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.coPaymentMethod = type;
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.idBank = this.collectService.pagoTransferencia[index].idBanco;
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.naBank = this.collectService.pagoTransferencia[index].nombreBanco;
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.nuClientBankAccount = this.collectService.pagoTransferencia[index].numeroCuenta;
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.coType = type;


        this.validatePayment("tr", index);
        break;

        break;
      }

      case "ot": {

        break;
      }
    }
  }

  compareWith(o1: any, o2: any) {
    return "";
    /* return o1 && o2 ? o1.id === o2.id : o1 === o2; */
  }

  setResult(ev: any) {
    console.log('Apretó:' + ev.detail.role);
    this.collectService.alertMessageOpen = false;
    this.alertMessageOpen = false;
    this.collectService.mensaje = '';
  }

  print() {
    console.log(this.collectService.collection);
  }

  setShowDateChequeVenceModal(i: number, val: boolean) {
    let cheque = this.collectService.pagoCheque[i];
    cheque.showDateVenceModal = val;
  }

  setShowDateChequeValorModal(i: number, val: boolean) {
    let cheque = this.collectService.pagoCheque[i];
    cheque.showDateValorModal = val;
  }

  setShowDateDepositoModal(i: number, val: boolean) {
    let deposito = this.collectService.pagoDeposito[i];
    deposito.showDateModal = val;
  }

  setShowDateTransferenciaModal(i: number, val: boolean) {
    let transferencia = this.collectService.pagoTransferencia[i];
    transferencia.showDateModal = val;
  }

  setShowEventModal(value: boolean) {
    this.showEventModal = value;
    // Si se está abriendo el modal, limpiar selección
    if (value) {
      this.collectService.tiposPago.forEach(tp => tp.selected = false);
    }
  }

  getSelectedTipoPago() {
    // Devuelve el primer tipo de pago seleccionado (puedes ajustar para múltiples si lo necesitas)
    return this.collectService.tiposPago.find((tipoPago: any) => tipoPago.selected);
  }

  onSelectTipoPago(tipoSeleccionado: any, type: number) {
    // Solo uno puede estar seleccionado
    this.collectService.tiposPago.forEach(tp => tp.selected = false);
    tipoSeleccionado.selected = true;
  }

  onFechaValorChange(value: string, index: number, type: string) {
    // Guarda solo la parte de la fecha (YYYY-MM-DD)
    switch (type) {
      case "de": {
        if (value) {
          this.collectService.pagoDeposito[index].fecha = value.split('T')[0];
          this.getFechaValor(this.collectService.pagoDeposito[index].fecha, index, 'de');
        }
        break
      }
      case "ch": {
        if (value) {
          this.collectService.pagoCheque[index].fechaValor = value.split('T')[0];
          this.getFechaValor(this.collectService.pagoCheque[index].fechaValor, index, 'ch');
        }
        break
      }
      case "tr": {
        if (value) {
          this.collectService.pagoTransferencia[index].fecha = value.split('T')[0];
          this.getFechaValor(this.collectService.pagoTransferencia[index].fecha, index, 'tr');
        }
        break
      }
    }


  }

  onFechaChange(value: string, index: number, type: string) {
    // Guarda solo la parte de la fecha (YYYY-MM-DD)
    if (value) {
      this.collectService.pagoCheque[index].fecha = value.split('T')[0];
      this.getFecha(this.collectService.pagoCheque[index].fecha, index, 'ch');
    }
  }

  // asigna/obtiene uid único al objeto depósito/efectivo/cheque
  private getUid(obj: any): string {
    if (!obj) return `u-${++this.__uidCounter}`;
    if (!obj.__amountUid) {
      Object.defineProperty(obj, '__amountUid', {
        value: `u-${++this.__uidCounter}`,
        enumerable: false,
        configurable: true,
        writable: false
      });
    }
    return obj.__amountUid;
  }

  private formatFromCents(cents: number): string {
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(cents);
    const units = Math.floor(abs / 100);
    const cent = (abs % 100).toString().padStart(2, '0');
    const unitsStr = units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${sign}${unitsStr},${cent}`;
  }

  private ensureInitFor(obj: any, deposito: any) {
    const uid = this.getUid(obj);
    if (this.centsMap[uid] === undefined) {
      this.centsMap[uid] = Math.round((deposito?.monto || 0) * 100) || 0;
      this.displayMap[uid] = this.formatFromCents(this.centsMap[uid]);
    }
    return uid;
  }

  // usado desde template para mostrar valor
  getDisplay(obj: any, idx: number, type: string): string {
    const uid = this.ensureInitFor(obj, obj);
    return this.displayMap[uid] ?? '0,00';
  }

  onMontoFocus(deposito: any, index: number, type: string) {
    const uid = this.ensureInitFor(deposito, deposito);
    if (!this.centsMap[uid]) {
      this.centsMap[uid] = 0;
      this.displayMap[uid] = this.formatFromCents(0);
    }
  }

  private updateAfterChange(uid: string, deposito: any, index?: number, type?: string) {
    const cents = this.centsMap[uid] ?? 0;
    deposito.monto = cents / 100;
    this.displayMap[uid] = this.formatFromCents(cents);

    // cancelar timer previo
    if (this.debounceTimers[uid]) {
      clearTimeout(this.debounceTimers[uid]);
    }

    // programar la ejecución final (setMonto / validaciones) después del debounce
    this.debounceTimers[uid] = setTimeout(() => {
      // llamar setMonto sólo cuando el usuario dejó de teclear
      if (typeof (this as any).setMonto === 'function') {
        try {
          (this as any).setMonto(deposito.monto, index ?? 0, type ?? '');
        } catch { /* swallow */ }
      }
      delete this.debounceTimers[uid];
    }, this.debounceDelay);
  }

  public onMontoKeyDown(event: any, deposito: any, index: number, type: string) {
    const key = event?.key;
    const uid = this.ensureInitFor(deposito, deposito);

    // permitir navegación básica
    const allowed = ['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'];
    if (allowed.includes(key)) return;

    // detectar elemento input y selección (cuando el usuario selecciona todo y borra)
    const inputEl = event?.target as HTMLInputElement | null;
    const selStart = inputEl?.selectionStart ?? null;
    const selEnd = inputEl?.selectionEnd ?? null;
    const hasSelection = selStart !== null && selEnd !== null && (selEnd - selStart) > 0;

    // Si hay selección y borran (Backspace o Delete) -> limpiar a 0 e informar
    if ((key === 'Backspace' || key === 'Delete') && hasSelection) {
      this.centsMap[uid] = 0;
      this.updateAfterChange(uid, deposito, index, type);
      event.preventDefault();
      return;
    }

    // tecla Delete sin selección -> comportarse similar a Backspace (borrar último dígito)
    if (key === 'Delete') {
      this.centsMap[uid] = Math.floor((this.centsMap[uid] ?? 0) / 10);
      this.updateAfterChange(uid, deposito, index, type);
      event.preventDefault();
      return;
    }

    if (/^\d$/.test(key)) {
      const digit = parseInt(key, 10);
      this.centsMap[uid] = Math.min(999999999999, (this.centsMap[uid] ?? 0) * 10 + digit);
      this.updateAfterChange(uid, deposito, index, type);
      event.preventDefault();
      return;
    }

    if (key === 'Backspace') {
      this.centsMap[uid] = Math.floor((this.centsMap[uid] ?? 0) / 10);
      this.updateAfterChange(uid, deposito, index, type);
      event.preventDefault();
      return;
    }

    // bloquear otras teclas
    event.preventDefault();
  }

  onMontoBlur(deposito: any, index: number, type: string) {
    const uid = this.ensureInitFor(deposito, deposito);

    // si hay timer pendiente, ejecutarlo inmediatamente
    if (this.debounceTimers[uid]) {
      clearTimeout(this.debounceTimers[uid]);
      if (typeof (this as any).setMonto === 'function') {
        try {
          (this as any).setMonto(deposito.monto, index, type);
        } catch { }
      }
      delete this.debounceTimers[uid];
    } else {
      // no hay timer, pero aseguramos que el valor final se confirme
      if (typeof (this as any).setMonto === 'function') {
        try {
          (this as any).setMonto(deposito.monto, index, type);
        } catch { }
      }
    }
  }
}