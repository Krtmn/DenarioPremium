import { Component, Input, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ProductSuggestedUtil } from 'src/app/modelos/ProductSuggestedUtil';
import { ClientStocksDetail } from 'src/app/modelos/tables/client-stocks';

@Component({
  selector: 'app-inventario-sugerido-preview',
  templateUrl: './inventario-sugerido-preview.component.html',
  styleUrls: ['./inventario-sugerido-preview.component.scss'],
  standalone: false
})
export class InventarioSugeridoPreviewComponent implements OnInit {
  @Input() productsSuggested: ProductSuggestedUtil[] = [];
  @Input() clientStockDetails: ClientStocksDetail[] = [];
  @Input() inventarioTags: Map<string, string> = new Map<string, string>();
  @Input() diasDesdeUltimoInventario: number = 0;
  @Input() diasHastaSiguienteInventario: number = 0;

  disableOrderButton = true;
  private modalCtrl = inject(ModalController);

  constructor() {}

  ngOnInit() {
    for(let product of this.productsSuggested) {
      for(let unit of product.unitsSuggested) {
        if(unit.quUnitSuggested && unit.quUnitSuggested > 0) {
          this.disableOrderButton = false;
          break;
        }
      }
      if(!this.disableOrderButton) {
        break;
      }
    }
  }

  getProductName(idProduct: number): string {
    return this.clientStockDetails.find(p => p.idProduct === idProduct)?.naProduct || '-';
  }

  getProductCode(idProduct: number): string {
    return this.clientStockDetails.find(p => p.idProduct === idProduct)?.coProduct || '-';
  }

  getUnitName(idProduct: number, idUnit: number): string {
    const detail = this.clientStockDetails.find(p => p.idProduct === idProduct);
    return detail?.clientStockDetailUnits.find(u => u.idUnit === idUnit)?.naUnit || '-';
  }

  close(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(): void {
    this.modalCtrl.dismiss(null, 'confirm');
  }
}