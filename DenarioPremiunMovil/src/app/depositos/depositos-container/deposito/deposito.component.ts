import { Component, inject, OnInit } from '@angular/core';
import { DepositService } from 'src/app/services/deposit/deposit.service';

@Component({
    selector: 'app-deposito',
    templateUrl: './deposito.component.html',
    styleUrls: ['./deposito.component.scss'],
    standalone: false
})
export class DepositoComponent implements OnInit {

  public depositService = inject(DepositService);

  public segment = 'default';

  constructor() { }

  ngOnInit() { }

  onChangeTab(tab: string) {
    if (tab == "total") {
      this.depositService.tabTotal = true;
    } else {
      this.depositService.tabTotal = false;
    }
  }

}
