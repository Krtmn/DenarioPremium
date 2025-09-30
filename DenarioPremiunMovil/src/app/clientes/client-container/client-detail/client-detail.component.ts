import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

import { SynchronizationDBService } from '../../../services/synchronization/synchronization-db.service';
import { Client } from '../../../modelos/tables/client';
import { ClientesDatabaseServicesService } from '../../../services/clientes/clientes-database-services.service';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { SelectedClient } from 'src/app/modelos/selectedClient';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { Coordinate } from 'src/app/modelos/coordinate';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.scss'],
  standalone: false
})
export class ClienteComponent implements OnInit {

  private globalConfig = inject(GlobalConfigService);
  public clientLogic = inject(ClientLogicService);
  currencyService = inject(CurrencyService);

  public params!: any;
  public document!: DocumentSale[];
  public client!: Client;
  public sub!: object;
  public idCliente!: number;
  public multiCurrency!: Boolean;
  public tagRif: string = "";
  public coordenada: Boolean = false;

  public localCurrency = '';
  public hardCurrency = '';
  public decimales = 2;

  constructor() {

  }

  ngOnInit() {
    //console.log(this.clientDetail);
    this.client = this.clientLogic.datos.client;

    if (this.clientLogic.multiCurrency == "true") {
      if (this.currencyService.multimoneda) {
        //arreglamos el saldo del cliente
        //porque vergas saldo1 y saldo2 significan vainas distintas aqui y en la lista nunca sabre. 
        // Asumo que estaban rascaos cuando lo escribieron...
        let saldoCliente = 0, saldoOpuesto = 0;

        if (this.client.coCurrency == this.clientLogic.localCurrency.coCurrency) {
          saldoCliente = this.client.saldo1 + this.currencyService.toLocalCurrency(this.client.saldo2);
          saldoOpuesto = this.currencyService.toHardCurrency(saldoCliente);
        } else {
          saldoCliente = this.client.saldo1 + this.currencyService.toHardCurrency(this.client.saldo2);
          saldoOpuesto = this.currencyService.toLocalCurrency(saldoCliente);
        }
        this.client.saldo1 = saldoCliente;
        this.client.saldo2 = saldoOpuesto;
        saldoCliente = saldoOpuesto = 0;

      }
    } else {
      this.client.saldo1 = this.client.saldo1;;
    }

    if (this.client.coordenada != null)
      this.coordenada = true;

    this.document = this.clientLogic.datos.document;

    this.tagRif = this.globalConfig.get("tagRif")!;

    this.localCurrency = this.currencyService.localCurrency.coCurrency;
    if (this.clientLogic.multiCurrency == "true")
      this.hardCurrency = this.currencyService.hardCurrency.coCurrency;

    this.decimales = this.currencyService.precision;

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

  viewCoordenada(verCrear: Boolean, client: Client) {
    if (verCrear)
      console.log("ver mapa");
    else
      console.log("crear ubicacion");
    this.clientLogic.viewCoordenada(client);
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
}
