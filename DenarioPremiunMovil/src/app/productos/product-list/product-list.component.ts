import { ChangeDetectorRef, Component, DoCheck, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { InfiniteScrollCustomEvent, IonInfiniteScroll } from '@ionic/angular';
import { Subject, Subscription } from 'rxjs';
import { ProductDetail } from 'src/app/modelos/ProductDetail';
import { ProductUtil } from 'src/app/modelos/ProductUtil';
import { Imagenes } from 'src/app/modelos/imagenes';
import { CurrencyModules } from 'src/app/modelos/tables/currencyModules';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { Product } from 'src/app/modelos/tables/product';
import { ProductStructure } from 'src/app/modelos/tables/productStructure';
import { PedidosService } from 'src/app/pedidos/pedidos.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { ImageServicesService } from 'src/app/services/imageServices/image-services.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ProductStructureService } from 'src/app/services/productStructures/product-structure.service';
import { ProductService } from 'src/app/services/products/product.service';
import { ServicesService } from 'src/app/services/services.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
  selector: 'product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  standalone: false
})
export class ProductListComponent implements OnInit {

  private subs = new Subscription();

  productService = inject(ProductService);
  productStructureService = inject(ProductStructureService);
  services = inject(ServicesService);
  db = inject(SynchronizationDBService);
  message = inject(MessageService);
  imageServices = inject(ImageServicesService);
  currencyService = inject(CurrencyService);
  orderService = inject(PedidosService);
  config = inject(GlobalConfigService);

  public imagesMap: { [imgName: string]: string } = {};


  @Input()
  productTags = new Map<string, string>([]);
  @Input()
  empresaSeleccionada!: Enterprise;
  @Input()
  psSeleccionada!: ProductStructure;
  @Input()
  searchText: string = '';
  showConversionInfo: Boolean = false;
  localCurrencyDefault: Boolean = true;


  productList: ProductUtil[] = [];
  productListView: ProductUtil[] = [];
  idProductStructureList: number[] = [];
  coProductStructureListString: string = "";
  selectedProduct!: ProductUtil;
  productDetail!: ProductDetail;
  productModule: Boolean = false;
  currencyModuleEnabled: Boolean = false;
  defaultCurrency: string = '';
  startPro: number = 0;
  endPro: number = 20;
  qtyPro: number = 20;

  @Output()
  selectedProductChanged: EventEmitter<ProductDetail> = new EventEmitter<ProductDetail>();

  @ViewChild(IonInfiniteScroll)
  infiniteScroll!: IonInfiniteScroll;

  constructor(
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit() {

    //this.productService.showStock = this.productService.globalConfig.get("showStock") == "true" ? true : false;

    this.subs.add(
      this.imageServices.imageLoaded$.subscribe(({ imgName, imgSrc }) => {
        this.imagesMap[imgName] = imgSrc;
        this.cd.markForCheck();
      })
    );

    // Reemite imágenes cacheadas (si existen)
    this.imageServices.emitCachedImages();
    this.currencyModuleEnabled = this.config.get("currencyModule").toLowerCase() === "true";
    var currencyModule: CurrencyModules = this.currencyService.getCurrencyModule('pro');
    this.showConversionInfo = currencyModule.showConversion;
    this.localCurrencyDefault = currencyModule.localCurrencyDefault;
    this.defaultCurrency = this.productService.empresaSeleccionada.coCurrencyDefault;
    if (this.currencyModuleEnabled) {
      if (currencyModule.idModule > 0 && this.localCurrencyDefault) {
        this.defaultCurrency = this.currencyService.getLocalCurrency().coCurrency;
      } else {
        this.defaultCurrency = this.currencyService.getHardCurrency().coCurrency;
      }
    }
    if (this.searchText) {
      if (this.productService.productList.length > 0) {
        this.productList = this.filterProductList(this.productService.productList);
      } else {
        this.productService.getProductsSearchedByCoProductAndNaProduct(this.db.getDatabase(),
          this.searchText, this.productService.empresaSeleccionada.idEnterprise, this.defaultCurrency).then(() => {
            this.productList = this.filterProductList(this.productService.productList);
          });
      }
    } else {
      this.idProductStructureList = this.productStructureService.idProductStructureList;
      this.coProductStructureListString = this.productStructureService.coProductStructureListString;
      this.productService.getProductsByCoProductStructureAndIdEnterprise(this.db.getDatabase(),
        this.idProductStructureList, this.empresaSeleccionada.idEnterprise, this.defaultCurrency).then(() => {
          this.productList = this.filterProductList(this.productService.productList);
        });
    }
  }

  filterProductList(list: ProductUtil[]) {
    if (this.orderService.hideStock0){
      list = list.filter(product => product.stock && product.stock > 0);
    }

    return list;
  }

  searchSubscription: Subscription = this.productService.productoSearch.subscribe((data) => {
    this.searchText = data;
    if (this.searchText) {
      this.productService.getProductsSearchedByCoProductAndNaProduct(this.db.getDatabase(),
        this.searchText, this.productService.empresaSeleccionada.idEnterprise, this.defaultCurrency).then(() => {
          this.productList = this.filterProductList(this.productService.productList);
        });
    }
  });

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
    this.subs.unsubscribe();
  }

  onIonInfinite(ev: any) {
    setTimeout(() => {
      console.log("cargando...")

      if (this.endPro >= this.productList.length) {
        this.infiniteScroll.disabled = true;
      } else {
        this.endPro += this.qtyPro;
      }

      (ev as InfiniteScrollCustomEvent).target.complete();
    }, 500);
  }

  onShowProductDetail(product: ProductUtil) {
    console.log('Muthen 1');
    this.selectedProduct = product;
    this.productService.getProductDetailByIdProduct(this.db.getDatabase(), this.selectedProduct.idList, this.selectedProduct.idProduct, this.defaultCurrency).then(() => {
      this.productDetail = this.productService.productDetail;
      this.selectedProductChanged.emit(this.productDetail);
    });
  }

  formatNumber(num: number) {
    return this.productService.formatNumber(num);
  }

}
