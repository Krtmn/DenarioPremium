import { Component, inject, OnInit } from '@angular/core';
import { CollectDeposit } from 'src/app/modelos/collect-deposit';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { DepositService } from 'src/app/services/deposit/deposit.service';

@Component({
  selector: 'app-deposito-cobros',
  templateUrl: './deposito-cobros.component.html',
  styleUrls: ['./deposito-cobros.component.scss'],
  standalone: false
})
export class DepositoCobrosComponent implements OnInit {

  public depositService = inject(DepositService);
  public dateServ = inject(DateServiceService);


  public multiCurrency: string = "";

  constructor() {
    this.multiCurrency = this.depositService.globalConfig.get("multiCurrency");

  }

  ngOnInit() { }


  selectCobro(cobroDetails: CollectDeposit, index: number) {
    var indexDepositCollect = 0;
    if (cobroDetails.isSelected) {
      cobroDetails.inDepositCollect = true;
      this.depositService.onDepositValidToSend(true);
      this.depositService.deposit.depositCollect.push({
        idDepositCollect: 0,
        coDepositCollect: this.dateServ.generateCO(0),
        coDeposit: this.depositService.deposit.coDeposit,
        coDocument: cobroDetails.co_document,
        nuAmountTotal: cobroDetails.nu_amount_total,
        nuTotalDeposit: cobroDetails.total_deposit,
        coCollection: cobroDetails.co_collection,
        idCollection: cobroDetails.id_collection,
        st: 0,
        isSave: true,
        lbClient: cobroDetails.lb_client,
        daCollection: cobroDetails.da_collection,
      });

      indexDepositCollect = this.depositService.deposit.depositCollect.length - 1;
      this.depositService.deposit.nuValueLocal = cobroDetails.nu_value_local;
      this.depositService.deposit.nuAmountDoc += cobroDetails.total_deposit;
      this.depositService.deposit.nuAmountDocConversion += cobroDetails.nu_amount_final_conversion;
      this.depositService.deposit.nuAmountDoc = Number(this.depositService.deposit.nuAmountDoc.toFixed(this.depositService.parteDecimal));
      this.depositService.deposit.nuAmountDocConversion = Number(this.depositService.deposit.nuAmountDocConversion.toFixed(this.depositService.parteDecimal));

    } else {
      cobroDetails.inDepositCollect = false;
      this.depositService.deposit.depositCollect.splice(indexDepositCollect, 1);
      if (this.depositService.deposit.depositCollect.length == 0) {
        this.depositService.onDepositValidToSend(false);
        this.depositService.deposit.nuAmountDoc = 0;
        this.depositService.deposit.nuAmountDocConversion = 0;
      } else {
        this.depositService.deposit.nuAmountDoc -= cobroDetails.nu_amount_final;
        this.depositService.deposit.nuAmountDocConversion -= cobroDetails.nu_amount_final_conversion;
        this.depositService.deposit.nuAmountDoc = Number(this.depositService.deposit.nuAmountDoc.toFixed(this.depositService.parteDecimal));
        this.depositService.deposit.nuAmountDocConversion = Number(this.depositService.deposit.nuAmountDocConversion.toFixed(this.depositService.parteDecimal));
      }
    }

  }
}
