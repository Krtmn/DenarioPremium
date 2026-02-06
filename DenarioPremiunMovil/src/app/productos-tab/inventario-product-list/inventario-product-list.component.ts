
import { ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { ProductUtil } from 'src/app/modelos/ProductUtil';
import { Inventarios } from 'src/app/modelos/inventarios';
import { ClientStocksDetailUnits, ClientStocksDetail, ClientStocks } from 'src/app/modelos/tables/client-stocks';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { InventariosLogicService } from 'src/app/services/inventarios/inventarios-logic.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { ImageServicesService } from 'src/app/services/imageServices/image-services.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ProductStructureService } from 'src/app/services/productStructures/product-structure.service';
import { ProductService } from 'src/app/services/products/product.service';
import { ServicesService } from 'src/app/services/services.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { DELIVERY_STATUS_SAVED, DELIVERY_STATUS_SENT, DELIVERY_STATUS_TO_SEND, VISIT_STATUS_TO_SEND, VISIT_STATUS_VISITED } from 'src/app/utils/appConstants'
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'inventario-product-list',
  templateUrl: './inventario-product-list.component.html',
  styleUrls: ['./inventario-product-list.component.scss'],
  standalone: false
})
export class InventarioProductListComponent implements OnInit {

  @Input()
  empresaSeleccionada!: Enterprise;
  @Input()
  productsTabTags = new Map<string, string>([]);
  @Input()
  searchText: string = '';

  public productListSub: any;
  public productStructureService = inject(ProductStructureService);
  public productService = inject(ProductService);
  public inventariosLogicService = inject(InventariosLogicService)
  public globalConfig = inject(GlobalConfigService);
  public dateServ = inject(DateServiceService);
  public services = inject(ServicesService);
  public db = inject(SynchronizationDBService);
  public message = inject(MessageService);
  public serviceImages = inject(ImageServicesService);
  public messageAlert!: MessageAlert;

  public clientStocksTags = new Map<string, string>([]);
  public showReturnDetail: Boolean = true;
  public psClicked!: any;
  public favClicked!: any;
  public featClicked!: any;
  public idProductStructureList: number[] = [];
  public coProductStructureListString: string = "";

  public cantidadSeleccionada!: Number;
  public loteSeleccionado!: string;
  public showProductStructure: Boolean = true;
  public esconder: Boolean = false;
  public typeStockMethod: string = "";
  public imagesMap: { [imgName: string]: string } = {};
  searchSub: any;
  searchTextChanged: any;
  private subs = new Subscription();
  noProductsAlertShown = false;

