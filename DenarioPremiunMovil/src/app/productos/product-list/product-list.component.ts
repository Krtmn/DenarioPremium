import { Component, DoCheck, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { InfiniteScrollCustomEvent, IonInfiniteScroll } from '@ionic/angular';
import { Subject, Subscription } from 'rxjs';
import { ProductDetail } from 'src/app/modelos/ProductDetail';
import { ProductUtil } from 'src/app/modelos/ProductUtil';
import { Imagenes } from 'src/app/modelos/imagenes';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { Product } from 'src/app/modelos/tables/product';
import { ProductStructureCount } from 'src/app/modelos/tables/productStructureCount';
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

  productService = inject(ProductService);
  productStructureService = inject(ProductStructureService);
  services = inject(ServicesService);
  db = inject(SynchronizationDBService);
  message = inject(MessageService);
  imageServices = inject(ImageServicesService);
 

  @Input()
  productTags = new Map<string, string>([]);
  @Input()
  empresaSeleccionada!: Enterprise;
  @Input()
  psSeleccionada!: ProductStructureCount;
  @Input()
  searchText: string = '';

  productList: ProductUtil[] = [];
  productListView: ProductUtil[] = [];
  idProductStructureList: number[] = [];
  coProductStructureListString: string = "";
  selectedProduct!: ProductUtil;
  productDetail!: ProductDetail;
  productModule: Boolean = false;
  startPro: number = 0;
  endPro: number = 20;
  qtyPro: number = 20;

  @Output()
  selectedProductChanged: EventEmitter<ProductDetail> = new EventEmitter<ProductDetail>();

  @ViewChild(IonInfiniteScroll)
  infiniteScroll!: IonInfiniteScroll;

  constructor() { }

  ngOnInit() {
    if (this.searchText) {
      if (this.productService.productList.length > 0) {
        this.productList = this.productService.productList;
      } else {
        this.productService.getProductsSearchedByCoProductAndNaProduct(this.db.getDatabase(),
          this.searchText, this.productService.empresaSeleccionada.idEnterprise, this.productService.empresaSeleccionada.coCurrencyDefault).then(() => {
            this.productList = this.productService.productList;
          });
      }
    } else {
      this.idProductStructureList = this.productStructureService.idProductStructureList;
      this.coProductStructureListString = this.productStructureService.coProductStructureListString;
      this.productService.getProductsByCoProductStructureAndIdEnterprise(this.db.getDatabase(),
        this.idProductStructureList, this.empresaSeleccionada.idEnterprise, this.empresaSeleccionada.coCurrencyDefault).then(() => {
          this.productList = this.productService.productList;
        });
    }
  }

  searchSubscription: Subscription = this.productService.productoSearch.subscribe((data) => {
    this.searchText = data;
    if (this.searchText) {
      this.productService.getProductsSearchedByCoProductAndNaProduct(this.db.getDatabase(),
          this.searchText, this.productService.empresaSeleccionada.idEnterprise, this.productService.empresaSeleccionada.coCurrencyDefault).then(() => {
            this.productList = this.productService.productList;
          });
  }
});

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }

  onIonInfinite(ev: any) {
    setTimeout(() => {
      console.log("cargando...")
      
      if (this.endPro >= this.productList.length) {
        this.infiniteScroll.disabled = true;
      }else{
        this.endPro += this.qtyPro;
      }

      (ev as InfiniteScrollCustomEvent).target.complete();
    }, 500);
  }

  onShowProductDetail(product: ProductUtil) {
    console.log('Muthen 1');
    this.selectedProduct = product;
    this.productService.getProductDetailByIdProduct(this.db.getDatabase(),this.selectedProduct.idList, this.selectedProduct.idProduct, this.productService.empresaSeleccionada.coCurrencyDefault).then(() => {
      this.productDetail = this.productService.productDetail;
      this.selectedProductChanged.emit(this.productDetail);
    });
  }

  formatNumber(num: number) {
    return this.productService.formatNumber(num);
  }

}
