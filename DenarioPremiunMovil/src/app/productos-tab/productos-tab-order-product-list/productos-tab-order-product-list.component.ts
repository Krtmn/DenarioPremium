import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, QueryList, Renderer2, ViewChild, ViewChildren, inject } from '@angular/core';
import { InfiniteScrollCustomEvent, IonAccordionGroup, IonInput } from '@ionic/angular';
import { Subject, Subscription } from 'rxjs';
import { ProductUtil } from 'src/app/modelos/ProductUtil';
import { OrderUtil } from 'src/app/modelos/orderUtil';
import { Discount } from 'src/app/modelos/tables/discount';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { IvaList } from 'src/app/modelos/tables/iva';
import { List } from 'src/app/modelos/tables/list';
import { Warehouse } from 'src/app/modelos/tables/warehouse';
import { PedidosService } from 'src/app/pedidos/pedidos.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { ImageServicesService } from 'src/app/services/imageServices/image-services.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ProductStructureService } from 'src/app/services/productStructures/product-structure.service';
import { ProductService } from 'src/app/services/products/product.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
  selector: 'productos-tab-order-product-list',
  templateUrl: './productos-tab-order-product-list.component.html',
  styleUrls: ['./productos-tab-order-product-list.component.scss'],
  standalone: false
})
export class ProductosTabOrderProductListComponent implements OnInit {
  productStructureService = inject(ProductStructureService);
  productService = inject(ProductService);
  public message = inject(MessageService);
  public orderServ = inject(PedidosService);
  public currencyServ = inject(CurrencyService);
  db = inject(SynchronizationDBService);
  imageServices = inject(ImageServicesService);

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

  @ViewChildren('quAmountInput') quAmountInputs!: QueryList<IonInput>;
  @ViewChild('accordionGroup') accordionGroup!: IonAccordionGroup;
  page = 0;
  scrollDisable = false;
  productList: ProductUtil[] = [];
  orderUtilList: OrderUtil[] = []
  showProductList: Boolean = false;
  idProductStructureList: number[] = [];
  coProductStructureListString: string = "";

  nameProductStructure = "";
  ivaList: IvaList[] = [];
  warehouseList: Warehouse[] = [];

  quInputMode = 'numeric';

  modoLista = 'structure'
  psClicked!: any;
  featuredPSClicked!: any;

  favoritePSClicked!: any;

  carritoButtonClicked!: any;
  searchSub!: any;

  detailModal = false;
  discountModal = false;
  productoModal!: OrderUtil;

  disablePriceListSelector = false;
  public imagesMap: { [imgName: string]: string } = {};
  private subs = new Subscription();

  constructor(

    private cd: ChangeDetectorRef,
  ) { }


