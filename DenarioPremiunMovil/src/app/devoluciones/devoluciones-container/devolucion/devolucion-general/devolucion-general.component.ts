import { Component, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ClienteSelectorComponent } from 'src/app/cliente-selector/cliente-selector.component';
import { ClienteSelectorService } from 'src/app/cliente-selector/cliente-selector.service';
import { Client } from 'src/app/modelos/tables/client';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { Invoice } from 'src/app/modelos/tables/invoice';
import { Return } from 'src/app/modelos/tables/return';
import { ReturnType } from 'src/app/modelos/tables/returnType';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { ReturnLogicService } from 'src/app/services/returns/return-logic.service';
import { COLOR_AMARILLO, DELIVERY_STATUS_NEW } from 'src/app/utils/appConstants';
import { InvoiceSelectorComponent } from './invoice-selector/invoice-selector.component';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
  selector: 'devolucion-general',
  templateUrl: './devolucion-general.component.html',
  styleUrls: ['./devolucion-general.component.scss'],
  standalone: false
})
export class DevolucionGeneralComponent implements OnInit, OnDestroy {


  enterpriseServ = inject(EnterpriseService);
  returnLogic = inject(ReturnLogicService);
  dateServ = inject(DateServiceService);
  selectorService = inject(ClienteSelectorService);
  dbServ = inject(SynchronizationDBService);

  @Input()
  generalTags = new Map<string, string>([]);
  @ViewChild(ClienteSelectorComponent)
  selectorCliente!: ClienteSelectorComponent;
  @ViewChild(InvoiceSelectorComponent)
  selectorInvoice!: InvoiceSelectorComponent;

  @ViewChild('naResponsibleInput', { static: false })
  naResponsibleInput: any;

  @ViewChild('nuSealInput', { static: false })
  nuSealInput: any;

  @ViewChild('txCommentInput', { static: false })
  txCommentInput: any;

  listaEmpresa: Enterprise[] = [];
  empresaSeleccionada!: Enterprise;
  cliente!: Client;
  hasClient: Boolean = false;
  newReturn: Return = {} as Return;
  segment: string = 'default';
  nombreCliente: string = "";
  returnValid: Boolean = false;
  bloquearFactura: Boolean = true;

  listaTiposDevs: ReturnType[] = [];
  tipoDevSeleccionado!: ReturnType;


  clientChangeSubscription: any;
  invoiceChangeSubscription: any;


  constructor() { }

  ngOnDestroy(): void {
    this.clientChangeSubscription.unsubscribe();
    this.invoiceChangeSubscription.unsubscribe();
  }

  ngOnInit() {
    this.cliente = {} as Client;
    this.enterpriseServ.setup(this.dbServ.getDatabase()).then(() => {
      this.listaEmpresa = this.enterpriseServ.empresas;
      //ESTO ES PARA CUANDO CAMBIE DE PESTANAS, RECUPERAR LA INFORMACION YA COLOCADA
      if (this.returnLogic.newReturn.idClient == undefined) {
        //ESTOY REALIZANDO UNA DEVOLUCION DESDE 0
        this.empresaSeleccionada = this.listaEmpresa[0];
        //this.selectorCliente.updateClientList(this.listaEmpresa[0].idEnterprise);
        //this.selectorCliente.setSkin('Devoluciones', 'fondoAmarillo');

        this.selectorCliente.setup(this.empresaSeleccionada.idEnterprise,
          this.returnLogic.tags.get('DEV_NOMBRE_MODULO')!, 'fondoAmarillo', null, this.returnLogic.validateClient);
        this.returnLogic.bloquearFactura = false;
        this.returnLogic.newReturn.coReturn = this.dateServ.generateCO(0);
        this.returnLogic.newReturn.idType = this.returnLogic.returnTypes[0].idType;
        this.returnLogic.newReturn.naResponsible = '';
        this.returnLogic.newReturn.nuSeal = '';
        this.returnLogic.newReturn.txComment = '';
        this.returnLogic.onReturnValid(false);
        this.returnLogic.onReturnValidToSave(false);
        this.returnLogic.onReturnValidToSend(false);

      } else {
        //YA TENGO UNA DEVOLUCION VALIDA
        for (var i = 0; i < this.listaEmpresa.length; i++) {
          if (this.returnLogic.newReturn.idEnterprise === this.listaEmpresa[i].idEnterprise) {
            this.empresaSeleccionada = this.listaEmpresa[i];
            break;
          }
        }
        this.cliente.idClient = this.returnLogic.newReturn.idClient;
        this.cliente.coClient = this.returnLogic.newReturn.coClient;
        this.cliente.lbClient = this.returnLogic.newReturn.lbClient;
        this.nombreCliente = this.cliente.lbClient;
        this.hasClient = true;
        this.returnLogic.bloquearFactura = false;
        //this.selectorCliente.updateClientList(this.empresaSeleccionada.idEnterprise);
        /* this.selectorCliente.setup(this.empresaSeleccionada.idEnterprise,
          this.returnLogic.tags.get('DEV_NOMBRE_MODULO')!, "fondoAmarillo", this.cliente, this.returnLogic.validateClient); */
        this.returnLogic.onReturnValid(true);
        this.returnLogic.onReturnValidToSave(true);
        this.returnLogic.onReturnValidToSend(true);
      }
    });

    this.clientChangeSubscription = this.selectorService.ClientChanged.subscribe(client => {
      this.selectorService.checkClient = false;
      this.cliente = client;
      this.nombreCliente = client.lbClient;
      this.reset();
    });

    this.invoiceChangeSubscription = this.returnLogic.invoiceChanged.subscribe(invoice => {
      this.reset();
      this.setInvoicefromSelector(invoice);
      this.returnLogic.newReturn.coInvoice = invoice.coInvoice;
      this.returnLogic.newReturn.idInvoice = invoice.idInvoice;
      this.returnLogic.findInvoiceDetailUnits().then();
      this.returnLogic.onReturnValid(true);
      this.returnLogic.setChange(true, true);
    });
  }

