import { EventEmitter, Injectable, inject } from '@angular/core';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { TypeProductStructure } from 'src/app/modelos/tables/typeProductStructure';
import { ProductDetail } from 'src/app/modelos/ProductDetail';
import { ProductUtil } from 'src/app/modelos/ProductUtil';
import { ProductStructureService } from '../productStructures/product-structure.service';
import { Subject } from 'rxjs';
import { Unit } from 'src/app/modelos/tables/unit';
import { Filesystem } from '@capacitor/filesystem';
import { ImageServicesService } from '../imageServices/image-services.service';
import { Imagenes } from 'src/app/modelos/imagenes';
import { CurrencyService } from '../currency/currency.service';
import { GlobalConfigService } from '../globalConfig/global-config.service';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  //dbServ = inject(SynchronizationDBService);
  imageServices = inject(ImageServicesService);
  currencyService = inject(CurrencyService);
  globalConfig = inject(GlobalConfigService);
  psService = inject(ProductStructureService);

  public productList: ProductUtil[] = [];
  public typeProductStructureList: TypeProductStructure[] = [];
  public coProductStructureList: string[] = [];
  public productDetail!: ProductDetail;
  public empresaSeleccionada!: Enterprise;
  public listaEmpresa: Enterprise[] = [];
  public multiempresa: Boolean = false;
  public unitsByProduct: Unit[] = [];
  public showStock: boolean = true;

  productoSearch = new Subject<string>;
  onSearchClicked = new Subject<Boolean>;
  productStructureCLicked = new Subject<Boolean>;
  featuredStructureClicked = new Subject<Boolean>;
  backButtonClicked = new Subject<Boolean>;
  favoriteStructureClicked = new Subject<Boolean>;
  carritoButtonClicked = new Subject<Boolean>();

  searchTextChanged = new Subject<string>();
  searchStructures = false; //flag para saber si se busca en todas las estructuras.

  itemsXPagina = 20;

  constructor() { }

  onProductSearch(search: string) {
    this.productoSearch.next(search);

  }

  onProductStructureCLicked() {
    this.productStructureCLicked.next(true);
  }

  onProductTabSearchClicked() {
    this.onSearchClicked.next(true);
  }

  onFeaturedStructureClicked() {
    this.featuredStructureClicked.next(true);
  }

  onFavoriteStructureClicked() {
    this.favoriteStructureClicked.next(true);
  }

  onCarritoButtonClicked() {
    this.carritoButtonClicked.next(true);
  }

  onBackButtonClicked() {
    this.backButtonClicked.next(true);
  }

  getProductsByCoProductStructureAndIdEnterprise(dbServ: SQLiteObject, idProductStructures: number[], idEnterprise: number, coCurrency: string) {
    var database = dbServ;
    this.productList = [];
    if (this.globalConfig.get("conversionByPriceList") == "true") {
      var select = "select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, " +
        " (select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as id_list, " +
        " (select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product order by l.na_list limit 1) as nu_price, " +
        " (select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product order by l.na_list limit 1) as co_currency, " +
        " (select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product order by l.na_list limit 1) as nu_price_opposite, " +
        " (select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product order by l.na_list limit 1) as co_currency_opposite, " +
        " (select s.qu_stock from stocks s join warehouses w on s.id_warehouse = w.id_warehouse where s.id_product = p.id_product order by w.na_warehouse limit 1) as qu_stock, p.id_enterprise, p.co_enterprise FROM products p WHERE p.id_product_structure in ( " + idProductStructures + " ) ORDER BY p.nu_priority ASC;"
      return database.executeSql(select, []).then(result => {
        this.productList = [];
        for (let i = 0; i < result.rows.length; i++) {
          this.productList.push({
            idProduct: result.rows.item(i).id_product,
            coProduct: result.rows.item(i).co_product,
            naProduct: result.rows.item(i).na_product,
            points: result.rows.item(i).points,
            txDescription: result.rows.item(i).tx_description,
            idList: result.rows.item(i).id_list,
            price: result.rows.item(i).nu_price,
            coCurrency: result.rows.item(i).co_currency,
            priceOpposite: result.rows.item(i).nu_price_opposite,
            coCurrencyOpposite: result.rows.item(i).co_currency_opposite,
            stock: result.rows.item(i).qu_stock,
            idEnterprise: result.rows.item(i).id_enterprise,
            coEnterprise: result.rows.item(i).co_enterprise,
            images: this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: result.rows.item(i).id_product_structure,
          });
        }
      }).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    } else {
      var select = "select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, " +
        "(select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as id_list, " +
        "(select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as nu_price, " +
        "(select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as co_currency, " +
        "(select s.qu_stock from stocks s join warehouses w on s.id_warehouse = w.id_warehouse where s.id_product = p.id_product order by w.na_warehouse limit 1) as qu_stock, " +
        'p.id_enterprise, p.co_enterprise FROM products p WHERE p.id_product_structure in ( ' + idProductStructures + ' ) AND p.id_enterprise = ? ORDER BY p.nu_priority ASC'
      return database.executeSql(select, [idEnterprise]).then(result => {
        this.productList = [];
        for (let i = 0; i < result.rows.length; i++) {
          var item = result.rows.item(i);
          var product = {
            idProduct: item.id_product,
            coProduct: item.co_product,
            naProduct: item.na_product,
            points: item.points,
            txDescription: item.tx_description,
            idList: item.id_list,
            price: item.nu_price,
            coCurrency: item.co_currency,
            priceOpposite: item.co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.toHardCurrency(item.nu_price) :
              this.currencyService.toLocalCurrency(item.nu_price), // Precio en la moneda opuesta a la lista de precio
            coCurrencyOpposite: item.co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.hardCurrency.coCurrency :
              this.currencyService.localCurrency.coCurrency, // moneda opuesta a la lista de precio,
            stock: item.qu_stock,
            idEnterprise: item.id_enterprise,
            coEnterprise: item.co_enterprise,
            images: this.imageServices.mapImagesFiles.get(item.co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(item.co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: item.id_product_structure,
          };
          if (coCurrency != product.coCurrency) {
            //intercambiamos precios y monedas
            let tempPrice = product.price;
            let tempCurrency = product.coCurrency;
            product.price = product.priceOpposite ? product.priceOpposite : 0;
            product.coCurrency = product.coCurrencyOpposite;
            product.priceOpposite = tempPrice;
            product.coCurrencyOpposite = tempCurrency;
          }
          this.productList.push(product);
        }
      }).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    }
  }

  getProductsByCoProductStructureAndIdEnterprisePaged(dbServ: SQLiteObject, idProductStructures: number[], idEnterprise: number, coCurrency: string, userCanChangeWarehouse: boolean, id_client: number, id_list: number, page: number,) {
    var database = dbServ;
    var offset = page * this.itemsXPagina;
    this.productList = [];
    if (this.globalConfig.get("conversionByPriceList") == "true") {
      var select = "select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, " +
        " (select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as id_list, " +
        " (select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as nu_price, " +
        " (select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as co_currency, " +
        " (select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as nu_price_opposite, " +
        " (select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as co_currency_opposite, ";
      if (userCanChangeWarehouse) {
        select = select + " (select s.qu_stock from stocks s join warehouses w on s.id_warehouse = w.id_warehouse where s.id_product = p.id_product order by w.na_warehouse limit 1) as qu_stock, ";
      } else {
        select = select + " (select s.qu_stock from stocks s where s.id_product = p.id_product AND s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = " + id_client + " AND c.id_enterprise = p.id_enterprise)) as qu_stock, ";
      }
      select = select +
        " p.id_enterprise, p.co_enterprise FROM products p WHERE p.id_product_structure in ( " + idProductStructures + " ) ";
      if (!userCanChangeWarehouse) {
        //filtramos que solo aparezcan los productos del almacen del cliente
        select = select + 'AND p.id_product in (select s.id_product from stocks s where  s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = ' + id_client + ' AND c.id_enterprise = p.id_enterprise)) ';
      }
      select = select + "ORDER BY p.nu_priority ASC  limit ? offset ?"
      return database.executeSql(select, [this.itemsXPagina, offset]).then(result => {
        this.productList = [];
        for (let i = 0; i < result.rows.length; i++) {
          this.productList.push({
            idProduct: result.rows.item(i).id_product,
            coProduct: result.rows.item(i).co_product,
            naProduct: result.rows.item(i).na_product,
            points: result.rows.item(i).points,
            txDescription: result.rows.item(i).tx_description,
            idList: result.rows.item(i).id_list,
            price: result.rows.item(i).nu_price,
            coCurrency: result.rows.item(i).co_currency,
            priceOpposite: result.rows.item(i).nu_price_opposite,
            coCurrencyOpposite: result.rows.item(i).co_currency_opposite,
            stock: result.rows.item(i).qu_stock,
            idEnterprise: result.rows.item(i).id_enterprise,
            coEnterprise: result.rows.item(i).co_enterprise,
            images: this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: result.rows.item(i).id_product_structure,
          });
        }
      }).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    } else {
      var select = "select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, " +
        "(select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as id_list, " +
        "(select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as nu_price, " +
        "(select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as co_currency, "
      if (userCanChangeWarehouse) {
        select = select + "(select s.qu_stock from stocks s join warehouses w on s.id_warehouse = w.id_warehouse where s.id_product = p.id_product order by w.na_warehouse limit 1) as qu_stock, ";
      } else {
        select = select + " (select s.qu_stock from stocks s where s.id_product = p.id_product AND s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = " + id_client + " AND c.id_enterprise = p.id_enterprise)) as qu_stock, ";
      }
      select = select +
        'p.id_enterprise, p.co_enterprise FROM products p WHERE p.id_product_structure in ( ' + idProductStructures + ' ) ';
      if (!userCanChangeWarehouse) {
        //filtramos que solo aparezcan los productos del almacen del cliente
        select = select + 'AND p.id_product in (select s.id_product from stocks s where  s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = ' + id_client + ' AND c.id_enterprise = p.id_enterprise)) ';
      }
      select = select + 'AND p.id_enterprise = ? ORDER BY p.nu_priority ASC limit ? offset ?'
      return database.executeSql(select, [idEnterprise, this.itemsXPagina, offset]).then(result => {
        this.productList = [];
        for (let i = 0; i < result.rows.length; i++) {
          this.productList.push({
            idProduct: result.rows.item(i).id_product,
            coProduct: result.rows.item(i).co_product,
            naProduct: result.rows.item(i).na_product,
            points: result.rows.item(i).points,
            txDescription: result.rows.item(i).tx_description,
            idList: result.rows.item(i).id_list,
            price: result.rows.item(i).nu_price,
            coCurrency: result.rows.item(i).co_currency,
            priceOpposite: result.rows.item(i).co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.toHardCurrency(result.rows.item(i).nu_price) :
              this.currencyService.toLocalCurrency(result.rows.item(i).nu_price), // Precio en la moneda opuesta a la lista de precio
            coCurrencyOpposite: result.rows.item(i).co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.hardCurrency.coCurrency :
              this.currencyService.localCurrency.coCurrency, // moneda opuesta a la lista de precio,
            stock: result.rows.item(i).qu_stock,
            idEnterprise: result.rows.item(i).id_enterprise,
            coEnterprise: result.rows.item(i).co_enterprise,
            images: this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: result.rows.item(i).id_product_structure,
          });
        }
      }).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos con paginacion.");
        console.log(e);
      })
    }
  }

  getFeaturedProducts(dbServ: SQLiteObject, idEnterprise: number, coCurrency: string, userCanChangeWarehouse: boolean, id_client: number, id_list: number, page: number) {
    var database = dbServ;
    var offset = page * this.itemsXPagina;
    this.productList = [];
    if (this.globalConfig.get("conversionByPriceList") == "true") {
      var select = "select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, " +
        "(select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as id_list, " //+
      //"(select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = "+id_list+" order by l.na_list limit 1) as nu_price, " +
      //"(select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = "+id_list+" order by l.na_list limit 1) as co_currency, " +
      //"(select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = "+id_list+" order by l.na_list limit 1) as nu_price_opposite, " +
      //"(select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = "+id_list+" order by l.na_list limit 1) as co_currency_opposite, ";
      if (userCanChangeWarehouse) {
        select = select + " (select s.qu_stock from stocks s join warehouses w on s.id_warehouse = w.id_warehouse where s.id_product = p.id_product order by w.na_warehouse limit 1) as qu_stock, ";
      } else {
        select = select + " (select s.qu_stock from stocks s where s.id_product = p.id_product AND s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = " + id_client + " AND c.id_enterprise = p.id_enterprise)) as qu_stock, ";
      }
      select = select +
        " p.id_enterprise, p.co_enterprise FROM products p WHERE p.featured_product = 'true' and p.id_enterprise = ? ";
      if (!userCanChangeWarehouse) {
        //filtramos que solo aparezcan los productos del almacen del cliente
        select = select + 'AND p.id_product in (select s.id_product from stocks s where  s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = ' + id_client + ' AND c.id_enterprise = p.id_enterprise)) ';
      }
      select = select + " ORDER BY p.nu_priority ASC limit ? offset ?;"
      return database.executeSql(select, [idEnterprise, this.itemsXPagina, offset]).then(result => {
        this.productList = [];
        for (let i = 0; i < result.rows.length; i++) {
          let item = result.rows.item(i);
          this.productList.push({
            idProduct: item.id_product,
            coProduct: item.co_product,
            naProduct: item.na_product,
            points: item.points,
            txDescription: item.tx_description,
            idList: item.id_list,
            price: item.nu_price,
            coCurrency: item.co_currency,
            priceOpposite: item.nu_price_opposite,
            coCurrencyOpposite: item.co_currency_opposite,
            stock: item.qu_stock,
            idEnterprise: item.id_enterprise,
            coEnterprise: item.co_enterprise,
            images: this.imageServices.mapImagesFiles.get(item.co_product) === undefined ?
              '../../../assets/images/nodisponible.png' :
              this.imageServices.mapImagesFiles.get(item.co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: item.id_product_structure,
          });
        }
      }).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    } else {
      var select = 'select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, ' +
        '(select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = ' + id_list + ' order by l.na_list limit 1) as id_list, '// +
      //'(select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = '+id_list+' order by l.na_list limit 1) as nu_price, ' +
      //'(select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = '+id_list+' order by l.na_list limit 1) as co_currency, ';
      if (userCanChangeWarehouse) {
        select = select + " (select s.qu_stock from stocks s join warehouses w on s.id_warehouse = w.id_warehouse where s.id_product = p.id_product order by w.na_warehouse limit 1) as qu_stock, ";
      } else {
        select = select + " (select s.qu_stock from stocks s where s.id_product = p.id_product AND s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = " + id_client + " AND c.id_enterprise = p.id_enterprise)) as qu_stock, ";
      }
      select = select +
        'p.id_enterprise, p.co_enterprise FROM products p WHERE p.featured_product = "true" AND p.id_enterprise = ? ';
      if (!userCanChangeWarehouse) {
        //filtramos que solo aparezcan los productos del almacen del cliente
        select = select + 'AND p.id_product in (select s.id_product from stocks s where  s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = ' + id_client + ' AND c.id_enterprise = p.id_enterprise)) ';
      }
      select = select + 'ORDER BY p.nu_priority ASC limit ? offset ?'
      return database.executeSql(select, [idEnterprise, this.itemsXPagina, offset]).then(result => {
        this.productList = [];
        for (let i = 0; i < result.rows.length; i++) {
          let item = result.rows.item(i);
          this.productList.push({
            idProduct: item.id_product,
            coProduct: item.co_product,
            naProduct: item.na_product,
            points: item.points,
            txDescription: item.tx_description,
            idList: item.id_list,
            price: 0,// item.nu_price,
            coCurrency: "",//item.co_currency,
            priceOpposite: 0,/* item.co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.toHardCurrency(item.nu_price) :
              this.currencyService.toLocalCurrency(item.nu_price), // Precio en la moneda opuesta a la lista de precio*/
            coCurrencyOpposite: "", /*item.co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.hardCurrency.coCurrency :
              this.currencyService.localCurrency.coCurrency,*/ // moneda opuesta a la lista de precio,
            stock: item.qu_stock,
            idEnterprise: item.id_enterprise,
            coEnterprise: item.co_enterprise,
            images: this.imageServices.mapImagesFiles.get(item.co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(item.co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: item.id_product_structure,
          });
        }
      }).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    }

  }

  getFeaturedProductCount(dbServ: SQLiteObject, idEnterprise: number) {
    var database = dbServ;
    let query = 'SELECT count(id_product) as count from products where featured_product = "true" and id_enterprise = ?'
    return database.executeSql(query, [idEnterprise]).then(result => {
      return result.rows.item(0).count;
    })
  }

  getFavoriteProductCount(dbServ: SQLiteObject, idEnterprise: number) {
    var database = dbServ;
    let query = 'select  count(distinct id_product) as count from user_product_favs where id_enterprise = ?'
    return database.executeSql(query, [idEnterprise]).then(result => {
      return result.rows.item(0).count;
    })
  }

  getFavoriteProducts(dbServ: SQLiteObject, idEnterprise: number, coCurrency: string, userCanChangeWarehouse: boolean, id_client: number, id_list: number, page: number) {
    var database = dbServ;
    var offset = page * this.itemsXPagina;
    this.productList = [];
    if (this.globalConfig.get("conversionByPriceList") == "true") {
      var select = "select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, " +
        "(select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as id_list, " //+
      //"(select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = "+id_list+" order by l.na_list limit 1) as nu_price, " +
      //"(select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = "+id_list+" order by l.na_list limit 1) as co_currency, " +
      //"(select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = "+id_list+" order by l.na_list limit 1) as nu_price_opposite, " +
      //"(select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = "+id_list+" order by l.na_list limit 1) as co_currency_opposite, ";
      if (userCanChangeWarehouse) {
        select = select + " (select s.qu_stock from stocks s join warehouses w on s.id_warehouse = w.id_warehouse where s.id_product = p.id_product order by w.na_warehouse limit 1) as qu_stock, ";
      } else {
        select = select + " (select s.qu_stock from stocks s where s.id_product = p.id_product AND s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = " + id_client + " AND c.id_enterprise = p.id_enterprise)) as qu_stock, ";
      }
      select = select +
        " p.id_enterprise, p.co_enterprise FROM products p WHERE p.id_enterprise = ? " +
        'AND p.id_product in (select distinct id_product from user_product_favs) ';
      if (!userCanChangeWarehouse) {
        //filtramos que solo aparezcan los productos del almacen del cliente
        select = select + 'AND p.id_product in (select s.id_product from stocks s where  s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = ' + id_client + ' AND c.id_enterprise = p.id_enterprise)) ';
      }
      select = select +
        'ORDER BY p.nu_priority ASC limit ? offset ?;'
      return database.executeSql(select, [idEnterprise, this.itemsXPagina, offset]).then(result => {
        this.productList = [];
        for (let i = 0; i < result.rows.length; i++) {
          this.productList.push({
            idProduct: result.rows.item(i).id_product,
            coProduct: result.rows.item(i).co_product,
            naProduct: result.rows.item(i).na_product,
            points: result.rows.item(i).points,
            txDescription: result.rows.item(i).tx_description,
            idList: result.rows.item(i).id_list,
            price: result.rows.item(i).nu_price,
            coCurrency: result.rows.item(i).co_currency,
            priceOpposite: result.rows.item(i).nu_price_opposite,
            coCurrencyOpposite: result.rows.item(i).co_currency_opposite,
            stock: result.rows.item(i).qu_stock,
            idEnterprise: result.rows.item(i).id_enterprise,
            coEnterprise: result.rows.item(i).co_enterprise,
            images: this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: result.rows.item(i).id_product_structure,
          });
        }
      }).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    } else {
      var select = 'select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, ' +
        '(select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = ' + id_list + ' order by l.na_list limit 1) as id_list, ' //+
      //'(select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = '+id_list+' order by l.na_list limit 1) as nu_price, ' +
      //'(select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = '+id_list+' order by l.na_list limit 1) as co_currency, ';
      if (userCanChangeWarehouse) {
        select = select + " (select s.qu_stock from stocks s join warehouses w on s.id_warehouse = w.id_warehouse where s.id_product = p.id_product order by w.na_warehouse limit 1) as qu_stock, ";
      } else {
        select = select + " (select s.qu_stock from stocks s where s.id_product = p.id_product AND s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = " + id_client + " AND c.id_enterprise = p.id_enterprise)) as qu_stock, ";
      }
      select = select +
        'p.id_enterprise, p.co_enterprise FROM products p WHERE  p.id_enterprise = ? ' +
        'AND p.id_product in (select distinct id_product from user_product_favs) ';
      if (!userCanChangeWarehouse) {
        //filtramos que solo aparezcan los productos del almacen del cliente
        select = select + 'AND p.id_product in (select s.id_product from stocks s where  s.id_warehouse = (SELECT id_warehouse FROM clients c WHERE c.id_client = ' + id_client + ' AND c.id_enterprise = p.id_enterprise)) ';
      }
      select = select +
        'ORDER BY p.nu_priority ASC limit ? offset ?';
      return database.executeSql(select, [idEnterprise, this.itemsXPagina, offset]).then(result => {
        this.productList = [];
        for (let i = 0; i < result.rows.length; i++) {
          this.productList.push({
            idProduct: result.rows.item(i).id_product,
            coProduct: result.rows.item(i).co_product,
            naProduct: result.rows.item(i).na_product,
            points: result.rows.item(i).points,
            txDescription: result.rows.item(i).tx_description,
            idList: result.rows.item(i).id_list,
            price: 0, //result.rows.item(i).nu_price,
            coCurrency: '',//result.rows.item(i).co_currency,
            priceOpposite: 0,/*result.rows.item(i).co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.toHardCurrency(result.rows.item(i).nu_price) :
              this.currencyService.toLocalCurrency(result.rows.item(i).nu_price), // Precio en la moneda opuesta a la lista de precio */
            coCurrencyOpposite: '',/*result.rows.item(i).co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.hardCurrency.coCurrency :
              this.currencyService.localCurrency.coCurrency, // moneda opuesta a la lista de precio,*/
            stock: result.rows.item(i).qu_stock,
            idEnterprise: result.rows.item(i).id_enterprise,
            coEnterprise: result.rows.item(i).co_enterprise,
            images: this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: result.rows.item(i).id_product_structure,
          });
        }
      }).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    }

  }

  getProductsByCoProductAndNaProduct(searchText: string) {
    let productListFilter: ProductUtil[] = this.productList.filter(p => {
      console.log(p.naProduct.toLowerCase().includes(searchText));
      p.naProduct.toLowerCase().includes(searchText);
    });
    return productListFilter;
  }

  getProductsSearchedByCoProductAndNaProduct(dbServ: SQLiteObject, searchText: string, idEnterprise: number, coCurrency: string) {
    var database = dbServ;
    this.productList = [];
    if (this.globalConfig.get("conversionByPriceList") == "true") {
      var select = "select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, (select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as id_list, " +
        " (select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product order by l.na_list limit 1) as nu_price, " +
        " (select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product order by l.na_list limit 1) as co_currency, " +
        " (select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product order by l.na_list limit 1) as nu_price_opposite, " +
        " (select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product order by l.na_list limit 1) as co_currency_opposite, " +
        " (select s.qu_stock from stocks s where s.id_product = p.id_product) as qu_stock, p.id_enterprise, p.co_enterprise FROM products p where LOWER(p.co_product) like '%" + searchText + "%' or LOWER(p.na_product) like '%" + searchText + "%' and p.id_enterprise = " + idEnterprise + " order by p.co_product"
      return database.executeSql(select, []).then(result => {
        for (let i = 0; i < result.rows.length; i++) {
          this.productList.push({
            idProduct: result.rows.item(i).id_product,
            coProduct: result.rows.item(i).co_product,
            naProduct: result.rows.item(i).na_product,
            points: result.rows.item(i).points,
            txDescription: result.rows.item(i).tx_description,
            idList: result.rows.item(i).id_list,
            price: result.rows.item(i).nu_price,
            coCurrency: result.rows.item(i).co_currency,
            priceOpposite: result.rows.item(i).nu_price_opposite,
            coCurrencyOpposite: result.rows.item(i).co_currency_opposite,
            stock: result.rows.item(i).qu_stock,
            idEnterprise: result.rows.item(i).id_enterprise,
            coEnterprise: result.rows.item(i).co_enterprise,
            images: this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: result.rows.item(i).id_product_structure,
          });
        }
      }
      ).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    } else {
      var select = "select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, (select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as id_list, (select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as nu_price, (select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as co_currency, (select s.qu_stock from stocks s where s.id_product = p.id_product) as qu_stock, p.id_enterprise, p.co_enterprise FROM products p where LOWER(p.co_product) like '%" + searchText + "%' or LOWER(p.na_product) like '%" + searchText + "%' and p.id_enterprise = " + idEnterprise + " order by p.co_product"
      return database.executeSql(select, []).then(result => {
        for (let i = 0; i < result.rows.length; i++) {
          this.productList.push({
            idProduct: result.rows.item(i).id_product,
            coProduct: result.rows.item(i).co_product,
            naProduct: result.rows.item(i).na_product,
            points: result.rows.item(i).points,
            txDescription: result.rows.item(i).tx_description,
            idList: result.rows.item(i).id_list,
            price: result.rows.item(i).nu_price,
            coCurrency: result.rows.item(i).co_currency,
            priceOpposite: result.rows.item(i).co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.toHardCurrency(result.rows.item(i).nu_price) :
              this.currencyService.toLocalCurrency(result.rows.item(i).nu_price), // Precio en la moneda opuesta a la lista de precio
            coCurrencyOpposite: result.rows.item(i).co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.hardCurrency.coCurrency :
              this.currencyService.localCurrency.coCurrency, // moneda opuesta a la lista de precio,
            stock: result.rows.item(i).qu_stock,
            idEnterprise: result.rows.item(i).id_enterprise,
            coEnterprise: result.rows.item(i).co_enterprise,
            images: this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: result.rows.item(i).id_product_structure,
          });
        }
      }
      ).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    }
  }

  getProductsSearchedByCoProductAndNaProductAndIdList(dbServ: SQLiteObject, searchText: string, idEnterprise: number, coCurrency: string, id_list: number) {
    var database = dbServ;
    searchText = searchText.toLowerCase();
    this.productList = [];
    if (this.globalConfig.get("conversionByPriceList") == "true") {
      var select = "select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, (select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as id_list, " +
        " (select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as nu_price, " +
        " (select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency = '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as co_currency, " +
        " (select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as nu_price_opposite, " +
        " (select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.co_currency != '" + coCurrency + "' and pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as co_currency_opposite, " +
        " (select SUM(s.qu_stock) from stocks s where s.id_product = p.id_product) as qu_stock, p.id_enterprise, p.co_enterprise FROM products p where LOWER(p.co_product) like '%" + searchText + "%' or LOWER(p.na_product) like '%" + searchText + "%' and p.id_enterprise = " + idEnterprise 
        if(this.psService.idProductStructureSeleccionada > 0) {
          select = select + " and p.id_product_structure = " + this.psService.idProductStructureSeleccionada;
        } 
        select = select + " order by p.co_product"
      return database.executeSql(select, []).then(result => {
        for (let i = 0; i < result.rows.length; i++) {
          this.productList.push({
            idProduct: result.rows.item(i).id_product,
            coProduct: result.rows.item(i).co_product,
            naProduct: result.rows.item(i).na_product,
            points: result.rows.item(i).points,
            txDescription: result.rows.item(i).tx_description,
            idList: result.rows.item(i).id_list,
            price: result.rows.item(i).nu_price,
            coCurrency: result.rows.item(i).co_currency,
            priceOpposite: result.rows.item(i).nu_price_opposite,
            coCurrencyOpposite: result.rows.item(i).co_currency_opposite,
            stock: result.rows.item(i).qu_stock,
            idEnterprise: result.rows.item(i).id_enterprise,
            coEnterprise: result.rows.item(i).co_enterprise,
            images: this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: result.rows.item(i).id_product_structure,
          });
        }
      }
      ).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    } else {
      var select = "select p.id_product, p.co_product, p.na_product, p.points, p.tx_description, p.id_product_structure, " +
        "(select pl.id_list from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as id_list," +
        "(select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = " + id_list + " order by l.na_list limit 1) as nu_price," +
        "(select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product and pl.id_list = " + id_list + "  order by l.na_list limit 1) as co_currency," +
        "(select SUM(s.qu_stock) from stocks s where s.id_product = p.id_product) as qu_stock, p.id_enterprise, p.co_enterprise FROM products p where LOWER(p.co_product) like '%" +
        searchText + "%' or LOWER(p.na_product) like '%" +
        searchText + "%' and p.id_enterprise = "+ idEnterprise + " " ;
        if(this.psService.idProductStructureSeleccionada > 0) {
          select = select + " and p.id_product_structure = " + this.psService.idProductStructureSeleccionada;
        }
         select = select + " order by p.co_product";
      return database.executeSql(select, []).then(result => {
        for (let i = 0; i < result.rows.length; i++) {
          this.productList.push({
            idProduct: result.rows.item(i).id_product,
            coProduct: result.rows.item(i).co_product,
            naProduct: result.rows.item(i).na_product,
            points: result.rows.item(i).points,
            txDescription: result.rows.item(i).tx_description,
            idList: result.rows.item(i).id_list,
            price: result.rows.item(i).nu_price,
            coCurrency: result.rows.item(i).co_currency,
            priceOpposite: result.rows.item(i).co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.toHardCurrency(result.rows.item(i).nu_price) :
              this.currencyService.toLocalCurrency(result.rows.item(i).nu_price), // Precio en la moneda opuesta a la lista de precio
            coCurrencyOpposite: result.rows.item(i).co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.hardCurrency.coCurrency :
              this.currencyService.localCurrency.coCurrency, // moneda opuesta a la lista de precio,
            stock: result.rows.item(i).qu_stock,
            idEnterprise: result.rows.item(i).id_enterprise,
            coEnterprise: result.rows.item(i).co_enterprise,
            images: this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: result.rows.item(i).id_product_structure,
          });
        }
      }
      ).catch(e => {
        this.productList = [];
        console.log("[ProductService] Error al cargar productos.");
        console.log(e);
      })
    }
  }

  getProductDetailByIdProduct(dbServ: SQLiteObject, idList: number, idProduct: number, coCurrency: string) {
    var database = dbServ;
    this.productDetail = {} as ProductDetail;
    if (this.globalConfig.get("conversionByPriceList") == "true") {
      var select = "select p.id_product, p.co_product, p.na_product, ps.id_product_structure, ps.co_product_structure, ps.na_product_structure, p.tx_description, u.id_unit, u.co_unit, u.na_unit, p.points, " +
        "(select pl.nu_price from price_lists pl where pl.id_list = " + idList + " and pl.id_product = " + idProduct + " and pl.co_currency = '" + coCurrency + "') as nu_price_default, " +
        "(select pl.co_currency from price_lists pl where pl.id_list = " + idList + " and pl.id_product = " + idProduct + " and pl.co_currency = '" + coCurrency + "') as co_currency_default, " +
        "(select pl.nu_price from price_lists pl where pl.id_list = " + idList + " and pl.id_product = " + idProduct + " and pl.co_currency != '" + coCurrency + "') as nu_price_opposite, " +
        "(select pl.co_currency from price_lists pl where pl.id_list = " + idList + " and pl.id_product = " + idProduct + " and pl.co_currency != '" + coCurrency + "') as co_currency_opposite, " +
        "(select s.qu_stock from stocks s join warehouses w on s.id_warehouse = w.id_warehouse where s.id_product = p.id_product order by w.na_warehouse asc limit 1) as qu_stock, p.co_enterprise, p.id_enterprise from products p join product_structures ps on p.id_product_structure = ps.id_product_structure join units u on p.co_primary_unit = u.co_unit and p.id_enterprise = u.id_enterprise where id_product = " + idProduct
      return database.executeSql(select, []).then(pd => {
        if (pd) {
          this.productDetail = new ProductDetail(
            pd.rows.item(0).id_product,
            pd.rows.item(0).co_product,
            pd.rows.item(0).na_product,
            pd.rows.item(0).id_product_structure,
            pd.rows.item(0).co_product_structure,
            pd.rows.item(0).na_product_structure,
            pd.rows.item(0).tx_description,
            pd.rows.item(0).id_unit,
            pd.rows.item(0).co_unit,
            pd.rows.item(0).na_unit,
            pd.rows.item(0).points,
            pd.rows.item(0).nu_price_default, // Precio en la moneda de Lista de precio
            pd.rows.item(0).co_currency_default, // moneda de Lista de precio
            pd.rows.item(0).nu_price_opposite, // Precio en la monedaopuesta  de Lista de precio
            pd.rows.item(0).co_currency_opposite, // moneda opuesta de Lista de precio
            /*            pd.rows.item(0).co_currency === this.currencyService.getLocalCurrency ? 
                            this.currencyService.toHardCurrency(pd.rows.item(0).nu_price) : 
                            this.currencyService.toLocalCurrency(pd.rows.item(0).nu_price), // Precio en la moneda opuesta a la lista de precio
                        pd.rows.item(0).co_currency === this.currencyService.getLocalCurrency ? 
                        this.currencyService.hardCurrency.coCurrency : 
                        this.currencyService.localCurrency.coCurrency, // moneda opuesta a la lista de precio */
            this.currencyService.getLocalValue(),  // TASA            
            pd.rows.item(0).qu_stock,
            pd.rows.item(0).co_enterprise,
            pd.rows.item(0).id_enterprise
          )
        }
      }).catch(e => {
        this.productDetail = {} as ProductDetail;
        console.log("[ProductService] Error al cargar detalle de producto.");
        console.log(e);
      })
    } else {
      var select = "select p.id_product, p.co_product, p.na_product, ps.id_product_structure, ps.co_product_structure, ps.na_product_structure, p.tx_description, u.id_unit, u.co_unit, u.na_unit, p.points, (select pl.nu_price from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as nu_price, (select pl.co_currency from price_lists pl join lists l on pl.id_list = l.id_list where pl.id_product = p.id_product order by l.na_list limit 1) as co_currency, " +
        "(select s.qu_stock from stocks s join warehouses w on s.id_warehouse = w.id_warehouse where s.id_product = p.id_product order by w.na_warehouse asc limit 1) as qu_stock, p.co_enterprise, p.id_enterprise from products p join product_structures ps on p.id_product_structure = ps.id_product_structure join units u on p.co_primary_unit = u.co_unit and p.id_enterprise = u.id_enterprise where id_product = ?"
      return database.executeSql(select, [idProduct]).then(pd => {
        if (pd) {
          this.productDetail = new ProductDetail(
            pd.rows.item(0).id_product,
            pd.rows.item(0).co_product,
            pd.rows.item(0).na_product,
            pd.rows.item(0).id_product_structure,
            pd.rows.item(0).co_product_structure,
            pd.rows.item(0).na_product_structure,
            pd.rows.item(0).tx_description,
            pd.rows.item(0).id_unit,
            pd.rows.item(0).co_unit,
            pd.rows.item(0).na_unit,
            pd.rows.item(0).points,
            pd.rows.item(0).nu_price, // Precio en la moneda de Lista de precio
            pd.rows.item(0).co_currency, // moneda de Lista de precio
            pd.rows.item(0).co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.toHardCurrency(pd.rows.item(0).nu_price) :
              this.currencyService.toLocalCurrency(pd.rows.item(0).nu_price), // Precio en la moneda opuesta a la lista de precio
            pd.rows.item(0).co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.hardCurrency.coCurrency :
              this.currencyService.localCurrency.coCurrency, // moneda opuesta a la lista de precio
            this.currencyService.getLocalValue(),  // TASA
            pd.rows.item(0).qu_stock,
            pd.rows.item(0).co_enterprise,
            pd.rows.item(0).id_enterprise
          )
        }
      }).catch(e => {
        this.productDetail = {} as ProductDetail;
        console.log("[ProductService] Error al cargar detalle de producto.");
        console.log(e);
      })
    }

  }

  getUnitsByIdProductOrderByCoPrimaryUnit(dbServ: SQLiteObject, idProduct: number) {
    //return this.getUnitByIdProductAndCoPrimaryUnit(idProduct);
    return this.getUnitByIdProductAndCoPrimaryUnit(dbServ, idProduct).then(() => {
      this.getUnitByIdProductAndNotCoPrimaryUnit(dbServ, idProduct).then();
    });
  }

  getUnitByIdProductAndCoPrimaryUnit(dbServ: SQLiteObject, idProduct: number) {
    var database = dbServ;
    this.unitsByProduct = [];
    var select = "select u.id_unit, u.co_unit, u.na_unit, u.id_enterprise, u.co_enterprise, pu.id_product_unit, pu.co_product_unit, pu.qu_unit  from units u join product_units pu on u.id_unit = pu.id_unit join products p on pu.id_product = p.id_product where pu.id_product = ? and u.co_unit = p.co_primary_unit"
    return database.executeSql(select, [idProduct]).then(result => {
      for (let i = 0; i < result.rows.length; i++) {
        this.unitsByProduct.push({
          idUnit: result.rows.item(i).id_unit,
          coUnit: result.rows.item(i).co_unit,
          naUnit: result.rows.item(i).na_unit,
          idEnterprise: result.rows.item(i).id_enterprise,
          coEnterprise: result.rows.item(i).co_enterprise,
          idProductUnit: result.rows.item(i).id_product_unit,
          coProductUnit: result.rows.item(i).co_product_unit,
          quUnit: result.rows.item(i).qu_unit,
        });
      }
    }).catch(e => {
      this.unitsByProduct = [];
      console.log("[ProductService] Error al cargar getUnitByIdProductAndCoPrimaryUnit.");
      console.log(e);
    })
  }

  getUnitByIdProductAndNotCoPrimaryUnit(dbServ: SQLiteObject, idProduct: number) {
    var database = dbServ;
    var select = "select u.id_unit, u.co_unit, u.na_unit, u.id_enterprise, u.co_enterprise, pu.id_product_unit, pu.co_product_unit, pu.qu_unit from units u join product_units pu on u.id_unit = pu.id_unit join products p on pu.id_product = p.id_product where pu.id_product = ? and u.co_unit != p.co_primary_unit"
    return database.executeSql(select, [idProduct]).then(result => {
      for (let i = 0; i < result.rows.length; i++) {
        this.unitsByProduct.push({
          idUnit: result.rows.item(i).id_unit,
          coUnit: result.rows.item(i).co_unit,
          naUnit: result.rows.item(i).na_unit,
          idEnterprise: result.rows.item(i).id_enterprise,
          coEnterprise: result.rows.item(i).co_enterprise,
          idProductUnit: result.rows.item(i).id_product_unit,
          coProductUnit: result.rows.item(i).co_product_unit,
          quUnit: result.rows.item(i).qu_unit,
        });
      }
    }).catch(e => {
      this.unitsByProduct = [];
      console.log("[ProductService] Error al cargar getUnitByIdProductAndNotCoPrimaryUnit.");
      console.log(e);
    })
  }

  getUnitByIdProductAndCoUnit(dbServ: SQLiteObject, idProduct: number, coUnit: string) {

    //TENGO QUE BUSCAR LA UNIDAD SELECCIONADA
    var database = dbServ;
    let unitByProduct = Unit;
    var select = "select u.id_unit, u.co_unit, u.na_unit, u.id_enterprise, u.co_enterprise, pu.id_product_unit, pu.co_product_unit, pu.qu_unit  from units u join product_units pu on u.id_unit = pu.id_unit join products p on pu.id_product = p.id_product where pu.id_product = ? and u.co_unit = ?"
    return database.executeSql(select, [idProduct, coUnit]).then(result => {
      for (let i = 0; i < result.rows.length; i++) {
        this.unitsByProduct.push({
          idUnit: result.rows.item(i).id_unit,
          coUnit: result.rows.item(i).co_unit,
          naUnit: result.rows.item(i).na_unit,
          idEnterprise: result.rows.item(i).id_enterprise,
          coEnterprise: result.rows.item(i).co_enterprise,
          idProductUnit: result.rows.item(i).id_product_unit,
          coProductUnit: result.rows.item(i).co_product_unit,
          quUnit: result.rows.item(i).qu_unit,
        });
      }
    }).catch(e => {
      this.unitsByProduct = [];
      console.log("[ProductService] Error al cargar getUnitByIdProductAndCoPrimaryUnit.");
      console.log(e);
    })
  }

  getProductsByIdInvoice(dbServ: SQLiteObject, idInvoice: number) {
    var database = dbServ;
    this.productList = [];

    var select = 'SELECT id_product, co_product, na_product, id_enterprise, co_enterprise, p.id_product_structure ' +
      'FROM products p WHERE id_product IN ' +
      '(SELECT id_product FROM invoice_details WHERE id_invoice = ? ORDER BY id_product ASC)'
    return database.executeSql(select, [idInvoice]).then(result => {
      for (let i = 0; i < result.rows.length; i++) {
        this.productList.push({
          idProduct: result.rows.item(i).id_product,
          coProduct: result.rows.item(i).co_product,
          naProduct: result.rows.item(i).na_product,
          idEnterprise: result.rows.item(i).id_enterprise,
          coEnterprise: result.rows.item(i).co_enterprise,
          images: this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(result.rows.item(i).co_product)?.[0],
          txDescription: '',
          points: 0,
          idList: 0,
          price: 0,
          coCurrency: '',
          priceOpposite: 0,
          coCurrencyOpposite: '',
          stock: 0,
          typeStocks: undefined,
          productUnitList: undefined,
          idProductStructure: result.rows.item(i).id_product_structure,
        });
      }
    }).catch(e => {
      this.productList = [];
      console.log("[ProductService] Error al cargar productos.");
      console.log(e);
    })
  }

  generarListIn(listaString: string[]) {
    let lista: string = "";
    for (var contador = 0; contador < listaString.length; contador++) {
      if (contador == listaString.length - 1) {
        lista += '"' + listaString[contador] + '"';
      } else {
        lista += '"' + listaString[contador] + '",';
      }
    }
    return lista;
  }

  formatNumber(input: number) {
    return this.currencyService.formatNumber(input);
  }
}
