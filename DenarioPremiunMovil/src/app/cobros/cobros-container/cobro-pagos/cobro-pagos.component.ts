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

    /* this.collectService.calculatePayment(); */
    if (isNaN(this.collectService.montoTotalPagar))
      this.collectService.montoTotalPagar = 0;


    //this.loadTipoPago();

  }

  ngOnInit() {
    /*    if (this.collectService.collection  .collectionPayments! != undefined)
         if (this.collectService.collection  .collectionPayments!.length > 0)
           if (this.collectService.collection  .collectionPayments![0].coType == "") {
             delete this.collectService.collection  .collectionPayments![0];
             this.collectService.collection  .collectionPayments!.length = 0;
           } */

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

        if (!this.collectService.clientBankAccount)
          newPagoCheque.disabled = false;

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
    switch (type) {
      case "ef": {
        this.collectService.collection.nuAmountFinal -= this.collectService.pagoEfectivo[index].monto;
        this.collectService.collection.nuAmountTotal -= this.collectService.pagoEfectivo[index].monto;

        this.collectService.collection.nuAmountFinalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountFinal, 0, this.collectService.collection.coCurrency);
        this.collectService.collection.nuAmountTotalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountTotal, 0, this.collectService.collection.coCurrency);

        this.collectService.collection.collectionPayments!.splice(this.collectService.pagoEfectivo[index].posCollectionPayment, 1);
        this.collectService.pagoEfectivo.splice(index, 1);
        if (this.collectService.pagoEfectivo.length > 0)
          this.collectService.validateToSend();

        if (this.collectService.collection.collectionPayments.length == 0)
          this.collectService.onCollectionValidToSend(false);
        break
      }

      case "ch": {
        this.collectService.collection.nuAmountFinal -= this.collectService.pagoCheque[index].monto;
        this.collectService.collection.nuAmountTotal -= this.collectService.pagoCheque[index].monto;

        this.collectService.collection.nuAmountFinalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountFinal, 0, this.collectService.collection.coCurrency);
        this.collectService.collection.nuAmountTotalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountTotal, 0, this.collectService.collection.coCurrency);

        this.collectService.collection.collectionPayments!.splice(this.collectService.pagoCheque[index].posCollectionPayment, 1);
        this.collectService.pagoCheque.splice(index, 1);
        if (this.collectService.pagoCheque.length > 0)
          this.collectService.validateToSend();

        if (this.collectService.collection.collectionPayments.length == 0)
          this.collectService.onCollectionValidToSend(false);
        break;
      }

      case "de": {
        this.collectService.collection.nuAmountFinal -= this.collectService.pagoDeposito[index].monto;
        this.collectService.collection.nuAmountTotal -= this.collectService.pagoDeposito[index].monto;

        this.collectService.collection.nuAmountFinalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountFinal, 0, this.collectService.collection.coCurrency);
        this.collectService.collection.nuAmountTotalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountTotal, 0, this.collectService.collection.coCurrency);

        this.collectService.collection.collectionPayments!.splice(this.collectService.pagoDeposito[index].posCollectionPayment, 1);
        this.collectService.pagoDeposito.splice(index, 1);

        if (this.collectService.pagoDeposito.length > 0)
          this.collectService.validateToSend();

        if (this.collectService.collection.collectionPayments.length == 0)
          this.collectService.onCollectionValidToSend(false);

        break
      }

      case "tr": {
        this.collectService.collection.nuAmountFinal -= this.collectService.pagoTransferencia[index].monto;
        this.collectService.collection.nuAmountTotal -= this.collectService.pagoTransferencia[index].monto;

        this.collectService.collection.nuAmountFinalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountFinal, 0, this.collectService.collection.coCurrency);
        this.collectService.collection.nuAmountTotalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountTotal, 0, this.collectService.collection.coCurrency);

        this.collectService.collection.collectionPayments!.splice(this.collectService.pagoTransferencia[index].posCollectionPayment, 1);
        this.collectService.pagoTransferencia.splice(index, 1);
        if (this.collectService.pagoTransferencia.length > 0)
          this.collectService.validateToSend();

        if (this.collectService.collection.collectionPayments.length == 0)
          this.collectService.onCollectionValidToSend(false);
        break;
      }

      case "ot": {
        this.collectService.collection.nuAmountFinal -= this.collectService.pagoOtros[index].monto;
        this.collectService.collection.nuAmountTotal -= this.collectService.pagoOtros[index].monto;

        this.collectService.collection.nuAmountFinalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountFinal, 0, this.collectService.collection.coCurrency);
        this.collectService.collection.nuAmountTotalConversion = this.collectService.convertirMonto(this.collectService.collection.nuAmountTotal, 0, this.collectService.collection.coCurrency);

        this.collectService.collection.collectionPayments!.splice(this.collectService.pagoOtros[index].posCollectionPayment, 1);
        this.collectService.pagoOtros.splice(index, 1);
        if (this.collectService.pagoOtros.length > 0)
          this.collectService.validateToSend();

        if (this.collectService.collection.collectionPayments.length == 0)
          this.collectService.onCollectionValidToSend(false);

        break;
      }
    }


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
        if (this.collectService.pagoEfectivo[index].monto > 0) {
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
        if (this.collectService.pagoCheque[index].monto > 0) {
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
        if (this.collectService.pagoDeposito[index].monto > 0) {
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
          if (this.collectService.pagoTransferencia[index].monto > 0) {
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
          if (this.collectService.pagoTransferencia[index].monto > 0) {
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
        if (this.collectService.pagoOtros[index].monto > 0) {
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

        //if (this.collectService.bankAccountSelected.length > 0) {
        this.collectService.pagoTransferencia[index].nombreBanco = this.collectService.pagoTransferencia[index].bancoReceptor.nameBank;

        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!
          .idBank = this.collectService.pagoTransferencia[index].bancoReceptor.idBank;

        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!
          .naBank = this.collectService.pagoTransferencia[index].bancoReceptor.nameBank;

        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!
          .nuClientBankAccount = this.collectService.pagoTransferencia[index].bancoReceptor.nuAccount;
        /*         } else {
                  this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!
                    .idBank = this.collectService.pagoTransferencia[index].bancoReceptor.idBank;
        
                  this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!
                    .naBank = this.collectService.pagoTransferencia[index].bancoReceptor.nameBank;
        
                  this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!
                    .nuClientBankAccount = this.collectService.pagoTransferencia[index].bancoReceptor.nuAccount;
                }
         */
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.coPaymentMethod = type;
        this.collectService.collection.collectionPayments![this.collectService.pagoTransferencia[index].posCollectionPayment]!.coType = type

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
}