  reset() {
    this.bloquearFactura = true;
    console.log('Aqui vamos a resetar la devolucion');
    //this.returnLogic.newReturn.naResponsible = "";
    //this.returnLogic.newReturn.nuSeal = "";
    //this.returnLogic.newReturn.idType = 0;
    //this.returnLogic.newReturn.txComment = "";
    this.returnLogic.newReturn.coInvoice = "";
    this.returnLogic.newReturn.idInvoice = 0;
    this.returnLogic.productList = [];
    this.returnLogic.validateClient = false;
    this.setClientfromSelector(this.cliente);
    if (this.returnLogic.validateReturn) {
      this.returnLogic.onReturnValid(false);
    } else {
      this.returnLogic.onReturnValid(true);
    }
  }

  setClientfromSelector(cliente: Client) {
    if (cliente) {
      //this.returnLogic.newReturn.coReturn = this.dateServ.generateCO(0);
      this.hasClient = true;
      this.returnLogic.newReturn.idReturn = 0; // este se va a actualizar con la repsuesta del API
      this.cliente = cliente;
      this.bloquearFactura = false;
      this.nombreCliente = cliente.lbClient;
      this.returnLogic.clientReturn = this.cliente;
      //this.returnLogic.setChange(true, false);
      this.returnLogic.newReturn.idClient = this.cliente.idClient;
      this.returnLogic.newReturn.coClient = this.cliente.coClient;
      this.returnLogic.newReturn.lbClient = this.cliente.lbClient;
      this.returnLogic.newReturn.idEnterprise = this.empresaSeleccionada.idEnterprise;
      this.returnLogic.newReturn.coEnterprise = this.empresaSeleccionada.coEnterprise;
      this.returnLogic.newReturn.idUser = Number(localStorage.getItem("idUser"));
      this.returnLogic.newReturn.coUser = localStorage.getItem('coUser') || "[]";
      this.returnLogic.enterpriseReturn = this.empresaSeleccionada;
      this.returnLogic.newReturn.stReturn = DELIVERY_STATUS_NEW; // 0 = Nuevo, 1 = Guardado, 2 = Por Enviar, 3 = Enviado
      this.returnLogic.onReturnValidToSave(true);
      if (this.returnLogic.validateReturn) {
        this.returnLogic.findInvoices();
      } else {
        this.returnLogic.onReturnValid(true);
      }
    }
    else {
      this.bloquearFactura = true;
      console.log("cliente vacio");
      this.nombreCliente = "";
      this.hasClient = false;

    }
  }

  setInvoicefromSelector(invoice: Invoice) {
    if (invoice) {
      this.selectorService.checkClient = true;
    } else {
      this.bloquearFactura = false;
      console.log("factura vacia");
    }
  }

  onEnterpriseSelect() {
    this.selectorCliente.updateClientList(this.empresaSeleccionada.idEnterprise);
    this.cliente = {} as Client;
    this.nombreCliente = "";
    this.returnValid = false;
  }

  cleanString(str: string): string {
    // Elimina ;
    str = str.replace(/;/g, '');
    // Elimina comillas simples
    str = str.replace(/'/g, '');
    // Elimina comillas dobles
    str = str.replace(/"/g, '');


    return str;
  }

  onNaResponsibleChange() {
    const clean = this.cleanString(this.returnLogic.newReturn.naResponsible);
    if (this.returnLogic.newReturn.naResponsible !== clean) {
      this.returnLogic.newReturn.naResponsible = clean;
      if (this.naResponsibleInput && this.naResponsibleInput.value !== clean) {
        this.naResponsibleInput.value = (clean);
      }
    }
  }

  onNuSealChange() {
    const clean = this.cleanString(this.returnLogic.newReturn.nuSeal);
    if (this.returnLogic.newReturn.nuSeal !== clean) {
      this.returnLogic.newReturn.nuSeal = clean;
      if (this.nuSealInput && this.nuSealInput.value !== clean) {
        this.nuSealInput.value = (clean);
      }
    }
  }

  onTxCommentChange() {
    const clean = this.cleanString(this.returnLogic.newReturn.txComment);
    if (this.returnLogic.newReturn.txComment !== clean) {
      this.returnLogic.newReturn.txComment = clean;
      if (this.txCommentInput && this.txCommentInput.value !== clean) {
        this.txCommentInput.value = (clean);
      }
    }

  }

}
