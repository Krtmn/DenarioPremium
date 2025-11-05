import { Component, Input, OnDestroy, OnInit, Output,EventEmitter, inject } from '@angular/core';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { PedidosService } from 'src/app/pedidos/pedidos.service';
import { ProductStructureService } from 'src/app/services/productStructures/product-structure.service';
import { ProductService } from 'src/app/services/products/product.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
    selector: 'productos-tab-search',
    templateUrl: './productos-tab-search.component.html',
    styleUrls: ['./productos-tab-search.component.scss'],
    standalone: false
})
export class ProductosTabSearchComponent implements OnInit, OnDestroy {

  productStructureService = inject(ProductStructureService);
db = inject(SynchronizationDBService);
  @Input()
  productsTabTags = new Map<string, string>([]);
  productService = inject(ProductService);
  orderServ = inject(PedidosService);
  @Input()
  showProductStructure: Boolean = false;
  @Input()
  empresaSeleccionada!: Enterprise;
  @Input()
  pedido: Boolean = false;

  searchText: string = '';
  productStructures: Boolean = false;
  disabledSearchButton: Boolean = false;
  

  sub: any;
  //searchSub: any;

  constructor() { }

  ngOnInit() {
    if (this.showProductStructure) {
      this.productStructures = true;
    }

    this.sub = this.productStructureService.productStructures.subscribe((data) => {
      this.productStructures = data;
    });

    /*
    this.searchSub = this.productService.onSearchClicked.subscribe((data) => {
      this.productStructures = true;
    });
    */
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    //this.searchSub.unsubscribe();
  }

  onSearchTextChanged(){
    this.productService.searchTextChanged.next(this.searchText);
  }

  onSearchClicked() {
    this.disabledSearchButton = true;
    if(this.pedido){
      this.productService.getProductsSearchedByCoProductAndNaProductAndIdList(this.db.getDatabase(),this.searchText, this.empresaSeleccionada.idEnterprise, this.orderServ.monedaSeleccionada.coCurrency, this.orderServ.listaSeleccionada.idList).then(() => {
        this.productService.onProductTabSearchClicked();
        this.disabledSearchButton = false;
      });
    }else{
    this.productService.getProductsSearchedByCoProductAndNaProduct(this.db.getDatabase(),this.searchText, this.empresaSeleccionada.idEnterprise,this.orderServ.monedaSeleccionada.coCurrency).then(() => {
      this.productService.onProductTabSearchClicked();
      this.disabledSearchButton = false;
    });
    }
  }

}
