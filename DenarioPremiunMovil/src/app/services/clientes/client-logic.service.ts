import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { ServicesService } from '../services.service';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { CurrencyEnterprise } from 'src/app/modelos/tables/currencyEnterprise';
import { CurrencyService } from '../currency/currency.service';
import { EnterpriseService } from '../enterprise/enterprise.service';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { MessageService } from '../messageService/message.service';
import { ClientesDatabaseServicesService } from './clientes-database-services.service';
import { Client } from 'src/app/modelos/tables/client';
import { GlobalConfigService } from '../globalConfig/global-config.service';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { SelectedClient } from 'src/app/modelos/selectedClient';
import { PotentialClientDatabaseServicesService } from './potentialClient/potential-client-database-services.service';
import { PotentialClient } from 'src/app/modelos/tables/potentialClient';

import { Coordinate } from 'src/app/modelos/coordinate';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { AddresClient } from 'src/app/modelos/tables/addresClient';


@Injectable({
  providedIn: 'root'
})
export class ClientLogicService {

  public services = inject(ServicesService);
  public dbServ = inject(SynchronizationDBService);
  public currencyService = inject(CurrencyService);
  public enterpriseServ = inject(EnterpriseService);
  public message = inject(MessageService);
  public clientesServices = inject(ClientesDatabaseServicesService);
  public globalConfig = inject(GlobalConfigService);
  public potentialClientService = inject(PotentialClientDatabaseServicesService);


  public showButtons = new Subject<Boolean>;
  public stockValidToSave = new Subject<Boolean>;
  public stockValidToSend = new Subject<Boolean>;
  public stockValid = new Subject<Boolean>;
  public backRoute = new Subject<string>;
  public closeClientShareModal = new Subject<Boolean>();

  public hardCurrency!: CurrencyEnterprise;
  public localCurrency!: CurrencyEnterprise;
  public datos!: SelectedClient;
  public enterprises!: Enterprise[];
  public empresaSeleccionada!: Enterprise;
  public clientTags = new Map<string, string>([]);
  public clientTagsDenario = new Map<string, string>([]);
  public listaEmpresa: Enterprise[] = [];
  public results!: any;
  public clients!: Client[];
  public potentialClients!: PotentialClient[];
  public potentialClient!: PotentialClient;
  public documentSaleSelect!: DocumentSale;
  public indice!: number;
  public coordenada!: Coordinate;
  public listaDirecciones: AddresClient[] = [];

  public clientContainerComponent: Boolean = true;
  public clientListComponent: Boolean = false;
  public clientDetailComponent: Boolean = false;
  public clientDocumentSaleComponent: Boolean = false;
  public clientPotentialClientComponent: Boolean = false;
  public clientNewPotentialClientComponent: Boolean = false;
  public clientLocationComponent: Boolean = false;
  public disabledEnterprise: Boolean = false;
  public opendDocClick: Boolean = false;
  public openDocSales: Boolean = false;
  public cannotSavePotentialClient: Boolean = true;
  public cannotSendPotentialClient: Boolean = true;
  public validPotentialClient: Boolean = false;

  public clienteNuevoBlancoImg: Boolean = true;//si hay algun cambio en el nuevo cliente potencial
  public newPotentialClientChanged: Boolean = false;//si hay algun cambio en el nuevo cliente potencial
  public saveSendPotentialClient: Boolean = false; //BOTONES saalvar y enviar cliente potencial
  public savePotentialClient: Boolean = false; //BOTONES saalvar y enviar cliente potencial
  public saveOrExitOpen = false;
  public clientLocationChanged: Boolean = false;
  public cannotSendClientCoordinate: Boolean = false;

  public showConversion: boolean = true;
  public multiCurrency: boolean = false;
  public localCurrencyDefault: boolean = false;
  public user: any = {};
  public currencyModule: any;

  public segment = 'default';


