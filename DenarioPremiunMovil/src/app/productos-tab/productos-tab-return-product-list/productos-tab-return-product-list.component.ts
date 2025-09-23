import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ProductUtil } from 'src/app/modelos/ProductUtil';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { ProductStructureService } from 'src/app/services/productStructures/product-structure.service';
import { ProductService } from 'src/app/services/products/product.service';
import { ReturnLogicService } from 'src/app/services/returns/return-logic.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
    selector: 'productos-tab-return-product-list',
    templateUrl: './productos-tab-return-product-list.component.html',
    styleUrls: ['./productos-tab-return-product-list.component.scss'],
    standalone: false
})
export class ProductosTabReturnProductListComponent implements OnInit, OnDestroy {


  productStructureService = inject(ProductStructureService);
  productService = inject(ProductService);
  returnLogic = inject(ReturnLogicService);
  globalConfig = inject(GlobalConfigService);
  db = inject(SynchronizationDBService);

  @Input()
  devolucion: Boolean = false;
  @Input()
  pedido: Boolean = false;
  @Input()
  inventario: Boolean = false;
  @Input()
  searchText: string = '';
  @Input()
  productsTabTags = new Map<string, string>([]);
  @Input()
  empresaSeleccionada!: Enterprise;
  @Input()
  showProductList: Boolean = false;

  productList: ProductUtil[] = [];

  idProductStructureList: number[] = [];
  coProductStructureListString: string = "";

  psClicked!: any;
  featClicked: any;
  favClicked: any;
  searchSub: any;
  validateReturnSub: any;

  constructor() { }


  ngOnInit() {
    //Buscar si existen productos ya cargados cuando me cambio de pestaña sin salir de la devolucion



    console.log('Estoy en Devolucion');
    this.psClicked = this.productService.productStructureCLicked.subscribe((data) => {
      this.showProductList = data;
      if (this.showProductList) {
        this.idProductStructureList = this.productStructureService.idProductStructureList;
        this.coProductStructureListString = this.productStructureService.coProductStructureListString;
        this.productService.getProductsByCoProductStructureAndIdEnterprise(this.db.getDatabase(),
          this.idProductStructureList, this.empresaSeleccionada.idEnterprise, this.empresaSeleccionada.coCurrencyDefault).then(() => {
            this.productList = this.productService.productList;
          });
      }
    });

    this.searchSub = this.productService.onSearchClicked.subscribe((data) => {
      this.showProductList = true;
      this.productList = this.productService.productList;
    });

    this.validateReturnSub = this.returnLogic.productsByInvoice.subscribe((data) => {
      this.showProductList = true;
      this.productList = this.productService.productList;
    });

    this.featClicked = this.productService.featuredStructureClicked.subscribe((data) => {
      this.productService.getFeaturedProducts(this.db.getDatabase(),
        this.empresaSeleccionada.idEnterprise, 
        this.empresaSeleccionada.coCurrencyDefault,
        this.globalConfig.get('userCanChangeWarehouse') === 'true',
        this.returnLogic.clientReturn.idClient,
        this.returnLogic.clientReturn.idList,
        0).then(() => {
            this.showProductList = true;
      this.productList = this.productService.productList;
        }
      )
    });

    this.favClicked = this.productService.favoriteStructureClicked.subscribe((data) => {
      this.productService.getFavoriteProducts(this.db.getDatabase(),
        this.empresaSeleccionada.idEnterprise, 
        this.empresaSeleccionada.coCurrencyDefault,
        this.globalConfig.get('userCanChangeWarehouse') === 'true',
        this.returnLogic.clientReturn.idClient,
        this.returnLogic.clientReturn.idList,
        0).then(() => {
          this.showProductList = true;
          this.productList = this.productService.productList;
        }
      )
    });
  }

  ngOnDestroy(): void {
    this.psClicked.unsubscribe();
    this.searchSub.unsubscribe();
    this.validateReturnSub.unsubscribe();
  }

  onShowProductStructures() {
    this.showProductList = false;
    this.productStructureService.onAddProductCLicked();
  }

  onShowProductList() {
    this.showProductList = false;
    this.productStructureService.onReturnProductTabClicked();
  }

  onSelectProductDev(prod: ProductUtil) {
    //console.log('Devolucion not implemented.' + prod.naProduct);
    this.showProductList = false;
    this.returnLogic.addProductDev(prod);
    this.productStructureService.onReturnProductTabClicked();
  }

}