  constructor(
    private cd: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {

    this.subs.add(
      this.serviceImages.imageLoaded$.subscribe(({ imgName, imgSrc }) => {
        this.imagesMap[imgName] = imgSrc;
        this.cd.markForCheck();
      })
    );

    this.searchText = '';

    console.log('Estoy en inventario');
    this.inventariosLogicService.productSelected = {} as ProductUtil
    this.psClicked = this.productService.productStructureCLicked.subscribe((data) => {
      this.inventariosLogicService.showProductList = data;
      if (this.inventariosLogicService.showProductList) {
        this.idProductStructureList = this.productStructureService.idProductStructureList;
        this.coProductStructureListString = this.productStructureService.coProductStructureListString;
        this.productService.getProductsByCoProductStructureAndIdEnterprise(this.db.getDatabase(),
          this.idProductStructureList, this.empresaSeleccionada.idEnterprise, this.empresaSeleccionada.coCurrencyDefault).then(() => {
            this.noProductsAlertShown = false;
            this.inventariosLogicService.newClientStock.productList = this.productService.productList;
            this.noProductsAlertShown = this.inventariosLogicService.newClientStock.productList.length === 0;
            /* this.inventariosLogicService.setVariablesMap(); */
          });
      }
    });

    this.searchTextChanged = this.productService.searchTextChanged.subscribe((value) => {
      this.searchText = value;
    });

    this.searchSub = this.productService.onSearchClicked.subscribe((data) => {
      /*this.productService.getProductsSearchedByCoProductAndNaProduct(
        this.searchText,
        this.empresaSeleccionada.idEnterprise,
        this.empresaSeleccionada.coCurrencyDefault,).then(() => {*/
      this.inventariosLogicService.showProductList = data;
      this.noProductsAlertShown = false;
      this.inventariosLogicService.newClientStock.productList = this.productService.productList;
      this.noProductsAlertShown = this.inventariosLogicService.newClientStock.productList.length === 0;
      //  });
    });

    this.featClicked = this.productService.featuredStructureClicked.subscribe((data) => {
      this.productService.getFeaturedProducts(this.db.getDatabase(),
        this.empresaSeleccionada.idEnterprise,
        this.empresaSeleccionada.coCurrencyDefault,
        this.globalConfig.get('userCanChangeWarehouse') === 'true',
        this.inventariosLogicService.cliente.idClient,
        this.inventariosLogicService.cliente.idList,
        0).then(() => {
          this.noProductsAlertShown = false;
          this.inventariosLogicService.showProductList = data;
          this.inventariosLogicService.newClientStock.productList = this.productService.productList;
          this.noProductsAlertShown = this.inventariosLogicService.newClientStock.productList.length === 0;
        }
        )
    });

    this.favClicked = this.productService.favoriteStructureClicked.subscribe((data) => {
      this.productService.getFavoriteProducts(this.db.getDatabase(),
        this.empresaSeleccionada.idEnterprise,
        this.empresaSeleccionada.coCurrencyDefault,
        this.globalConfig.get('userCanChangeWarehouse') === 'true',
        this.inventariosLogicService.cliente.idClient,
        this.inventariosLogicService.cliente.idList,
        0).then(() => {
          this.noProductsAlertShown = false;
          this.inventariosLogicService.showProductList = true;
          this.inventariosLogicService.newClientStock.productList = this.productService.productList;
          this.noProductsAlertShown = this.inventariosLogicService.newClientStock.productList.length === 0;
        }
        )
    });
    //}
  }

  ngOnDestroy(): void {
    this.searchSub.unsubscribe();
    this.psClicked.unsubscribe();
    this.featClicked.unsubscribe();
    this.favClicked.unsubscribe();
    this.subs.unsubscribe();
    this.searchTextChanged.unsubscribe();
  }

  onShowProductStructures() {
    this.inventariosLogicService.onShowProductStructures();
    this.productService.onBackButtonClicked();
    this.productService.searchStructures = true;
    /* this.inventariosLogicService.showProductList = false;
    this.productStructureService.onAddProductCLicked(); */
  }

  onSelectProductInv(index: number, prod: ProductUtil) {
    this.inventariosLogicService.productSelected = prod;
    this.inventariosLogicService.productSelectedIndex = index;
    this.inventariosLogicService.productSelected.images = this.serviceImages.getImgForProduct(prod.coProduct) ?? undefined;
    let newTypeStock = false;
    this.esconder = true;
    this.inventariosLogicService.typeExh = false;
    this.inventariosLogicService.typeDep = false;
    let indexDetail = this.inventariosLogicService.productTypeStocksMap.get(this.inventariosLogicService.productSelected.idProduct)

    if (this.inventariosLogicService.newClientStock.stDelivery == DELIVERY_STATUS_SAVED) {
      //ES UN INVENTARIO GUARDADO
      if (this.inventariosLogicService.newClientStock.clientStockDetails == undefined
        || this.inventariosLogicService.newClientStock.clientStockDetails.length == 0) {
        this.inventariosLogicService.productTypeStocksMap.set(this.inventariosLogicService.productSelected.idProduct, 0);
        newTypeStock = true;
      } else if (indexDetail == undefined) {
        this.inventariosLogicService.productTypeStocksMap.set(this.inventariosLogicService.productSelected.idProduct,
          this.inventariosLogicService.newClientStock.clientStockDetails.length);

        newTypeStock = true;
      } else {
        newTypeStock = false;

      }
    } else if (this.inventariosLogicService.newClientStock.clientStockDetails == undefined) {
      this.inventariosLogicService.productTypeStocksMap.set(this.inventariosLogicService.productSelected.idProduct, 0);
      newTypeStock = true;
    } else if (this.inventariosLogicService.newClientStock.clientStockDetails.length == 0) {
      //ES UN INVENTARIO NUEVO
      /* this.inventariosLogicService.newClientStock.clientStockDetails[index] = [] as Inventarios[]; */
      this.inventariosLogicService.productTypeStocksMap.set(this.inventariosLogicService.productSelected.idProduct, 0);
      newTypeStock = true;
    } else if (this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!] == undefined) {
      //NO EXISTE ESTE DETAIL
      //NO TENGO EL PRODUCTO
      this.inventariosLogicService.productTypeStocksMap.set(this.inventariosLogicService.productSelected.idProduct,
        this.inventariosLogicService.newClientStock.clientStockDetails.length);
      newTypeStock = true
    } else if (this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!].idProduct == prod.idProduct) {
      //YA TENGO EL PRODUCTO
      newTypeStock = false;
    } else {
      //NO TENGO EL PRODUCTO
      this.inventariosLogicService.productTypeStocksMap.set(this.inventariosLogicService.productSelected.idProduct,
        this.inventariosLogicService.newClientStock.clientStockDetails.length);
      newTypeStock = true
    }

    this.message.showLoading().then(() => {
      if (newTypeStock) {
        /* for (var i = 0; i < this.inventariosLogicService.newClientStock.productList[index].typeStocks!.length; i++)
          if (this.inventariosLogicService.newClientStock.productList[index].typeStocks![i].tipo == 'exh')
            this.inventariosLogicService.typeExh = true;
          else
            this.inventariosLogicService.typeDep = true; */


        this.productService.getUnitsByIdProductOrderByCoPrimaryUnit(this.db.getDatabase(), prod.idProduct).then(() => {
          this.inventariosLogicService.newClientStock.productList[index].productUnitList = this.productService.unitsByProduct;
          this.inventariosLogicService.unitSelected = this.productService.unitsByProduct[0];
          this.inventariosLogicService.showHeaderButtonsFunction(false);
          this.inventariosLogicService.inventarioComp = false;
          this.inventariosLogicService.typeStocksComponent = true;
          this.inventariosLogicService.isEdit = true;
          this.message.hideLoading();
        });
      } else {
        this.productService.getUnitsByIdProductOrderByCoPrimaryUnit(this.db.getDatabase(), prod.idProduct).then(() => {

          for (var i = 0; i < this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!].clientStockDetailUnits.length; i++)
            if (this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!].clientStockDetailUnits[i].ubicacion == 'exh')
              this.inventariosLogicService.typeExh = true;
            else
              this.inventariosLogicService.typeDep = true;

          this.inventariosLogicService.newClientStock.productList[index].productUnitList = this.productService.unitsByProduct;
          this.inventariosLogicService.unitSelected = this.productService.unitsByProduct[0];

          this.inventariosLogicService.showHeaderButtonsFunction(false);
          this.inventariosLogicService.inventarioComp = false;
          this.inventariosLogicService.typeStocksComponent = true;
          this.message.hideLoading();

        });
      }
    })
  }

  compareWith(o1: any, o2: any) {
    return "";
    /* return o1 && o2 ? o1.id === o2.id : o1 === o2; */
  }

  imprimir() {
    console.log(this.inventariosLogicService.newClientStock)
    //console.log(this.serviceImages.mapImages)
  }


}
