import { Component, Input, OnDestroy, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { Subject } from 'rxjs';
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
  @Input()
  showBackButton: Boolean = false;

  searchText: string = '';
  productStructures: Boolean = false;
  disabledSearchButton: Boolean = false;
  showBackIcon = false;
  productStructuresSub: any;
  //searchSub: any;
  backButtonSub: any;
  productStructureClickedSub: any;
  searchClickedSub: any;
  featuredClickedSub: any;
  favoriteClickedSub: any;
  carritoClickedSub: any;

  constructor() { }

  ngOnInit() {
    if (this.showProductStructure) {
      this.productStructures = true;
    }

    this.productStructuresSub = this.productStructureService.productStructures.subscribe((data) => {
      this.productStructures = data;
      if (data) {
        this.showBackIcon = false;
      }
    });

    this.backButtonSub = this.productService.backButtonClicked.subscribe((data) => {
      this.searchText = '';
      this.onSearchTextChanged();
    });

    this.productStructureClickedSub = this.productService.productStructureCLicked.subscribe(() => {
      this.showBackIcon = true;
    });

    this.searchClickedSub = this.productService.onSearchClicked.subscribe(() => {
      this.showBackIcon = true;
    });

    this.featuredClickedSub = this.productService.featuredStructureClicked.subscribe(() => {
      this.showBackIcon = true;
    });

    this.favoriteClickedSub = this.productService.favoriteStructureClicked.subscribe(() => {
      this.showBackIcon = true;
    });

    this.carritoClickedSub = this.productService.carritoButtonClicked.subscribe(() => {
      this.showBackIcon = true;
    });

    /*
    this.searchSub = this.productService.onSearchClicked.subscribe((data) => {
      this.productStructures = true;
    });
    */
  }

  ngOnDestroy(): void {
    this.productStructuresSub.unsubscribe();
    //this.searchSub.unsubscribe();
    this.backButtonSub.unsubscribe();
    this.productStructureClickedSub.unsubscribe();
    this.searchClickedSub.unsubscribe();
    this.featuredClickedSub.unsubscribe();
    this.favoriteClickedSub.unsubscribe();
    this.carritoClickedSub.unsubscribe();
  }

  onSearchTextChanged() {
    this.productService.searchTextChanged.next(this.searchText);
  }

  clearSearch() {
    this.searchText = '';
    this.onSearchTextChanged();
  }

  onSearchClicked() {
    if (this.disabledSearchButton || this.searchText.trim().length === 0) {
      return;
    }
    this.productStructureService.nombreProductStructureSeleccionada = '';

    this.disabledSearchButton = true;
    if (this.productService.searchStructures) {
      //Buscar en estructuras de producto
      if (this.pedido) {
        this.productService.getProductsSearchedByCoProductAndNaProductAndIdList(this.db.getDatabase(), this.searchText, this.empresaSeleccionada.idEnterprise, this.orderServ.monedaSeleccionada.coCurrency, this.orderServ.listaSeleccionada.idList).then(() => {
          this.productService.onProductTabSearchClicked();
          this.disabledSearchButton = false;
        });
      } else {
        this.productService.getProductsSearchedByCoProductAndNaProduct(this.db.getDatabase(),
          this.searchText,
          this.empresaSeleccionada.idEnterprise,
          this.empresaSeleccionada.coCurrencyDefault).then(() => {
            this.productService.onProductTabSearchClicked();
            this.disabledSearchButton = false;
          });
      }
    } else {
      this.productStructureService.idProductStructureSeleccionada = 0;
      if (this.pedido) {
        this.productService.getProductsSearchedByCoProductAndNaProductAndIdList(this.db.getDatabase(), this.searchText, this.empresaSeleccionada.idEnterprise, this.orderServ.monedaSeleccionada.coCurrency, this.orderServ.listaSeleccionada.idList).then(() => {
          this.productService.onProductTabSearchClicked();
          this.disabledSearchButton = false;
        });
      } else {
        //Buscar en estructuras de producto?
        this.disabledSearchButton = false;
        this.productService.onProductTabSearchClicked();
      }
    }

  }

  onBackClicked() {
    this.showBackIcon = false;
    this.productService.onReturnBackClicked();
  }

}