  constructor() {
    this.multiCurrency = this.globalConfig.get('multiCurrency').toString() === "true" ? true : false;
    this.currencyModule = this.currencyService.getCurrencyModule("cli");
    this.localCurrencyDefault = this.currencyModule.localCurrencyDefault.toString() === 'true' ? true : false;
    this.showConversion = this.currencyModule.showConversion.toString() === 'true' ? true : false;

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);

      } catch (e) {
        this.user = {};
      }
    }
    if (this.user.transportista) {

    } else {

    }

  }

  getCurrency() {
    this.currencyService.setup(this.dbServ.getDatabase()).then(() => {
      this.localCurrency = this.currencyService.getLocalCurrency();
      this.hardCurrency = this.currencyService.getHardCurrency();
    })
  }

  getEnterprise() {
    this.enterpriseServ.setup(this.dbServ.getDatabase()).then(() => {
      this.listaEmpresa = this.enterpriseServ.empresas;
      this.empresaSeleccionada = this.enterpriseServ.empresas[0];
      this.disabledEnterprise = this.globalConfig.get('enterpriseEnabled') === 'true' ? false : true;

    });
  }


  showHeaderButtons(headerButtons: Boolean) {
    this.showButtons.next(headerButtons);
  }

  showBackRoute(route: string) {
    console.log('clientLogic: showBackRoute ', route);
    this.backRoute.next(route);
  }

  getTags() {
    return this.services.getTags(this.dbServ.getDatabase(), "CLI", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.clientTags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }

      return Promise.resolve(true);
    })
  }

  getTagsDenario() {
    return this.services.getTags(this.dbServ.getDatabase(), "DEN", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.clientTagsDenario.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      return Promise.resolve(true);
    })
  }

  getClients(idEnterprise: number) {
    this.clients = [] as Client[];
    return this.clientesServices.getClients(idEnterprise)
      .then((result) => {
        this.clients = result;
        this.results = [...result];

        // Recorre todos los clientes y loggea si la moneda es distinta a la moneda local
        if (this.localCurrencyDefault) {
          for (const c of this.clients) {
            if (c.coCurrency !== this.localCurrency.coCurrency) {
              c.saldo1 = this.currencyService.toOppositeCurrency(c.coCurrency, c.saldo1);
              c.coCurrency = this.localCurrency.coCurrency;

            }
          }
        } else {
          for (const c of this.clients) {
            if (c.coCurrency !== this.hardCurrency.coCurrency) {
              c.coCurrency = this.hardCurrency.coCurrency;
              c.saldo1 = this.currencyService.toOppositeCurrency(this.hardCurrency.coCurrency, c.saldo1);
            }
          }
        }
        return Promise.resolve(true)
      });
  }

  goToClient(idClient: number) {
    this.clientListComponent = false; //apagamos el componente client list
    this.clientesServices.getClientById(
      Number(idClient)).then((result) => {
        this.datos = {} as SelectedClient;
        // Recorre todos los clientes y loggea si la moneda es distinta a la moneda local
        if (this.localCurrencyDefault) {
          if (result.coCurrency !== this.localCurrency.coCurrency) {
            result.coCurrency = this.localCurrency.coCurrency;
            result.saldo1 = this.currencyService.toOppositeCurrency(this.localCurrency.coCurrency, result.saldo1);
            result.nuCreditLimit = this.currencyService.toOppositeCurrency(this.localCurrency.coCurrency, result.nuCreditLimit);
          }

        } else {
          if (result.coCurrency !== this.hardCurrency.coCurrency) {
            result.coCurrency = this.hardCurrency.coCurrency;
            result.saldo1 = this.currencyService.toOppositeCurrency(this.hardCurrency.coCurrency, result.saldo1);
            result.nuCreditLimit = this.currencyService.toOppositeCurrency(this.hardCurrency.coCurrency, result.nuCreditLimit);
          }
        }


        result.editable = result.editable.toLowerCase() === 'true' ? true : false;
        this.datos.client = result;
        this.clientesServices.getDocumentSaleByIdClient(Number(idClient)).then((result) => {
          // Recorre todos los clientes y loggea si la moneda es distinta a la moneda local
          if (this.localCurrencyDefault) {
            for (const c of result) {
              if (c.coCurrency !== this.localCurrency.coCurrency) {
                c.coCurrency = this.localCurrency.coCurrency;
                c.nuAmountPaid = this.currencyService.toOppositeCurrency(this.localCurrency.coCurrency, c.nuAmountPaid);
                c.nuAmountTotal = this.currencyService.toOppositeCurrency(this.localCurrency.coCurrency, c.nuAmountTotal);
                c.nuBalance = this.currencyService.toOppositeCurrency(this.localCurrency.coCurrency, c.nuBalance);
                c.nuAmountDiscount = this.currencyService.toOppositeCurrency(this.localCurrency.coCurrency, c.nuAmountDiscount);
                c.nuAmountRetention = this.currencyService.toOppositeCurrency(this.localCurrency.coCurrency, c.nuAmountRetention);
                c.nuAmountRetention2 = this.currencyService.toOppositeCurrency(this.localCurrency.coCurrency, c.nuAmountRetention2);
                c.nuAmountTax = this.currencyService.toOppositeCurrency(this.localCurrency.coCurrency, c.nuAmountTax);
              }
            }
          } else {
            for (const c of result) {
              if (c.coCurrency !== this.hardCurrency.coCurrency) {
                c.coCurrency = this.hardCurrency.coCurrency;
                c.nuAmountPaid = this.currencyService.toOppositeCurrency(this.hardCurrency.coCurrency, c.nuAmountPaid);
                c.nuAmountTotal = this.currencyService.toOppositeCurrency(this.hardCurrency.coCurrency, c.nuAmountTotal);
                c.nuBalance = this.currencyService.toOppositeCurrency(this.hardCurrency.coCurrency, c.nuBalance);
                c.nuAmountDiscount = this.currencyService.toOppositeCurrency(this.hardCurrency.coCurrency, c.nuAmountDiscount);
                c.nuAmountRetention = this.currencyService.toOppositeCurrency(this.hardCurrency.coCurrency, c.nuAmountRetention);
                c.nuAmountRetention2 = this.currencyService.toOppositeCurrency(this.hardCurrency.coCurrency, c.nuAmountRetention2);
                c.nuAmountTax = this.currencyService.toOppositeCurrency(this.hardCurrency.coCurrency, c.nuAmountTax);
              }
            }
          }


          this.datos.document = result;
          this.clientDetailComponent = true;
          this.datos.document.forEach((doc) => {
            doc.daDocument = doc.daDocument.split("-")[2] + "/" + doc.daDocument.split("-")[1] + "/" + doc.daDocument.split("-")[0];
            doc.daDueDate = doc.daDueDate.split("-")[2] + "/" + doc.daDueDate.split("-")[1] + "/" + doc.daDueDate.split("-")[0];
          })
        });
      });

    this.listaDirecciones = [];
    this.clientesServices.getAddressClientsByIdClient(Number(idClient)).then((result) => {
      this.listaDirecciones = result;
    });
  }

  viewCoordenada(client: Client) {
    this.clienteNuevoBlancoImg = false;

    //DEBO VALIDAR SI EXISTE COORDENADAS, SI NO EXISTE COLOCAR LA COORDENADA DEL TELEFONO, SINO YA VEREMOS!
    this.coordenada = {} as Coordinate
    if (client.coordenada == null
      || client.coordenada.trim() == ""
      || client.coordenada.trim() == "0,0"
      || client.coordenada.toLowerCase().trim() === "null") {
      this.coordenada.lat = 0;
      this.coordenada.lng = 0;
    } else {
      this.coordenada.lat = Number((client.coordenada.split(",")[0].trim()));
      this.coordenada.lng = Number((client.coordenada.split(",")[1].trim()));
    }
    this.coordenada.idClient = client.idClient;
    this.coordenada.idAddressClients = client.idAddressClients;
    this.coordenada.coAddressClients = client.coAddressClients;
    this.coordenada.editable = client.editable;
    this.coordenada.idEnterprise = client.idEnterprise;
    this.coordenada.naClient = client.lbClient;

    this.clientDetailComponent = false;
    this.clientLocationComponent = true;
  }

  getPotentialClient() {
    this.potentialClientService.getPotentialClient().then(result => {
      this.indice = 1;
      this.potentialClients = result;
      return true;
    })
  }

  getEnterprisePotentialClient() {
    return this.potentialClientService.getEnterprises().then(result => {
      this.enterprises = result;
      if (result.length == 1) {
        this.empresaSeleccionada = result[0];
        this.potentialClient.idEnterprise = result[0].idEnterprise;
      }
      return result
    })
  }

  getDocumentSale(idClient: number) {
    return this.clientesServices
  }

  openClientLocationComponent() {
    this.clientLocationComponent = true;
  }

  closeClientShareModalFunction() {
    this.closeClientShareModal.next(true);
  }

}