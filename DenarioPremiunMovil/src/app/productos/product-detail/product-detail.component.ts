import { Component, Input, OnInit, inject } from '@angular/core';
import { ProductListComponent } from '../product-list/product-list.component';
import { Product } from 'src/app/modelos/tables/product';
import { ProductDetail } from 'src/app/modelos/ProductDetail';
import { List } from 'src/app/modelos/tables/list';
import { PriceListService } from 'src/app/services/priceLists/price-list.service';
import { Warehouse } from 'src/app/modelos/tables/warehouse';
import { StockService } from 'src/app/services/stocks/stock.service';
import { Imagenes } from 'src/app/modelos/imagenes';
import { ImageServicesService } from 'src/app/services/imageServices/image-services.service';
import { Swiper } from 'swiper';
import { register } from 'swiper/element/bundle';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { ProductService } from 'src/app/services/products/product.service';
import { ProductPriceUtil } from 'src/app/modelos/ProductPriceUtil';

register();

@Component({
    selector: 'product-detail',
    templateUrl: './product-detail.component.html',
    styleUrls: ['./product-detail.component.scss'],
    standalone: false
})
export class ProductDetailComponent implements OnInit {

  priceListService = inject(PriceListService);
  productService = inject(ProductService);
  stockService = inject(StockService);
  imageServices = inject(ImageServicesService);
  globalConfig = inject(GlobalConfigService);
  currencyService = inject(CurrencyService);

  @Input()
  productDetailTags = new Map<string, string>([]);
  @Input()
  pSeleccionado!: ProductDetail;

  multiCurrency!: Boolean;
  conversionByPriceList!: Boolean;
  listSeleccionada!: List;
  lists: List[] = [];
  warehouseSeleccionado!: Warehouse;
  warehouses: Warehouse[] = [];
  //listPhotos: Imagenes[] = [];
  listPhotos: string[] = [];

  public swiper!: Swiper;

  constructor() { }

  ngOnInit() {
    /* this.getProductImages(); */
    this.multiCurrency = this.globalConfig.get("multiCurrency") == "true";
    this.conversionByPriceList = this.globalConfig.get("conversionByPriceList") == "true";

    this.priceListService.getListByIdProduct(this.pSeleccionado.idProduct).then(() => {
      this.lists = this.priceListService.productlists;
      this.listSeleccionada = this.lists[0];
    });
    this.stockService.getWarehousesByIdProduct(this.pSeleccionado.idProduct).then(() => {
      this.warehouses = this.stockService.productWarehouses;
      this.warehouseSeleccionado = this.warehouses[0];
    });
    //console.log('pSeleccionado: ' + JSON.stringify(this.pSeleccionado));
  }

  onListChanged(idList: number) {
    this.priceListService.getPriceListByIdListAndIdProduct(idList, this.pSeleccionado.idProduct, this.productService.empresaSeleccionada.coCurrencyDefault).then(() => {
      this.pSeleccionado.priceLocal = this.priceListService.productPrice.priceDefault;
      this.pSeleccionado.coCurrencyLocal = this.priceListService.productPrice.coCurrencyDefault;
      this.pSeleccionado.priceHard = this.priceListService.productPrice.priceOpposite;
      this.pSeleccionado.coCurrencyHard = this.priceListService.productPrice.coCurrencyOpposite;
      console.log('pSeleccionado.priceLocal: ' + this.pSeleccionado.priceLocal);
    });
  }

  onWarehouseChanged(idWarehouse: number) {
    this.stockService.getStockByIdWarehousesAndIdProduct(idWarehouse, this.pSeleccionado.idProduct).then((data: number) => {
      this.pSeleccionado.stock = data;
    });
  }
  formatNumber(num: number) {
    return this.productService.formatNumber(num);
  }

  /*  async getProductImages() {    
         if(this.imageServices.mapImagesFiles.get(this.pSeleccionado.coProduct) === undefined){
          this.listPhotos.push('');
         }else{
          let pathImages = this.imageServices.mapImagesFiles.get(this.pSeleccionado.coProduct);
          for (let index = 0; index < pathImages?.length; index++) {
            const element = array[index];
            
          }
          this.listPhotos = this.imageServices.mapImagesFiles.get(this.pSeleccionado.coProduct)?.values();
         }
    }  */


}
