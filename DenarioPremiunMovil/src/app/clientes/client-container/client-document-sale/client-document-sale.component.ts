import { Component, Input, OnInit, inject } from '@angular/core';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';

@Component({
    selector: 'app-client-document-sale',
    templateUrl: './client-document-sale.component.html',
    styleUrls: ['./client-document-sale.component.scss'],
    standalone: false
})
export class ClientDocumentSaleComponent implements OnInit {

  public clientLogic = inject(ClientLogicService)
  public currency = inject(CurrencyService);

  constructor() { }

  ngOnInit() { }

  formatNumber(num: number) {
    return this.currency.formatNumber(num);
  }

}
