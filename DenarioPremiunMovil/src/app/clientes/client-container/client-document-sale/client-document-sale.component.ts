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

    getDaDueDate(daDueDate: string) {
    let dateDoc = new Date(daDueDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3")).getTime();
    return Math.abs(Math.round(((new Date()).getTime() - dateDoc) / 86400000));
  }

    convertirMonto(monto: number, rate: number, currency: string) {

    if (currency ==  this.currency.localCurrency.coCurrency) {
      return this.currency.formatNumber(this.cleanFormattedNumber(this.currency.formatNumber(monto / rate)));
    } else {
      return this.currency.formatNumber(this.cleanFormattedNumber(this.currency.formatNumber(monto * rate)));
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

    oppositeCoCurrency(coCurrency: string) {
    return this.currency.oppositeCoCurrency(coCurrency);
  }

}
