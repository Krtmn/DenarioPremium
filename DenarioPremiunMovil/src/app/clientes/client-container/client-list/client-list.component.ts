import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { InfiniteScrollCustomEvent, NavController } from '@ionic/angular';
import { ClienteSelectorService } from 'src/app/cliente-selector/cliente-selector.service';
import { SelectedClient } from 'src/app/modelos/selectedClient';

import { Client } from 'src/app/modelos/tables/client';
import { CurrencyEnterprise } from 'src/app/modelos/tables/currencyEnterprise';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { ClientesDatabaseServicesService } from 'src/app/services/clientes/clientes-database-services.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { ServicesService } from 'src/app/services/services.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
    selector: 'app-client-list',
    templateUrl: './client-list.component.html',
    styleUrls: ['./client-list.component.scss'],
    standalone: false
})
export class ClientListComponent implements OnInit {

  private currencyService = inject(CurrencyService);
  public enterpriseServ = inject(EnterpriseService)
  public clientLogic = inject(ClientLogicService);
  private service = inject(ClienteSelectorService);

  public listaEmpresa: Enterprise[] = [];
  public prueba!: string[];
  public clients!: any[];
  public client!: Client;
  public tags = new Map<string, string>([]);
  public results!: any;
  public cliente!: Client;
  public nombreCliente: string = "";

  public indice!: number;
  public clientDetailComponent: Boolean = false;
  public precision = this.currencyService.precision;


  @Input()
  searchText: string = "";

  constructor(
    private router: Router,
  ) {
    this.searchText = '';
  }

  ngOnInit() {
    this.clientLogic.clientListComponent = true;
    this.clientLogic.clienteNuevoBlancoImg = true;
    this.searchText = "";
    this.indice = 1;
    this.clientDetailComponent = false;
    this.onChangeEnterprise();
  }

  onIonInfinite(ev: any) {
    this.indice++;
    setTimeout(() => {
      (ev as InfiniteScrollCustomEvent).target.complete();
    }, 800);
  }
  handleInput(event: any) {
    this.searchText = event.target.value.toLowerCase();
  }
  oppositeCoCurrency(coCurrency: string) {
    return this.currencyService.oppositeCoCurrency(coCurrency);
  }

  formatNumber(num: number) {
    return this.currencyService.formatNumber(num);
  }


  onChangeEnterprise() {
    this.service.clientes = [] as Client[];
    this.clientLogic.getClients(this.clientLogic.empresaSeleccionada.idEnterprise).then(result => {

      this.indice = 1;      
      if (this.currencyService.multimoneda) {
        let saldoCliente = 0, saldoOpuesto = 0;
        for (let c = 0; c < this.clientLogic.clients.length; c++) {
          if (this.clientLogic.clients[c].coCurrency == this.clientLogic.localCurrency.coCurrency) {
            saldoCliente = this.clientLogic.clients[c].saldo1 + this.currencyService.toLocalCurrency(this.clientLogic.clients[c].saldo2);
            saldoOpuesto = this.currencyService.toHardCurrency(saldoCliente);
          } else {
            saldoCliente = this.clientLogic.clients[c].saldo1 + this.currencyService.toHardCurrency(this.clientLogic.clients[c].saldo2);
            saldoOpuesto = this.currencyService.toLocalCurrency(saldoCliente);
          }
          this.clientLogic.clients[c].saldo1 = saldoCliente;
          this.clientLogic.clients[c].saldo2 = saldoOpuesto;
          saldoCliente = saldoOpuesto = 0;
        }
      }
      this.service.clientes = this.clientLogic.clients;
    })
  }
}
