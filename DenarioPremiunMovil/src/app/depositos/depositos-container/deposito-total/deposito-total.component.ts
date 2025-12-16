import { Component, inject, OnInit } from '@angular/core';
import { DepositService } from 'src/app/services/deposit/deposit.service';

@Component({
  selector: 'app-deposito-total',
  templateUrl: './deposito-total.component.html',
  styleUrls: ['./deposito-total.component.scss'],
  standalone: false
})
export class DepositoTotalComponent implements OnInit {

  public depositService = inject(DepositService);

  constructor() {
    console.log('Total Deposited', this.depositService.deposit.nuAmountDoc);
    console.log('Total Deposited Conversion', this.depositService.deposit.nuAmountDocConversion);
  }

  ngOnInit() { }

}
