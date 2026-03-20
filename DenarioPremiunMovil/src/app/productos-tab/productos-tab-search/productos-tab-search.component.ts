import { Component, Input, OnDestroy, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { PedidosService } from 'src/app/pedidos/pedidos.service';
import { MessageService } from 'src/app/services/messageService/message.service';
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
  message = inject(MessageService);
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
  inventoryClickedSub: any;

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
      this.productService.searchStructures = true;
      this.onSearchTextChanged();
    });

    this.productStructureClickedSub = this.productService.productStructureCLicked.subscribe(() => {
      this.productService.searchStructures = false;
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

    this.inventoryClickedSub = this.productService.inventoryTabClicked.subscribe(() => {
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
    this.inventoryClickedSub.unsubscribe();
  }

  onSearchTextChanged() {
    this.productService.searchTextChanged.next(this.searchText);
  }

  clearSearch() {
    this.searchText = '';
    this.onSearchTextChanged();
  }

  onSearchClicked(event?: Event) {
    event?.preventDefault();
    if (this.disabledSearchButton || this.searchText.trim().length === 0) {
      return;
    }
    this.productStructureService.nombreProductStructureSeleccionada = '';
    if (this.productService.searchStructures) {
      //reseteamos la seleccion de estructura de producto
      this.productStructureService.idProductStructureList = [];
    }

    this.disabledSearchButton = true;

    //Buscar en estructura de producto
    this.message.showLoading();
    if (this.pedido) {
      //hay que filtrar por lista de precios si estamos en pedido
      this.productService.getProductsSearchedByCoProductAndNaProductAndIdList(
        this.db.getDatabase(), this.searchText, this.empresaSeleccionada.idEnterprise,
        this.orderServ.monedaSeleccionada.coCurrency,
        this.orderServ.listaSeleccionada.idList, 0).then(() => {
          this.productService.onProductTabSearchClicked();
          this.disabledSearchButton = false;
          this.message.hideLoading();
        });
    } else {
      //busqueda normal sin filtrar por lista de precios
      this.productService.getProductsSearchedByCoProductAndNaProduct(this.db.getDatabase(),
        this.searchText,
        this.empresaSeleccionada.idEnterprise,
        this.empresaSeleccionada.coCurrencyDefault, 0).then(() => {
          this.productService.onProductTabSearchClicked();
          this.disabledSearchButton = false;
          this.message.hideLoading();
        });
    }

  }



  onBackClicked() {
    this.showBackIcon = false;
    this.productService.onReturnBackClicked();
  }

}
