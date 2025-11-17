import { Component, OnInit, inject } from '@angular/core';
import { ClientLogicService } from '../services/clientes/client-logic.service';
import { MessageService } from '../services/messageService/message.service';
import { CurrencyService } from '../services/currency/currency.service';


@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  standalone: false
})

export class ClientesComponent implements OnInit {
  public clientLogic = inject(ClientLogicService);
  private messageService = inject(MessageService);
  public currencyService = inject(CurrencyService);

  constructor() { }

  ngOnInit() {
    this.messageService.showLoading().then(() => {
      this.clientLogic.currencyModule = this.currencyService.getCurrencyModule("cli");
      this.clientLogic.localCurrencyDefault = this.clientLogic.currencyModule.localCurrencyDefault.toString() === 'true' ? true : false;
      this.clientLogic.showConversion = this.clientLogic.currencyModule.showConversion.toString() === 'true' ? true : false;

      this.clientLogic.getTags().then(resp => {
        if (resp) {
          this.messageService.hideLoading();
        }
      })
    });

  }
}