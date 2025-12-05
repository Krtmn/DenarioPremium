import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { ClientShareModalComponent } from '../client-share-modal/client-share-modal.component';
import { SynchronizationDBService } from '../../../services/synchronization/synchronization-db.service';
import { Client } from '../../../modelos/tables/client';
import { ClientesDatabaseServicesService } from '../../../services/clientes/clientes-database-services.service';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { SelectedClient } from 'src/app/modelos/selectedClient';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { Coordinate } from 'src/app/modelos/coordinate';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { AddresClient } from 'src/app/modelos/tables/addresClient';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss'],
  standalone: false
})
export class ClienteComponent implements OnInit {

  private globalConfig = inject(GlobalConfigService);
  public clientLogic = inject(ClientLogicService);
  public currencyService = inject(CurrencyService);

  public params!: any;
  public document!: DocumentSale[];
  public client!: Client;
  public sub!: object;
  public idCliente!: number;
  public multiCurrency!: Boolean;
  public tagRif: string = "";
  public nuCreditLimitConversion: string = "";
  public localCurrency = '';
  public hardCurrency = '';
  public decimales = 2;
  public selectedAddress!: AddresClient;

  subjectClientShareModalOpen: any;
  // selección múltiple de documentos
  public selectedDocuments: string[] = [];

  // control de modales
  public clientShareModalOpen = false;
  public clientSelectShareModalOpen = false;


  @Input() showHeader: boolean = false;

  constructor() {

  }

  ngOnInit() {
    //console.log(this.clientDetail);
    this.client = this.clientLogic.datos.client;
    this.selectedAddress = this.clientLogic.listaDirecciones.find(address => address.idAddress === this.client.idAddressClients)!;

    if (this.clientLogic.multiCurrency) {
      if (this.currencyService.multimoneda) {
        //arreglamos el saldo del cliente
        //porque vergas saldo1 y saldo2 significan vainas distintas aqui y en la lista nunca sabré. 
        // Asumo que estaban rascaos cuando lo escribieron...
        let saldoCliente = 0, saldoOpuesto = 0;

        if (this.client.coCurrency == this.clientLogic.localCurrency.coCurrency) {
          saldoCliente = this.client.saldo1 + this.currencyService.toLocalCurrency(this.client.saldo2);
          saldoOpuesto = this.currencyService.toHardCurrency(saldoCliente);
          this.nuCreditLimitConversion = this.formatNumber(this.currencyService.toHardCurrency(this.client.nuCreditLimit));
        } else {
          saldoCliente = this.client.saldo1 + this.currencyService.toHardCurrency(this.client.saldo2);
          saldoOpuesto = this.currencyService.toLocalCurrency(saldoCliente);
          this.nuCreditLimitConversion = this.formatNumber(this.currencyService.toLocalCurrency(this.client.nuCreditLimit));
        }
        this.client.saldo1 = saldoCliente;
        this.client.saldo2 = saldoOpuesto;
        saldoCliente = saldoOpuesto = 0;

      }
    } else {
      this.client.saldo1 = this.client.saldo1;;
    }


    this.document = this.clientLogic.datos.document;

    this.tagRif = this.globalConfig.get("tagRif")!;

    this.localCurrency = this.currencyService.localCurrency.coCurrency;
    if (this.clientLogic.multiCurrency)
      this.hardCurrency = this.currencyService.hardCurrency.coCurrency;

    this.decimales = this.currencyService.precision;

    this.subjectClientShareModalOpen = this.clientLogic.closeClientShareModal.subscribe((open: Boolean) => {
      this.clientShareModalOpen = false;
    });

  }

  ngOnDestroy() {
    this.subjectClientShareModalOpen.unsubscribe();
  }

  openDoc(idDocumento: number, index: number) {
    console.log(idDocumento, index);
    console.log(this.document[index]);
    this.clientLogic.documentSaleSelect = {} as DocumentSale;
    this.clientLogic.documentSaleSelect = this.document[index];
    this.clientLogic.clientDetailComponent = false;
    this.clientLogic.clientDocumentSaleComponent = true;
    this.clientLogic.opendDocClick = true;
  }

  viewCoordenada(verCrear: Boolean, client: Client, module: string) {
    if (verCrear)
      console.log("ver mapa");
    else
      console.log("crear ubicacion");
    this.clientLogic.viewCoordenada(client, module);
  }

