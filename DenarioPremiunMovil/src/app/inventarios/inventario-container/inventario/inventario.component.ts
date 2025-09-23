import { Component, OnInit, inject, Input } from '@angular/core';
import { InventariosLogicService } from 'src/app/services/inventarios/inventarios-logic.service';


@Component({
    selector: 'app-inventario',
    templateUrl: './inventario.component.html',
    styleUrls: ['./inventario.component.scss'],
    standalone: false
})
export class InventarioComponent implements OnInit {

  public inventariosLogicService = inject(InventariosLogicService);

  public segment: string = 'default';
  public stockValid: Boolean = false;

  constructor() { }

  ngOnInit() {
    if (this.inventariosLogicService.initInventario) {
      this.stockValidFunc();
    } else {
      this.stockValid = true;
      this.segment = "inventario";
    }
  }

  onChangeTab(tab: string) {
    if (this.inventariosLogicService.typeStocksComponent) {
      this.inventariosLogicService.onShowProductStructures()
      this.inventariosLogicService.typeStocksComponent = false;
    }
    this.segment = tab;
  }

  stockValidFunc() {
    this.inventariosLogicService.stockValid.subscribe((data: Boolean) => {
      this.stockValid = data;
    });
  }

}
