import { Component, OnInit, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { Client } from '../modelos/tables/client';
import { InfiniteScrollCustomEvent, IonModal } from '@ionic/angular';
import { ServicesService } from '../services/services.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { ClientesDatabaseServicesService } from '../services/clientes/clientes-database-services.service';
import { CurrencyService } from '../services/currency/currency.service';
import { CurrencyEnterprise } from '../modelos/tables/currencyEnterprise';
import { ClienteSelectorService } from './cliente-selector.service';
import { InventariosLogicService } from '../services/inventarios/inventarios-logic.service';
import { CollectionService } from '../services/collection/collection-logic.service';


@Component({
  selector: 'app-cliente-selector',
  templateUrl: './cliente-selector.component.html',
  styleUrls: ['./cliente-selector.component.scss'],
  standalone: false
})
export class ClienteSelectorComponent implements OnInit {

  //injects


  private clientServ = inject(ClientesDatabaseServicesService);
  private dbServ = inject(SynchronizationDBService);
  private currencyService = inject(CurrencyService);
  private service = inject(ClienteSelectorService);
  private invenLogic = inject(InventariosLogicService);
  private collectLogic = inject(CollectionService);


  public tags = new Map<string, string>([]);
  public clientes!: Client[]
  public searchText: string = '';
  public indice!: number;
  public clientChangeOpen = false;
  public multimoneda: boolean = false;
  public cliente!: Client

  public isModalOpen: boolean = false;
  public precision = this.currencyService.precision;
  private localCurrency!: CurrencyEnterprise;
  private hardCurrency!: CurrencyEnterprise;

  private showConversion = false;
  private localCurrencyDefault = true;

  public colorModulo: string = '';

  public nombreModulo: string = '';

  public headerConfirm: string = '';

  public mensajeClientChange: string = '';

  public btnAceptar: string = '';

  public btnCancelar: string = '';





  @ViewChild(IonModal) modal!: IonModal;


  constructor(

  ) {
    this.tags = this.service.tags;
    this.colorModulo = this.service.colorModulo;
    this.nombreModulo = this.service.nombreModulo;
    this.clientes = this.service.clientes;
    this.multimoneda = this.currencyService.multimoneda;

    //busco monedas
    this.currencyService.setup(this.dbServ.getDatabase()).then(() => {
      this.localCurrency = this.currencyService.getLocalCurrency();
      this.hardCurrency = this.currencyService.getHardCurrency();

    })

  }

  ngOnInit() {
    //console.log("Cliente selector ON");
  }

  getTag(tagName: string) {
    var tag = this.tags.get(tagName);
    if (tag == undefined) {
      console.log("Error al buscar tag " + tagName);
      tag = '';
    }
    return tag;
  }

  formatNum(num: number) {
    return this.currencyService.formatNumber(num);
  }
  setup(idEnterprise: number, nombreModulo: string, colorModulo: string, cliente: null | Client, checkClient: boolean) {
    //hace la configuracion inicial y habilita el chequeo de cambio de cliente
    this.setSkin(nombreModulo, colorModulo);
    this.updateClientList(idEnterprise);
    this.service.checkClient = checkClient;
    this.service.clienteAnterior = cliente;
    var coModule = this.service.moduleNames.get(nombreModulo);
    var currencyModule;
    if(coModule){
      currencyModule = this.currencyService.getCurrencyModule(coModule);
    }
    if(currencyModule){
      this.showConversion = currencyModule.showConversion;
      this.localCurrencyDefault = currencyModule.localCurrencyDefault;
    }
    


  }
  setSkin(nombreModulo: string, colorModulo: string) {
    this.colorModulo = colorModulo;
    this.nombreModulo = nombreModulo;

    this.service.colorModulo = colorModulo;
    this.service.nombreModulo = nombreModulo;
  }

  updateClientList(idEnterprise: number) {

    this.clientServ.getClients(idEnterprise).then(result => {
      this.clientes = [] as Client[];
      this.service.clientes = [] as Client[];
      if (this.nombreModulo == 'Cobros') {
        if (this.collectLogic.userCanCollectIva && this.collectLogic.cobro25) {
          for (var i = 0; i < result.length; i++) {
            if (result[i].collectionIva) {
              this.clientes.push(result[i]);
            }
          }
        } else {
          this.clientes = result;
        }

      } else
        this.clientes = result;
      //this.service.clienteAnterior = null;

      this.indice = 1;
      //console.log("[ClienteSelector] Lista de clientes actualizada");
      //mostrando los saldos correctamente
      let saldoCliente = 0, saldoOpuesto = 0;
      if (this.currencyService.multimoneda) {
        for (let c = 0; c < this.clientes.length; c++) {
          if (this.clientes[c].coCurrency == this.localCurrency.coCurrency) {
            saldoCliente = this.clientes[c].saldo1 + this.currencyService.toLocalCurrency(this.clientes[c].saldo2);
            saldoOpuesto = this.currencyService.toHardCurrency(saldoCliente);
          } else {
            saldoCliente = this.clientes[c].saldo1 + this.currencyService.toHardCurrency(this.clientes[c].saldo2);
            saldoOpuesto = this.currencyService.toLocalCurrency(saldoCliente);
          }
          this.clientes[c].saldo1 = saldoCliente;
          this.clientes[c].saldo2 = saldoOpuesto;

          saldoCliente = saldoOpuesto = 0;
        }

      }
      //para usarlo luego
      this.service.clientes = this.clientes;
    })
  }

  @Output() clienteSeleccionado: EventEmitter<Client> = new EventEmitter<Client>();
  selectClient(input: Client) {

    if (this.service.checkClient && this.service.clienteAnterior != null
      && this.service.clienteAnterior.idClient != input.idClient) {
      //mostramos ventana
      this.cliente = input;
      this.setClientChangeOpen(true);
    } else {
      this.service.clienteAnterior = input;
      this.clienteSeleccionado.emit(input);
      this.closeModal();
    }

  }

  sendClient() {
    //this.clienteSeleccionado.emit(this.cliente);
    this.service.onCLientChanged(this.cliente);
  }


  handleInput(event: any) {
    this.searchText = event.target.value.toLowerCase();
  }

  /*
  getClients() {
    //console.log("getClients")
    return this.clientServ.getClients(1);
  }
  */

  closeModal() {
    this.modal.dismiss(null, 'cancel');
    //console.log("cerre el modal de cliente");
  }

  onIonInfinite(ev: any) {
    this.indice++;
    setTimeout(() => {
      (ev as InfiniteScrollCustomEvent).target.complete();
    }, 800);
  }

  oppositeCoCurrency(coCurrency: string) {
    return this.currencyService.oppositeCoCurrency(coCurrency);
  }

  setClientChangeOpen(value: boolean) {
    this.btnAceptar = this.getTag('CLI_ACEPTAR');
    this.btnCancelar = this.getTag('CLI_CANCELAR');
    this.headerConfirm = this.getTag('CLI_HEADER_ALERTA');
    this.mensajeClientChange = this.getTag('CLI_RESET_CONFIRMA');
    this.buttonsClientChange = [
      {
        text: this.btnCancelar,
        role: 'cancel',
        handler: () => {
          this.clientChangeOpen = false;
          this.closeModal();

        }
      },

      {
        text: this.btnAceptar,
        role: 'confirm',
        handler: () => {

          this.service.clienteAnterior = this.cliente;
          this.sendClient();
          this.closeModal();

        },
      }

    ];


    this.clientChangeOpen = value;
  }

  public buttonsClientChange = [

    {
      text: this.btnAceptar,
      role: 'confirm',
      handler: () => {

        this.service.clienteAnterior = this.cliente;
        this.sendClient();

      },
    },
    {
      text: this.btnCancelar,
      role: 'cancel',
      handler: () => {
        this.closeModal()
      }
    }
  ];



}