  hayCoordenada(coord: string) {
    if (coord == null || coord.trim() === "" ||
      coord.toLowerCase().trim() === "null" || coord.trim() == "0,0") {
      return false;
    }
    return true;
  }

  //funcion que devuelve la coordenada si existe
  getCoordenada(coord: string) {
    if (this.hayCoordenada(coord)) {
      return coord;
    }
    return "";
  }

  //Hacer estas conversiones en el servicio de moneda 
  //tomaria muchos queries a la bd, lo hacemos aca mejor.
  toLocalCurrency(hardAmount: number, doc: DocumentSale): string {
    if (doc.coCurrency == this.localCurrency) {
      //si la moneda es la misma, no se convierte
      return this.formatNumber(hardAmount);
    }
    return this.formatNumber(((hardAmount * doc.nuValueLocal) / this.currencyService.currencyRelation));
  }

  toHardCurrency(localAmount: number, doc: DocumentSale): string {
    if (doc.coCurrency == this.hardCurrency) {
      return this.formatNumber(localAmount);
    }
    return this.formatNumber(((localAmount * this.currencyService.currencyRelation) / doc.nuValueLocal));
  }

  formatNumber(num: number) {
    return this.currencyService.formatNumber(num);
  }

  getDaDueDate(daDueDate: string) {
    let dateDoc = new Date(daDueDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3")).getTime();
    //minutes = 1000*60
    //hours = minutes * 60
    //days = hours * 24
    //var days = 86400000; /* 1000 * 60 * 60 * 24; */

    return Math.round(((new Date()).getTime() - dateDoc) / 86400000);
  }

  oppositeCoCurrency(coCurrency: string) {
    return this.currencyService.oppositeCoCurrency(coCurrency);
  }

  public toggleDocumentSelection(coDocument: string, event?: any): void {
    const checked = event?.detail?.checked ?? !!event?.target?.checked;
    if (!Array.isArray(this.selectedDocuments)) this.selectedDocuments = [];
    const idx = this.selectedDocuments.indexOf(coDocument);
    if (checked) {
      if (idx === -1) this.selectedDocuments.push(coDocument);
    } else {
      if (idx !== -1) this.selectedDocuments.splice(idx, 1);
    }
  }

  public selectAllDocuments(): void {
    this.selectedDocuments = Array.isArray(this.clientLogic.datos?.document)
      ? this.clientLogic.datos.document.map(d => d.coDocument)
      : [];
  }

  public openSelectShareModal(open: boolean): void {
    this.clientSelectShareModalOpen = !!open;
  }

  public openShareModal(open: boolean): void {
    // Obtener lista de documentos actuales
    const docs: DocumentSale[] = Array.isArray(this.clientLogic.datos?.document)
      ? this.clientLogic.datos.document
      : [];

    // Asegurar array destino
    if (!Array.isArray(this.clientLogic.documentsSaleSelectShared)) {
      this.clientLogic.documentsSaleSelectShared = [];
    }

    // Mapear selectedDocuments (coDocument strings) a objetos DocumentSale y asignar sin duplicados
    const selectedDocs = this.selectedDocuments
      .map(co => docs.find(d => d.coDocument === co))
      .filter((d): d is DocumentSale => !!d);

    // Reemplazamos la colección compartida por los objetos seleccionados (sin duplicados)
    this.clientLogic.documentsSaleSelectShared = selectedDocs;

    // Abrir/cerrar modal
    this.clientShareModalOpen = !!open;
  }

  onChangeAddress($event: any) {
    //cargamos la data de la direccion al cliente para usarla luego en modal de direcciones.
    this.selectedAddress = $event.detail.value;
    this.client.txAddress = this.selectedAddress.txAddress;
    this.client.idAddressClients = this.selectedAddress.idAddress;
    this.client.coAddressClients = this.selectedAddress.coAddress;
    this.client.coordenada = this.selectedAddress.coordenada;
    this.client.editable = this.selectedAddress.editable;

    //console.log(this.client.coordenada);
  }

  addressCompare(o1: AddresClient, o2: AddresClient): boolean {
    return o1 && o2 ? o1.idAddress === o2.idAddress : o1 === o2;
  }

  convertirMonto(monto: number, rate: number, currency: string) {

    if (currency == this.localCurrency) {
      return this.currencyService.formatNumber(this.cleanFormattedNumber(this.currencyService.formatNumber(monto / rate)));
    } else {
      return this.currencyService.formatNumber(this.cleanFormattedNumber(this.currencyService.formatNumber(monto * rate)));
    }
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
}