  ngOnInit() {
    console.log('Estoy en Pedido');
    this.subs.add(
      this.imageServices.imageLoaded$.subscribe(({ imgName, imgSrc }) => {
        this.imagesMap[imgName] = imgSrc;
        this.cd.markForCheck();
      })
    );

    // Reemite imágenes cacheadas (si existen)
    this.imageServices.emitCachedImages();

    this.ivaList = this.orderServ.ivaList;
    this.disablePriceListSelector = (!this.orderServ.userCanChangePriceListProduct);
    this.searchSub = this.productService.onSearchClicked.subscribe((data) => {
      this.showProductList = true;
      this.productList = this.productService.productList;
      this.orderUtilList = this.orderServ.productListToOrderUtil(this.productList);
    });

    this.psClicked = this.productService.productStructureCLicked.subscribe((data) => {
      this.showProductList = data;
      this.page = 0;
      this.modoLista = 'structure';
      this.scrollDisable = false;
      this.nameProductStructure = this.productStructureService.nombreProductStructureSeleccionada;
      if (this.showProductList) {
        this.idProductStructureList = this.productStructureService.idProductStructureList;
        this.coProductStructureListString = this.productStructureService.coProductStructureListString;
        // this.ivaList = this.orderServ.ivaList;
        this.warehouseList = this.orderServ.listaWarehouse;
        this.productService.getProductsByCoProductStructureAndIdEnterprisePaged(this.db.getDatabase(),
          this.idProductStructureList, this.empresaSeleccionada.idEnterprise, this.orderServ.monedaSeleccionada.coCurrency,
          this.orderServ.userCanChangeWarehouse, this.orderServ.cliente.idClient, this.orderServ.listaSeleccionada.idList, this.page).then(() => {
            this.productList = this.productService.productList;
            this.orderUtilList = this.orderServ.productListToOrderUtil(this.productList);
          });
      }
    });

    //caso featuredProduct:
    this.featuredPSClicked = this.productService.featuredStructureClicked.subscribe((showList) => {
      this.showProductList = showList;
      this.nameProductStructure = this.productStructureService.nombreProductStructureSeleccionada;
      if (this.showProductList) {
        this.modoLista = 'featured';
        this.scrollDisable = false;
        this.page = 0;
        this.idProductStructureList = this.productStructureService.idProductStructureList;
        this.coProductStructureListString = this.productStructureService.coProductStructureListString;
        //this.ivaList = this.orderServ.ivaList;
        this.warehouseList = this.orderServ.listaWarehouse;
        //usamos featured product = true en lugar de la estrucutura
        this.productService.getFeaturedProducts(this.db.getDatabase(),
          this.empresaSeleccionada.idEnterprise, this.orderServ.monedaSeleccionada.coCurrency,
          this.orderServ.userCanChangeWarehouse, this.orderServ.cliente.idClient, this.orderServ.listaSeleccionada.idList, this.page).then(() => {
            this.productList = this.productService.productList;
            this.orderUtilList = this.orderServ.productListToOrderUtil(this.productList);
          });
      }
    });
    //caso favorito:
    this.favoritePSClicked = this.productService.favoriteStructureClicked.subscribe((showList) => {
      this.showProductList = showList;
      this.nameProductStructure = this.productStructureService.nombreProductStructureSeleccionada;
      if (this.showProductList) {
        this.modoLista = 'favorite';
        this.scrollDisable = false;
        this.page = 0;
        this.idProductStructureList = this.productStructureService.idProductStructureList;
        this.coProductStructureListString = this.productStructureService.coProductStructureListString;

        this.warehouseList = this.orderServ.listaWarehouse;
        //buscamos en la tabla de favoritos
        this.productService.getFavoriteProducts(this.db.getDatabase(),
          this.empresaSeleccionada.idEnterprise, this.orderServ.monedaSeleccionada.coCurrency,
          this.orderServ.userCanChangeWarehouse, this.orderServ.cliente.idClient, this.orderServ.listaSeleccionada.idList, this.page).then(() => {
            this.productList = this.productService.productList;
            this.orderUtilList = this.orderServ.productListToOrderUtil(this.productList);
          });
      }

    });

    //caso carrito:
    this.carritoButtonClicked = this.productService.carritoButtonClicked.subscribe((showList) => {
      this.showProductList = showList;
      this.modoLista = 'carrito';
      this.orderUtilList = this.orderServ.carrito;
      this.nameProductStructure = this.orderServ.getTag("PED_CARRITO")
    });

    this.cantidadInputMode();
  }

  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.page++;
    switch (this.modoLista) {
      case 'structure':
        this.productService.getProductsByCoProductStructureAndIdEnterprisePaged(this.db.getDatabase(),
          this.idProductStructureList, this.empresaSeleccionada.idEnterprise, this.orderServ.monedaSeleccionada.coCurrency,
          this.orderServ.userCanChangeWarehouse, this.orderServ.cliente.idClient, this.orderServ.listaSeleccionada.idList, this.page).then(() => {
            this.updateList(ev);
          });
        break;

      case 'favorite':
        this.productService.getFavoriteProducts(this.db.getDatabase(),
          this.empresaSeleccionada.idEnterprise, this.orderServ.monedaSeleccionada.coCurrency,
          this.orderServ.userCanChangeWarehouse, this.orderServ.cliente.idClient, this.orderServ.listaSeleccionada.idList, this.page).then(() => {
            this.updateList(ev);
          });
        break;

      case 'featured':
        this.productService.getFeaturedProducts(this.db.getDatabase(),
          this.empresaSeleccionada.idEnterprise, this.orderServ.monedaSeleccionada.coCurrency,
          this.orderServ.userCanChangeWarehouse, this.orderServ.cliente.idClient, this.orderServ.listaSeleccionada.idList, this.page).then(() => {
            this.updateList(ev);
          });
        break;

      case 'carrito':
        //no hay que hacer nada, ya que el carrito no tiene paginacion
        this.scrollDisable = true;
        ev.target.complete(); //termina la animacion del infiniteScroll
        break;
    }

  }

  updateList(ev: InfiniteScrollCustomEvent) {
    if (this.productService.productList.length == 0) {
      this.scrollDisable = true;
    } else {
      let tempList = this.orderServ.productListToOrderUtil(this.productService.productList);
      for (let i = 0; i < tempList.length; i++) {
        const item = tempList[i];
        this.orderUtilList.push(item);
      }

    }
    ev.target.complete(); //termina la animacion del infiniteScroll
  }

  loadProductToModal(prod: OrderUtil) {
    this.productoModal = prod;
    this.showDetailModal(true);
  }

  showDetailModal(show: boolean) {
    //console.log("SHOW ME THE MODAL");
    this.detailModal = show;

    if (!show) {
      //al ocultar el modal agregamos el producto al carrito
      this.orderServ.alCarrito(this.productoModal);
    }
  }

  // orderServ.getTag(tagName: string){
  //   var tag = this.orderServ.tags.get(tagName);
  //   if(tag == undefined){
  //     console.log("Error al buscar tag "+tagName);
  //     tag = '' ;
  // }
  //   return tag;
  // }

  getUnitName(prod: OrderUtil) {
    return prod.unitList.filter(u => u.idUnit == prod.idUnit)[0].naUnit;
  }


  ngOnDestroy(): void {
    this.psClicked.unsubscribe();
    this.featuredPSClicked.unsubscribe();
    this.favoritePSClicked.unsubscribe();
    this.searchSub.unsubscribe();
  }

  onProductQuantityChange(prod: OrderUtil) {
    let unit = prod.unitList.filter(u => prod.idUnit == u.idUnit)[0];
    if ((!this.orderServ.userCanSelectProductDiscount) && (prod.discountList.length > 1)) {
      this.autoDiscount(prod);
    }
    if (prod.quStock == 0) {
      if (this.orderServ.stock0) {
        //no hay que chequear inventario
        unit.quAmount = prod.quAmount;
        this.orderServ.alCarrito(prod);
        return;
      } else {
        if (prod.quStockAux == prod.quAmount) {
          //se llevo la cantidad justa. no hay problema
          unit.quAmount = prod.quAmount;
          this.orderServ.alCarrito(prod);
        } else {
          this.message.transaccionMsjModalNB(this.orderServ.getTag("PED_ERROR_STOCK0"));
          prod.quAmount = 0;
        }

      }
    }

    //hay que chequear inventario
    if (this.orderServ.validStock) {
      prod.quStock = prod.quStockAux - prod.quAmount;
    }
    if (this.orderServ.validStock && (prod.quAmount > prod.quStockAux)) {
      this.message.transaccionMsjModalNB(this.orderServ.getTag("PED_ERROR_INVENTARIO"));
      prod.quAmount = 0;
    } else {
      unit.quAmount = prod.quAmount;
      this.orderServ.alCarrito(prod);
    }

  }

  onProductQuantityInput(prod: OrderUtil) {
    //igual que onProductQuantityChange, pero no mando al carrito
    let unit = prod.unitList.filter(u => prod.idUnit == u.idUnit)[0];
    if ((!this.orderServ.userCanSelectProductDiscount) && (prod.discountList.length > 1)) {
      this.autoDiscount(prod);
    }
    if (this.orderServ.stock0 && prod.quStock == 0) {
      //no hay que chequear inventario
      unit.quAmount = prod.quAmount;
      //this.orderServ.alCarrito(prod);
      return;
    }
    //hay que chequear inventario
    if (this.orderServ.validStock) {
      prod.quStock = prod.quStockAux - prod.quAmount;
    }
    if (this.orderServ.validStock && (prod.quAmount > prod.quStockAux)) {
      this.message.transaccionMsjModalNB(this.orderServ.getTag("PED_ERROR_INVENTARIO"));
      prod.quAmount = 0;
    } else {
      unit.quAmount = prod.quAmount;
      //this.orderServ.alCarrito(prod);
    }

  }

  getDiscountName(discount: Discount) {
    if (discount.idDiscount == 0) {
      return this.orderServ.getTag("PED_PLACEHOLDER_DCTO");
    } else {
      return discount.quDiscount.toString();
    }
  }

  loadDiscount(prod: OrderUtil) {
    this.productoModal = prod;
    this.showDiscountModal(true);
  }

  showDiscountModal(val: boolean) {
    this.discountModal = val;
  }

  autoDiscount(prod: OrderUtil) {
    for (let i = 0; i < prod.discountList.length; i++) {
      if (prod.quAmount >= prod.discountList[i].quVolIni && prod.quAmount <= prod.discountList[i].quVolFin) {
        prod.idDiscount = prod.discountList[i].idDiscount;
        prod.quDiscount = prod.discountList[i].quDiscount;
        return;
      }
    }
  }
  onShowProductStructures() {
    this.showProductList = false;
    this.productStructureService.onAddProductCLicked();
  }

  onSelectProductDev() {
    console.log('Devolucion not implemented.');
  }

  onSelectProductPed(i: number, prod: OrderUtil) {

    if (!this.orderServ.stock0 && (prod.quStock < 1)) {
      this.message.transaccionMsjModalNB(this.orderServ.getTag("PED_ERROR_STOCK0"));
      //this.accordionGroup.value = undefined;
    } else {
      //const nativeEl = this.accordionGroup;
      if (this.accordionGroup.value !== prod.coProduct) {
        setTimeout(() => {
          this.quAmountInputs.toArray()[i].setFocus();
        }, 150);
      }
    }
  }

  onSelectPriceList(e: any, product: OrderUtil) {
    const idList = e.detail.value as number;
    product.idList = idList;

    let pricelist = this.orderServ.listaPricelist.filter(pl => pl.idProduct == product.idProduct && pl.idList == idList)[0];
    product.idPriceList = pricelist.idPriceList;
    product.coPriceList = pricelist.coPriceList;

    product.nuPrice = pricelist.nuPrice;
    this.orderServ.alCarrito(product);
  }

  onSelectUnit(e: any, product: OrderUtil) {
    const unit = e.detail.value;
    product.idUnit = unit;
    this.orderServ.alCarrito(product);
    product.quAmount = 0;
  }

  onSelectIVA(e: any, product: OrderUtil) {
    const iva = e.detail.value;
    product.iva = iva
    this.orderServ.alCarrito(product);
  }

  onSelectDiscount(e: any, product: OrderUtil) {
    const idDiscount = e.detail.value;
    let dc = product.discountList.filter(dc => dc.idDiscount == idDiscount)[0];
    if (dc == undefined) {
      console.log("no se encontro el descuento " + idDiscount);

    } else {
      product.idDiscount = dc.idDiscount;
      product.quDiscount = dc.quDiscount;
    }


    this.orderServ.alCarrito(product);

  }

  onSelectWarehouse(e: any, product: OrderUtil) {
    const wh = e.detail.value;
    product.idWarehouse = wh.idWarehouse;
    product.naWarehouse = wh.naWarehouse;

    this.orderServ.alCarrito(product);

  }

  cantidadInputMode() {
    if (this.orderServ.quUnitDecimals) {
      this.quInputMode = 'decimal';
    } else {
      this.quInputMode = 'numeric';
    }
  }

  quStock(prod: OrderUtil) {
    let stock = prod.quStock;
    let unit = prod.unitList.filter(u => prod.idUnit == u.idUnit)[0];
    return Math.floor(stock / unit.quUnit);
  }


  formatNum(input: number) {
    return this.currencyServ.formatNumber(input);
  }

  onSelectProductInv() {
    console.log('Inventario not implemented.');
  }
}