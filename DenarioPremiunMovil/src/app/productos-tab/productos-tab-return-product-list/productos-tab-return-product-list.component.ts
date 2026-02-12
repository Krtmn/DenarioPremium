import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProductUtil } from 'src/app/modelos/ProductUtil';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { ImageServicesService } from 'src/app/services/imageServices/image-services.service';
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
  private subs = new Subscription();
  imageServices = inject(ImageServicesService);

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
  returnBackSub: any;
  noProductsAlertShown = false;
  public imagesMap: { [imgName: string]: string } = {};
  constructor(private cd: ChangeDetectorRef,) { }


  ngOnInit() {
    //Buscar si existen productos ya cargados cuando me cambio de pestaña sin salir de la devolucion
    this.subs.add(
      this.imageServices.imageLoaded$.subscribe(({ imgName, imgSrc }) => {
        this.imagesMap[imgName] = imgSrc;
        this.cd.markForCheck();
      })
    );
    this.empresaSeleccionada = this.returnLogic.enterpriseReturn;

    console.log('Estoy en Devolucion');
    this.psClicked = this.productService.productStructureCLicked.subscribe((data) => {
      this.showProductList = data;
      this.noProductsAlertShown = false;
      if (this.showProductList) {
        this.idProductStructureList = this.productStructureService.idProductStructureList;
        this.coProductStructureListString = this.productStructureService.coProductStructureListString;
        this.productService.getProductsByCoProductStructureAndIdEnterprise(this.db.getDatabase(),
          this.idProductStructureList, this.empresaSeleccionada.idEnterprise, this.empresaSeleccionada.coCurrencyDefault).then(() => {
            this.productList = this.productService.productList;
            this.noProductsAlertShown = (this.productList.length == 0);
          });
      }
    });

    this.searchSub = this.productService.onSearchClicked.subscribe((data) => {
      this.noProductsAlertShown = false;
      this.showProductList = true;
      this.productList = this.productService.productList;
      this.noProductsAlertShown = (this.productList.length == 0);

    });

    this.validateReturnSub = this.returnLogic.productsByInvoice.subscribe((data) => {
      this.noProductsAlertShown = false;
      this.showProductList = true;
      this.productList = this.productService.productList;
      this.noProductsAlertShown = (this.productList.length == 0);
    });

    this.featClicked = this.productService.featuredStructureClicked.subscribe((data) => {
      this.noProductsAlertShown = false;
      this.productService.getFeaturedProducts(this.db.getDatabase(),
        this.empresaSeleccionada.idEnterprise,
        this.empresaSeleccionada.coCurrencyDefault,
        this.globalConfig.get('userCanChangeWarehouse') === 'true',
        this.returnLogic.clientReturn.idClient,
        this.returnLogic.clientReturn.idList,
        0).then(() => {
          this.showProductList = true;
          this.productList = this.productService.productList;
          this.noProductsAlertShown = (this.productList.length == 0);
        }
        )
    });

    this.favClicked = this.productService.favoriteStructureClicked.subscribe((data) => {
      this.noProductsAlertShown = false;
      this.productService.getFavoriteProducts(this.db.getDatabase(),
        this.empresaSeleccionada.idEnterprise,
        this.empresaSeleccionada.coCurrencyDefault,
        this.globalConfig.get('userCanChangeWarehouse') === 'true',
        this.returnLogic.clientReturn.idClient,
        this.returnLogic.clientReturn.idList,
        0).then(() => {
          this.showProductList = true;
          this.productList = this.productService.productList;
          this.noProductsAlertShown = (this.productList.length == 0);
        }
        )
    });

    this.returnBackSub = this.productService.returnBackClicked.subscribe(() => {
      if (this.returnLogic.validateReturn) {
        this.onShowProductList();
      } else {
        this.onShowProductStructures();
      }
    });
  }

  ngOnDestroy(): void {
    this.psClicked.unsubscribe();
    this.searchSub.unsubscribe();
    this.validateReturnSub.unsubscribe();
    this.featClicked.unsubscribe();
    this.favClicked.unsubscribe();
    this.returnBackSub.unsubscribe();
  }

  onShowProductStructures() {
    this.showProductList = false;
    this.productStructureService.onAddProductCLicked();
    this.productService.onBackButtonClicked();
    this.productService.searchStructures = true;
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
