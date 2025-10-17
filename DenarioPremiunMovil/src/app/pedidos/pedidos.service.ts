import { Injectable, inject } from '@angular/core';
import { ServicesService } from '../services/services.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { OrderType } from '../modelos/tables/orderType';
import { AddresClient } from '../modelos/tables/addresClient';
import { List } from '../modelos/tables/list';
import { PriceList } from '../modelos/tables/priceList';
import { PaymentCondition } from '../modelos/tables/paymentCondition';
import { Enterprise } from '../modelos/tables/enterprise';
import { OrderUtil } from '../modelos/orderUtil';
import { ProductUtil } from '../modelos/ProductUtil';
import { CurrencyService } from '../services/currency/currency.service';
import { Product } from '../modelos/tables/product';
import { UnitInfo } from '../modelos/unitInfo';
import { Discount } from '../modelos/tables/discount';
import { IvaList } from '../modelos/tables/iva';
import { Subject, Subscription } from 'rxjs';
import { Warehouse } from '../modelos/tables/warehouse';
import { Stock } from '../modelos/tables/stock';
import { ProductStructure } from '../modelos/tables/productStructure';
import { MessageService } from '../services/messageService/message.service';
import { GlobalConfigService } from '../services/globalConfig/global-config.service';
import { CurrencyEnterprise } from '../modelos/tables/currencyEnterprise';
import { ClienteSelectorService } from '../cliente-selector/cliente-selector.service';
import { Client } from '../modelos/tables/client';
import { AdjuntoService } from '../adjuntos/adjunto.service';
import { Orders } from '../modelos/tables/orders';
import { ItemListaPedido } from './item-lista-pedido';
import { PedidosDbService } from './pedidos-db.service';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite';
import { EnterpriseService } from '../services/enterprise/enterprise.service';
import { Router } from '@angular/router';
import { ImageServicesService } from '../services/imageServices/image-services.service';
import { DateServiceService } from '../services/dates/date-service.service';
import { DELIVERY_STATUS_SAVED, VISIT_STATUS_SAVED } from '../utils/appConstants';
import { GlobalDiscount } from '../modelos/tables/globalDiscount';
import { ClientChannelOrderType } from '../modelos/tables/clientChannelOrderType';
import { OrderTypeProductStructure } from '../modelos/tables/orderTypeProductStructure';
import { DistributionChannel } from '../modelos/tables/distributionChannel';
import { ProductMinMulFav } from '../modelos/tables/productMinMul';
import { Unit } from '../modelos/tables/unit';
import { SugerenciaPedido } from '../modelos/SugerenciaPedido';
import { OrderDetail } from '../modelos/tables/orderDetail';
import { OrderDetailUnit } from '../modelos/tables/orderDetailUnit';
import { ClientAvgProduct } from '../modelos/tables/clientAvgProduct';
import { ClientStocks } from '../modelos/tables/client-stocks';
import { HistoryTransaction } from '../services/historyTransaction/historyTransaction';



@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  public tags = new Map<string, string>([]);
  public ProdSelecttags = new Map<string, string>([]);
  public dbServ = inject(SynchronizationDBService);
  public services = inject(ServicesService);

  public enterpriseServ = inject(EnterpriseService);
  public currencyService = inject(CurrencyService);

  public dateService = inject(DateServiceService)

  public message = inject(MessageService);
  public config = inject(GlobalConfigService);
  imageServices = inject(ImageServicesService);
  public clientSelectorService = inject(ClienteSelectorService);
  public adjuntoService = inject(AdjuntoService);
  public historyTransaction = inject(HistoryTransaction);

  public database: SQLiteObject;

  public db = inject(PedidosDbService);

  public empresaSeleccionada!: Enterprise;
  public monedaSeleccionada!: CurrencyEnterprise;
  public listaSeleccionada!: List;

  imgNoDisponible = "../../../assets/images/nodisponible.png" //constante

  public listaProductos: Product[] = [];
  public listaUnitInfo: UnitInfo[] = [];
  public listaDiscount: Discount[] = [];
  public listaGlobalDiscount: GlobalDiscount[] = [];
  public listaPricelist: PriceList[] = [];
  public listaPriceListFiltrada: PriceList[] = [];
  public listaPedidos: ItemListaPedido[] = [];
  public listaList: List[] = [];
  public ivaList: IvaList[] = [];
  public carrito: OrderUtil[] = [];
  public carritoWithLines: { //carrito especial para groupByTotalByLines
    naLine: String,
    total: number,
    totalConversion: number,
    items: OrderUtil[]
  }[] = [];
  public totalUnidad: UnitInfo[] = [];
  public listaWarehouse: Warehouse[] = [];
  public listaStock: Stock[] = [];
  public listaOrderTypes: OrderType[] = [];
  public tipoOrden!: OrderType; //[userCanSelectChannel] el tipo de pedido con el que se filtraran las estructuras
  public listaPaymentCondition: PaymentCondition[] = [];

  public listaProdMinMul: ProductMinMulFav[] = []; //[productMinMul] lista de minimos y multiplos

  /* especiales para userCanSelectChannel */
  public clientChannelOrderTypes: ClientChannelOrderType[] = [];
  public orderTypeProductStructure: OrderTypeProductStructure[] = [];
  public distributionChannels: DistributionChannel[] = [];
  /* fin userCanSelectChannel */

  public changesMade = false;
  public disableSaveButton = false;
  public disableSendButton = false;
  public pedidoModificable = false; // el pedido que se esta abriendo se podra modificar luego (pedido guardado/copiado)
  public openOrder = false; // flag: se esta abriendo un pedido, (guardado/copiado/enviado)
  public copiandoPedido = false; // Flag: copia el pedido que se esta abriendo
  public order: Orders = {} as Orders;
  public productStructures: ProductStructure[] = [];
  public parentStructures: Map<number, string> = new Map();
  public cliente: Client = { lbClient: this.getTag("PED_PLACEHOLDER_CLIENTE") } as Client;

  //Pedido Sugerido
  public desdeSugerencia = false; //vienes desde el boton de pedido sugerido (inventario)
  public datosPedidoSugerido: SugerenciaPedido = {

    cliente: { lbClient: this.getTag("PED_PLACEHOLDER_CLIENTE") } as Client,
    direccion: { idAddress: 0 } as AddresClient,
    productos: [],
    list: {} as List,
    enviar: false,
    coClientStock: "",
    idClientStock: 0,
  }

  coClientStockAEnviar = '';
  idClientStockAEnviar: number | null = 0;


  public coOrder = '';

  public coordenadas = '';

  //totalizacion

  totalBase = 0; // suma de los precios de los productos  
  finalPedido = 0; //total base - descuento global - descuento x productos
  totalPedido = 0; // final pedido + IVA
  totalDctoXProducto = 0; //suma de los montos de los descuentos de productos
  dctoGlobal = 0; //% del descuento global, si hay alguno
  totalGlobalDc = 0;   //cuanto se ha descontado por descuentos globales  
  orderIVA = 0;

  //versiones multimoneda
  totalPedidoConv = 0;
  totalBaseConv = 0;
  finalPedidoConv = 0;
  totalDctoXProductoConv = 0;
  totalGlobalDcConv = 0;
  orderIVAConv = 0;
  countTotalProductUnit = 0; //[codeTotalProductUnit] el total de la unidad especificada




  // GLOBAL CONFIGURATION
  public parteDecimal!: number;
  public productMinMul!: boolean;
  public conversionByPriceList!: boolean;
  public quUnitDecimals!: boolean;
  public userCanSelectGlobalDiscount!: boolean;
  public totalUnit!: boolean;
  public userCanChangePriceList!: boolean;
  public showStock!: boolean;
  public stock0!: boolean;
  public enterpriseEnabled!: boolean;
  public userCanChangeWarehouse!: boolean;
  public showProductImages!: boolean;
  public userCanChangePaymentConditions!: boolean;
  public showCreditLimit!: boolean;
  public validStock!: boolean;
  public userCanSelectProductDiscount!: boolean;
  public showTransactionCurrency!: boolean;
  public validateNuOrder!: boolean;
  public userCanSelectIVA!: boolean;
  public selectOrderType!: boolean;
  public userCanSelectChannel!: boolean;
  public validateWarehouses!: boolean;
  public orderPedidoSeleccion!: boolean;
  public hideProdWithoutPrice!: boolean;
  public showTotalProductUnit!: boolean;
  public codeTotalProductUnit = "";
  public nameTotalProductUnit = "";
  public featuredProducts!: boolean;
  public nameProductLine = '';

  public groupByTotalByLines!: boolean;

  public multiCurrencyOrder!: boolean;
  public userMustActivateGPS!: boolean;
  public orderTypeByEnterprise!: boolean;
  public checkAddressClient!: boolean;
  public signatureOrder!: boolean;

  public disableDaDispatch!: boolean;
  public userCanChangePriceListProduct!: boolean;

  /*  ClientChangeSubscription: Subscription = this.clientSelectorService.ClientChanged.subscribe(client => {    
      this.reset();
      //this.cliente = client;    
    })
  */



  constructor(private router: Router) {
    this.getTags();
    this.getConfig();
    this.database = this.dbServ.getDatabase();
  }



  hasItems() {
    return ((this.carrito.length > 0) || this.adjuntoService.hasItems())
  }

  setup() {
    let idEnterprise = this.empresaSeleccionada.idEnterprise;
    let coEnterprise = this.empresaSeleccionada.coEnterprise;
    this.getConfig();
    if (this.monedaSeleccionada == null) {
      this.monedaSeleccionada = this.currencyService.getCurrency(this.empresaSeleccionada.coCurrencyDefault);
    }

    this.getOrderTypes(coEnterprise).then(data => { this.listaOrderTypes = data; });
    this.getLists(idEnterprise).then(data => { this.listaList = data; });
    this.getPaymentConditions(idEnterprise).then(data => { this.listaPaymentCondition = data; })
    this.getIVAList().then(data => { this.ivaList = data; });
    this.getProducts(idEnterprise).then(data => { this.listaProductos = data; });
    this.getUnitInfo(idEnterprise).then(data => { this.listaUnitInfo = data; });
    this.getDiscounts(idEnterprise).then(data => { this.listaDiscount = data; });
    this.getPricelists(idEnterprise).then(data => { this.listaPricelist = data; });
    this.getStocks(idEnterprise).then(data => { this.listaStock = data; });


    if (this.validateWarehouses) {
      this.getWarehouses(idEnterprise).then(data => { this.listaWarehouse = data; });
    }
    if (this.userCanSelectGlobalDiscount) {
      this.getGlobalDiscounts().then(data => { this.listaGlobalDiscount = data; });
    }
    if (this.userCanSelectChannel) {
      this.getOrderTypeProductStructure(idEnterprise).then(data => { this.orderTypeProductStructure = data; });
      this.getDistributionChannels(idEnterprise).then(data => { this.distributionChannels = data; });
    }
    if (this.productMinMul) {
      this.getProductMinMulList(idEnterprise).then(data => { this.listaProdMinMul = data });
    }
    if (this.groupByTotalByLines) {
      this.getProductStructures(idEnterprise).then(data => {
        this.productStructures = data;
        this.getParentStructures();

      });
    }
  }

  getTags() {
    if (this.tags.size > 0) {
      //ya tenemos los tags, no hay que hacer nada.
    } else {
      this.services.getTags(this.dbServ.getDatabase(), "PED", "ESP").then(result => {
        for (var i = 0; i < result.length; i++) {
          this.tags.set(
            result[i].coApplicationTag, result[i].tag
          )
        }
      });
      this.services.getTags(this.dbServ.getDatabase(), "PROD", "ESP").then(result => {
        for (var i = 0; i < result.length; i++) {
          this.ProdSelecttags.set(
            result[i].coApplicationTag, result[i].tag
          )
        }
      });
      this.services.getTags(this.dbServ.getDatabase(), "DEN", "ESP").then(result => {
        for (var i = 0; i < result.length; i++) {
          this.ProdSelecttags.set(
            result[i].coApplicationTag, result[i].tag
          )
          this.tags.set(
            result[i].coApplicationTag, result[i].tag
          )
        }
      });

    }
  }

  getTag(tagName: string) {
    var tag = this.tags.get(tagName);
    if (tag == undefined) {
      console.log("Error al buscar tag " + tagName);
      tag = '';
    }
    return tag;
  }

  getConfig() {
    //boolean
    this.productMinMul = this.config.get("productMinMul").toLowerCase() === 'true';
    this.conversionByPriceList = this.config.get("conversionByPriceList").toLowerCase() === 'true';
    this.quUnitDecimals = this.config.get("quUnitDecimals").toLowerCase() === 'true';
    this.totalUnit = this.config.get("totalUnit").toLowerCase() === 'true';
    this.userCanChangePriceList = this.config.get("userCanChangePriceList").toLowerCase() === 'true';    
    this.stock0 = this.config.get("stock0").toLowerCase() === 'true';
    this.enterpriseEnabled = this.config.get("enterpriseEnabled").toLowerCase() === 'true';
    this.userCanChangeWarehouse = this.config.get("userCanChangeWarehouse").toLowerCase() === 'true';
    this.showProductImages = this.config.get("showProductImages").toLowerCase() === 'true';
    this.userCanChangePaymentConditions = this.config.get("userCanChangePaymentConditions").toLowerCase() === 'true';
    this.showCreditLimit = this.config.get("showCreditLimit").toLowerCase() === 'true';
    this.validStock = this.config.get("validStock").toLowerCase() === 'true';
    this.userCanSelectProductDiscount = this.config.get("userCanSelectProductDiscount").toLowerCase() === 'true';
    this.showTransactionCurrency = this.config.get("showTransactionCurrency").toLowerCase() === 'true';
    this.validateNuOrder = this.config.get("validateNuOrder").toLowerCase() === 'true';
    this.userCanSelectGlobalDiscount = this.config.get("userCanSelectGlobalDiscount").toLowerCase() === 'true';
    this.userCanSelectIVA = this.config.get("userCanSelectIVA").toLowerCase() === 'true';
    this.selectOrderType = this.config.get("selectOrderType").toLowerCase() === 'true';
    this.userCanSelectChannel = this.config.get("userCanSelectChannel").toLowerCase() === 'true';
    this.validateWarehouses = this.config.get("validateWarehouses").toLowerCase() === 'true';
    this.orderPedidoSeleccion = this.config.get("orderPedidoSeleccion").toLowerCase() === 'true';
    this.hideProdWithoutPrice = this.config.get("hideProdWithoutPrice").toLowerCase() === 'true';
    this.showTotalProductUnit = this.config.get("showTotalProductUnit").toLowerCase() === 'true';
    this.featuredProducts = this.config.get("featuredProducts").toLowerCase() === 'true';
    this.groupByTotalByLines = this.config.get("groupByTotalByLines").toLowerCase() === 'true';
    this.multiCurrencyOrder = this.config.get("multiCurrencyOrder").toLowerCase() === 'true';
    this.userMustActivateGPS = this.config.get("userMustActivateGPS").toLowerCase() === 'true';
    this.orderTypeByEnterprise = this.config.get("orderTypeByEnterprise").toLowerCase() === 'true';
    this.checkAddressClient = this.config.get("checkAddressClient").toLowerCase() === "true";
    this.signatureOrder = this.config.get("signatureOrder").toLowerCase() === "true";
    this.disableDaDispatch = this.config.get("disableDaDispatch").toLowerCase() === "true";
   
    //string
    this.codeTotalProductUnit = this.config.get("codeTotalProductUnit");
    this.nameProductLine = this.config.get("nameProductLine");

    //numerico
    this.parteDecimal = +this.config.get('parteDecimal');

    //casos especiales
    if (this.validateWarehouses) {
      this.showStock = this.config.get("showStock").toLowerCase() === 'true';
    }else{
      //validateWarehouses oculta tambien el stock de los productos cuando es false.
      this.showStock = false;
    }
    if(this.userCanChangePriceList) {
       this.userCanChangePriceListProduct = this.config.get("userCanChangePriceListProduct").toLowerCase() === "true";
    }else{
      //si el usuario no puede cambiar la lista de precios, tampoco podra cambiarla por producto
      this.userCanChangePriceListProduct = false;
    }

  }


  reset() {
    this.carrito = [];
    this.productSummary();
  }

  setChangesMade(value: boolean) {
    this.changesMade = value;
    if (value) {
      var disable = !((this.cliente.idClient != null) && (this.carrito.length > 0))
      this.disableSaveButton = disable;
      this.disableSendButton = disable;
    } else {
      this.disableSaveButton = true;
      this.disableSendButton = true;
    }
  }


  alCarrito(prod: OrderUtil) {
    let sustitucion = false;
    if (prod.quAmount <= 0) {
      this.removeFromCarrito(prod);
      return;
    }
    if (this.carrito.length < 1) {
      //si no hay elementos, no hay nada que chequear.
      prod.idInfo = 0;
      this.carrito.push(prod);
    } else {
      //si el elemento existe, se sustituye
      for (let i = 0; i < this.carrito.length; i++) {
        let item = this.carrito[i];
        if (item.idProduct == prod.idProduct) {
          this.carrito[i] = prod;
          item = this.carrito[i];
          sustitucion = true;
        }
        item.idInfo = i;
      }
      if (!sustitucion) {
        prod.idInfo = this.carrito.length;
        this.carrito.push(prod);

      }
    }
    this.productSummary();
    this.clientSelectorService.checkClient = true;
    console.log(this.carrito);
  }



  removeFromCarrito(prod: OrderUtil) {
    //buscamos el producto
    let i = 0;
    while (i < this.carrito.length) {
      let item = this.carrito[i];
      if (item.idProduct == prod.idProduct) {
        this.carrito.splice(i, 1);
        break;
      }
      i++;
    }
    this.productSummary();
    console.log(this.carrito);
  }

  getPrice(idProduct: number, idList: number) {
    var priceList = this.listaPricelist.filter(pl => (pl.idProduct == idProduct) && (pl.idList == idList));
    if (priceList.length < 1) { throw 'No hay Pricelist con idProduct = ' + idProduct + ' y idList = ' + idList };
    return priceList;
  }

  productListToOrderUtil(productList: ProductUtil[]) {
    let orderUtils: OrderUtil[] = [];
    //Traduce los productUtils a OrderUtils con todos los elementos necesarios para usarlos en pedidos
    for (let index = 0; index < productList.length; index++) {
      const item = productList[index];
      const coCurrency = this.conversionByPriceList ? item.coCurrency :
        this.monedaSeleccionada.coCurrency
      const price = this.conversionByPriceList ? item.price : this.conversionCurrency(item.price, item.coCurrency);
      const sub = this.carrito.filter(p => p.idProduct == item.idProduct);
      if (sub.length > 0) {
        //si esta en el carrito, simplemente sustituimos
        orderUtils.push(sub[0]);
      } else {
        const prod = this.listaProductos.find((p => p.idProduct == item.idProduct));
        if (prod == undefined) {
          console.log('producto ' + item.naProduct + ' tiene id no encontrado');
          continue;
        };
        let unitInfo: UnitInfo[] = [];
        const unitFiltered = this.listaUnitInfo.filter(u => u.idProduct == item.idProduct);
        if (unitFiltered.length < 1) {
          console.log('producto ' + item.naProduct + ' no tiene ProductUnit');
          continue;
        } else {
          //creamos una copia para evitar comportamiento anormal
          unitInfo = JSON.parse(JSON.stringify(unitFiltered));
        };
        var priceLists: PriceList[] = [];
        var priceListSeleccionado: PriceList = {} as PriceList;
        if (this.userCanChangePriceList && this.userCanChangePriceListProduct)  {
          priceLists = this.listaPricelist.filter(pl => (pl.idProduct == item.idProduct));           
        } else {
          priceLists = this.listaPriceListFiltrada.filter(pl => (pl.idProduct == item.idProduct));
        }
        if (priceLists.length < 1) {
          if (this.hideProdWithoutPrice) {
            //mostramos producto a pesar que no tiene lista de precio
          } else {
            console.log('producto ' + item.naProduct + ' no tiene pricelist');
            continue;
          }
        } else {
          priceListSeleccionado = priceLists[0];
        };
        var idLists: Set<number> = new Set<number>();
        priceLists.forEach(element => {
          idLists.add(element.idList);
        });
        const listList = this.listaList.filter(l => idLists.has(l.idList));
        if (listList.length < 1) {
          if (this.hideProdWithoutPrice) {
            //mostramos producto a pesar que no tiene lista de precio
          } else {
            console.log('producto  ' + item.naProduct + ' no tiene list');
            continue;
          }
        }
        const stockList = this.listaStock.filter(s => s.idProduct == item.idProduct);
        if (stockList.length < 1) {
          console.log('producto  ' + item.naProduct + ' no tiene stock');
          continue;
        };
        var warehouses: Warehouse[] = [];
        if (this.validateWarehouses) {
          warehouses = this.listaWarehouse.filter(w => w.idWarehouse == stockList[0].idWarehouse);
          if (warehouses.length < 1) {
            console.log('stock tiene warehouse invalido');
            continue;
          };
        }
        let quMultiple = 1;
        let quMinimum = 1;
        if (this.productMinMul) {
          const productMinMulList = this.listaProdMinMul.filter(pmm => pmm.idProduct == item.idProduct);
          if (productMinMulList.length > 0) {
            quMultiple = productMinMulList[0].quMultiple;
            quMinimum = productMinMulList[0].quMinimum;
          }
        }

        let discountList: Discount[] = [];
        if (priceListSeleccionado.idList != null) {
          discountList = this.listaDiscount.filter(d => d.idProduct == item.idProduct && d.idList == priceListSeleccionado.idList);
        }
        //descuento que representa que no hay descuento seleccionado       
        discountList.unshift({
          idDiscount: 0,
          idPriceList: 0,
          quDiscount: 0,
          coList: "0",
          idList: 0,
          coProduct: "0",
          idProduct: 0,
          coUnit: "0",
          idUnit: 0,
          quVolIni: 0,
          quVolFin: 0,
          nuPriority: 0,
          coEnterprise: "0",
          idEnterprise: 0
        })

        let imagenesProduct = this.imageServices.mapImagesFiles.get(item.coProduct);
        let imagenProduct = '';
        if (imagenesProduct === undefined
          || imagenesProduct === null
          || imagenesProduct.length < 1) {
          imagenProduct = this.imgNoDisponible;
        } else {
          imagenProduct = imagenesProduct[0];
        }

        let ou: OrderUtil = {
          "quAmount": 0,
          "idProduct": item.idProduct,
          "coProduct": item.coProduct,
          "naProduct": item.naProduct,
          "txDimension": prod.txDimension,
          "txPacking": prod.txPacking,
          "nuPriority": prod.nuPriority,
          "idEnterprise": item.idEnterprise,
          "nuPrice": price,
          "oppositeNuPrice": item.coCurrency == this.currencyService.getLocalCurrency().coCurrency ?
            this.currencyService.toHardCurrency(price) : this.currencyService.toLocalCurrency(price),
          "discountedNuPrice": 0,
          "quDiscount": 0,
          "coCurrency": coCurrency,
          "oppositeCoCurrency": this.currencyService.oppositeCoCurrency(coCurrency),
          "quStock": stockList[0].quStock,
          "quStockAux": stockList[0].quStock,
          "nuAmountDiscount": 0,
          "idDiscount": 0,
          "iva": this.ivaList.length > 0 ? this.ivaList[0].priceIva : 0,
          "ivaProducto": 0,
          "taxedNuPrice": 0,
          "idWarehouse": this.validateWarehouses ? warehouses[0].idWarehouse : 0,
          "prevWarehouse": this.validateWarehouses ? warehouses[0].idWarehouse : 0,
          "coWarehouse": this.validateWarehouses ? warehouses[0].coWarehouse : '',
          "naWarehouse": this.validateWarehouses ? warehouses[0].naWarehouse : '',
          "discountList": discountList,
          "imagenProduct": imagenProduct,
          "stepFactor": 0,
          "quMinimum": quMinimum,
          "quMultiple": quMultiple,
          "idProductStructure": item.idProductStructure,
          "idPriceList": priceLists.length > 0 ? priceListSeleccionado.idPriceList : 0,
          "coPriceList": priceLists.length > 0 ? priceListSeleccionado.coPriceList : '',
          "unitList": unitInfo,
          "idUnit": unitInfo.length > 0 ? unitInfo[0].idUnit : 0,
          "inCart": false,
          "txDescription": item.txDescription,
          "listaList": listList,
          "quPoints": item.points,
          "idList": this.listaSeleccionada.idList,
          "idInfo": index,
          "tienePrecio": price > 0,
          "favorito": false,
          "subtotal": 0,
          "subtotalConv": 0,
          "totalEnUnidades": 0,
        }
        orderUtils.push(ou);

      }
    }
    return orderUtils;
  }

  productSummary() {
    /*  
      Esta Funcion totaliza los productos en el carrito. 
      se debe ejecutar cada vez que hay un cambio en el pedido
    */
    //reset
    this.totalPedido = 0;
    this.finalPedido = 0;
    this.totalBase = 0;
    this.totalDctoXProducto = 0;
    this.totalGlobalDc = 0;
    this.totalUnidad = [];
    this.countTotalProductUnit = 0;
    this.orderIVA = 0;
    //resetConv
    this.totalPedidoConv = 0;
    this.finalPedidoConv = 0;
    this.totalDctoXProductoConv = 0;
    this.totalBaseConv = 0;
    this.totalGlobalDcConv = 0;
    this.orderIVAConv = 0;

    //[groupByTotalByLines]
    this.carritoWithLines = [];

    //assist 
    let curItem = 0;
    let dc = 0;
    let dcItem = 0;
    let ivaItem = 0;
    let iva = 0;

    if (!this.orderPedidoSeleccion) {
      this.carrito.sort((a, b) => a.idProduct - b.idProduct);
    }


    for (let i = 0; i < this.carrito.length; i++) {
      const item = this.carrito[i];

      //casos MINMULFAV
      if (this.productMinMul) {
        let pmmfMsg = false //flag para saber si muestro un mensaje porque no se cumple el monto de pmmf

        if (item.quMinimum > 1) { //verificamos que producto tenga el minimo
          if (item.quMinimum > item.quAmount) {
            item.quAmount = item.quMinimum;
            pmmfMsg = true;
          }

        }
        if (item.quMultiple > 1) {//verificamos que el producto sea multiplo de pmmf
          if (item.quAmount % item.quMultiple != 0) {
            for (let j = 0; j < item.quAmount; j++) {
              if (j * item.quMultiple > item.quAmount) {
                item.quAmount = j * item.quMultiple;
                pmmfMsg = true;
                break;
              }

            }
          }
        }

        if (pmmfMsg) {
          this.message.transaccionMsjModalNB(this.getTag('PED_AVISO_PMM1') + item.quMinimum +
            this.getTag('PED_AVISO_PMM2') + item.quMultiple
          )
          const unit = item.unitList.find(x => x.idUnit == item.idUnit);
          if (unit) {
            unit.quAmount = item.quAmount;
          }

        }

      }
      //fin minmulfav

      if (!this.conversionByPriceList) {
        item.nuPrice = this.conversionCurrency(item.nuPrice, item.coCurrency);
      }

      // Si no se manejan decimales, nos aseguramos que trabajemos con enteros
      if (!this.quUnitDecimals) {
        for (let j = 0; j < item.unitList.length; j++) {
          const unit = item.unitList[j];
          unit.quAmount = (Math.floor(unit.quAmount));
          if (item.idUnit == unit.idUnit) {
            item.quAmount = unit.quAmount;
          }
        }


      }

      curItem = 0;
      item.totalEnUnidades = 0;
      for (let j = 0; j < item.unitList.length; j++) {
        const unit = item.unitList[j];
        curItem += unit.quUnit * unit.quAmount * item.nuPrice;
        if (this.totalUnit) {
          this.totalUnidades(unit);
        }
        if (this.showTotalProductUnit) {
          if (unit.coUnit === this.codeTotalProductUnit) {
            this.countTotalProductUnit += unit.quAmount;
            this.nameTotalProductUnit = unit.naUnit;
          } else {
            this.countTotalProductUnit += item.quAmount * unit.quUnit;
          }
        }
        item.totalEnUnidades += unit.quUnit * unit.quAmount;

      }
      this.totalBase += curItem;



      //Descuento
      dc = 0;
      dcItem = 0;
      if (item.idDiscount && item.idDiscount > 0) {
        let selectedDiscount = this.listaDiscount.filter(d => d.idDiscount === item.idDiscount)[0];
        dc = selectedDiscount.quDiscount;
        dcItem = (curItem * (dc / 100));
        this.totalDctoXProducto = this.totalDctoXProducto + dcItem;
        curItem = curItem - dcItem;
        item.quDiscount = dc;
        item.nuAmountDiscount = dcItem;
        item.discountedNuPrice = item.nuPrice - (item.nuPrice * (dc / 100));

      } else {
        //no tiene descuento
        //item.idDiscount = 0;
        item.quDiscount = 0;
        item.nuAmountDiscount = 0;
        item.discountedNuPrice = item.nuPrice;
      }

      this.finalPedido = this.finalPedido + curItem;

      //IVA
      iva = 0;
      ivaItem = 0;
      if (item.iva != null) {
        iva = item.iva;
        ivaItem = curItem * (iva / 100);
        curItem = curItem + ivaItem;
        this.orderIVA += ivaItem;
        if (item.discountedNuPrice && item.discountedNuPrice > 0) {
          item.ivaProducto = item.discountedNuPrice * (iva / 100);
          item.taxedNuPrice = item.discountedNuPrice + item.ivaProducto;
        } else {
          item.ivaProducto = item.nuPrice * (iva / 100);
          item.taxedNuPrice = item.nuPrice + item.ivaProducto;
        }

      }
      item.subtotal = curItem;
      this.totalPedido = this.totalPedido + curItem;

      //dcto global
      if (this.userCanSelectGlobalDiscount && this.dctoGlobal) {
        item.subtotal = item.subtotal - (item.subtotal * (this.dctoGlobal / 100));
      }

      //conversion
      if (this.currencyService.multimoneda) {
        if(this.pedidoModificable){
          //pedido no enviado: hacemos la conversion actual
          if (this.monedaSeleccionada.coCurrency === this.currencyService.hardCurrency.coCurrency) {
            item.subtotalConv = this.currencyService.toLocalCurrency(item.subtotal);
          } else {
            item.subtotalConv = this.currencyService.toHardCurrency(item.subtotal);
          }
        }else{
          //pedido enviado: mantenemos la conversion original
          if (this.monedaSeleccionada.coCurrency === this.currencyService.hardCurrency.coCurrency) {
            item.subtotalConv = this.currencyService.toLocalCurrencyByNuValueLocal(item.subtotal, this.order.nuValueLocal);
          } else {
            item.subtotalConv = this.currencyService.toHardCurrencyByNuValueLocal(item.subtotal, this.order.nuValueLocal);
          }
        }


      } else {
        item.subtotalConv = 0;
      }

      if (this.groupByTotalByLines) {
        //[GroupByTotalByLines] llenamos el carrito especial de esta variable
        let naLine = this.parentStructures.get(item.idProductStructure);
        if (naLine === undefined) {
          //no hay Linea, no deberia pasar
          naLine = 'Nombre de Linea';
        }
        let slot = this.carritoWithLines.find(slot => naLine === slot.naLine)
        if (slot) {
          //ya habia un Line, agregamos el producto
          slot.items.push(item);
          slot.total += item.subtotal
          slot.totalConversion += item.subtotalConv;
        } else {
          //es el primer producto con este line
          this.carritoWithLines.push({
            items: [item],
            naLine: naLine,
            total: item.subtotal,
            totalConversion: item.subtotalConv
          })
        }

      }

    }//fin for(carrito)

    //descuento global
    if (this.userCanSelectGlobalDiscount && this.dctoGlobal) {
      this.totalGlobalDc = this.finalPedido * (this.dctoGlobal / 100);
      this.finalPedido = this.finalPedido - this.totalGlobalDc;
      this.totalPedido = this.totalPedido - (this.totalPedido * (this.dctoGlobal / 100));
    }

    if (this.currencyService.multimoneda) {
      if(this.pedidoModificable){
        //pedido no enviado: hacemos la conversion actual
        if (this.monedaSeleccionada.coCurrency === this.currencyService.hardCurrency.coCurrency) {
        //caso: pedido en moneda FUERTE
        this.totalPedidoConv = this.currencyService.toLocalCurrency(this.totalPedido);
        this.finalPedidoConv = this.currencyService.toLocalCurrency(this.finalPedido);
        this.totalDctoXProductoConv = this.currencyService.toLocalCurrency(this.totalDctoXProducto);
        this.totalBaseConv = this.currencyService.toLocalCurrency(this.totalBase);
        this.totalGlobalDcConv = this.currencyService.toLocalCurrency(this.totalGlobalDc);
        this.orderIVAConv = this.currencyService.toLocalCurrency(this.orderIVA);

      } else {
        //caso pedido en moneda LOCAL
        this.totalPedidoConv = this.currencyService.toHardCurrency(this.totalPedido);
        this.finalPedidoConv = this.currencyService.toHardCurrency(this.finalPedido);
        this.totalDctoXProductoConv = this.currencyService.toHardCurrency(this.totalDctoXProducto);
        this.totalBaseConv = this.currencyService.toHardCurrency(this.totalBase);
        this.totalGlobalDcConv = this.currencyService.toHardCurrency(this.totalGlobalDc);
        this.orderIVAConv = this.currencyService.toHardCurrency(this.orderIVA);
      }

      }else{
        //pedido enviado: mantenemos la conversion original
        let nuValueLocal = this.order.nuValueLocal;
         if (this.monedaSeleccionada.coCurrency === this.currencyService.hardCurrency.coCurrency) {
        //caso: pedido en moneda FUERTE
        this.totalPedidoConv = this.currencyService.toLocalCurrencyByNuValueLocal(this.totalPedido, nuValueLocal);
        this.finalPedidoConv = this.currencyService.toLocalCurrencyByNuValueLocal(this.finalPedido, nuValueLocal);
        this.totalDctoXProductoConv = this.currencyService.toLocalCurrencyByNuValueLocal(this.totalDctoXProducto, nuValueLocal);
        this.totalBaseConv = this.currencyService.toLocalCurrencyByNuValueLocal(this.totalBase, nuValueLocal);
        this.totalGlobalDcConv = this.currencyService.toLocalCurrencyByNuValueLocal(this.totalGlobalDc, nuValueLocal);
        this.orderIVAConv = this.currencyService.toLocalCurrencyByNuValueLocal(this.orderIVA, nuValueLocal);

      } else {
        //caso pedido en moneda LOCAL
        this.totalPedidoConv = this.currencyService.toHardCurrencyByNuValueLocal(this.totalPedido, nuValueLocal);
        this.finalPedidoConv = this.currencyService.toHardCurrencyByNuValueLocal(this.finalPedido, nuValueLocal);
        this.totalDctoXProductoConv = this.currencyService.toHardCurrencyByNuValueLocal(this.totalDctoXProducto, nuValueLocal);
        this.totalBaseConv = this.currencyService.toHardCurrencyByNuValueLocal(this.totalBase, nuValueLocal);
        this.totalGlobalDcConv = this.currencyService.toHardCurrencyByNuValueLocal(this.totalGlobalDc, nuValueLocal);
        this.orderIVAConv = this.currencyService.toHardCurrencyByNuValueLocal(this.orderIVA, nuValueLocal);
      }

      }
     
    }


    this.setChangesMade(true);
  }

  conversionCurrency(price: number, coCurrency: string) {
    /*
     * Convierte los precios de los productos a la moneda del pedido para usar con
     * conversionByPriceList = false
     * 
     */
    let selectedCoCurrency = this.monedaSeleccionada.coCurrency;
    let localCurrency = this.currencyService.localCurrency.coCurrency;
    let hardCurrency = this.currencyService.hardCurrency.coCurrency;

    if (coCurrency === selectedCoCurrency) {
      //Si es la misma moneda, no hay que hacer conversion
      return price;
    } else {
      if (selectedCoCurrency === localCurrency) {
        // Caso A: Pedido en Moneda Local
        coCurrency = localCurrency;
        return this.currencyService.toLocalCurrency(price);
      } else {
        // Caso B: Pedido en Moneda Fuerte
        coCurrency = hardCurrency;
        return this.currencyService.toHardCurrency(price);
      }
    }


  }



  getPricelists(idEnterprise: number) {
    return this.db.getPricelists(this.database, idEnterprise);
  }

  getOrderTypes(coEnterprise: string) {
    return this.db.getOrderTypes(this.database, coEnterprise);
  }

  getAddressClient(idClient: number) {
    return this.db.getAddressClient(this.database, idClient);
  }

  getLists(idEnterprise: number) {
    return this.db.getLists(this.database, idEnterprise);
  }

  getPriceListbyEnterprise(idEnterprise: number) {
    return this.db.getPriceListbyEnterprise(this.database, idEnterprise);
  }

  getUnitInfo(idEnterprise: number) {
    return this.db.getUnitInfo(this.database, idEnterprise);

  }

  getPriceListbyCurrency(idEnterprise: number, idCurrency: number) {
    return this.db.getPriceListbyCurrency(this.database, idEnterprise, idCurrency);
  }

  getProducts(idEnterprise: number) {
    return this.db.getProducts(this.database, idEnterprise);

  }

  getIVAList() {
    return this.db.getIVAList(this.database);
  }

  getDiscounts(idEnterprise: number) {
    return this.db.getDiscounts(this.database, idEnterprise);
  }

  getGlobalDiscounts() {
    return this.db.getGlobalDiscounts(this.database, this.getTag('PED_NO_DC'));
  }

  getPaymentConditions(idEnterprise: number) {
    return this.db.getPaymentConditions(this.database, idEnterprise);
  }

  getWarehouses(idEnterprise: number) {
    return this.db.getWarehouses(this.database, idEnterprise);
  }

  getStocks(idEnterprise: number) {
    return this.db.getStocks(this.database, idEnterprise);
  }



  saveOrder(order: Orders) {

    return this.db.saveOrder(this.database, order).then(result => {
      console.log("Pedido #" + order.coOrder + " Guardado!");
      this.setChangesMade(false);
      return result;
    });

  }

  saveOrderBatch(orders: Orders[]) {
    //Guarda un batch de pedidos, se usa para guardar pedidos que vienen de una sincronizacion
    return this.db.saveOrderBatch(this.database, orders).then(result => {
      console.log(orders.length + " Pedidos Guardados!");
      this.setChangesMade(false);
      return result;
    });

  }

  getClient(idClient: number) {

    return this.db.getClient(this.database, idClient, this.currencyService.multimoneda);
  }

  getPedido(coOrder: string) {
    //Trae un pedido especifico usando el coOrder.

    return this.db.getPedido(this.database, coOrder);
  }

  abrirPedido(pedido: Orders) {
    //prepara el pedido para ser copiado o verificado

    this.order = pedido;
    this.openOrder = true;
    this.router.navigate(['pedido']);
  }

  copiarPedido(pedido: Orders) {
    //reescribimos los identificadores para tener un pedido nuevo
    let coOrder = this.dateService.generateCO(0);
    console.log("Copiando Pedido " + pedido.coOrder + " a " + coOrder);
    pedido.coOrder = coOrder;
    this.coOrder = coOrder;
    pedido.idOrder = 0;
    pedido.stOrder = DELIVERY_STATUS_SAVED;
    for (let i = 0; i < pedido.orderDetails.length; i++) {
      const detail = pedido.orderDetails[i];
      let coOrderDetail = this.dateService.generateCO(i);
      detail.coOrderDetail = coOrderDetail;
      detail.coOrder = coOrder;
      detail.idOrderDetail = 0;
      for (let j = 0; j < detail.orderDetailUnit.length; j++) {
        const unit = detail.orderDetailUnit[j];
        let coOrderDetailUnit = this.dateService.generateCO(j);
        unit.coOrderDetailUnit = coOrderDetailUnit;
        unit.coOrderDetail = coOrderDetail;
        unit.idOrderDetailUnit = 0;

      }
      if (detail.orderDetailDiscount) {
        for (let j = 0; j < detail.orderDetailDiscount.length; j++) {
          const discount = detail.orderDetailDiscount[j];

          discount.coOrderDetail = coOrderDetail;
          discount.idOrderDetail = 0;
          discount.idOrderDetailDiscount = 0;
        }
      }


    }

    return pedido;
  }

  getListaPedidos() {
    //actualiza la lista de pedidos para mostrarlos en pedidos-lista (para copiar o ver);
    return this.db.getListaPedidos(this.database).then(list => {
      this.listaPedidos = list;
      console.log(list);

    });
  }
  getOrderUtilsbyIdProduct(idProducts: number[], idList: number) {
    return this.db.getProductsbyIdProduct(this.database, idProducts, idList, this.monedaSeleccionada.coCurrency,
      this.empresaSeleccionada.idEnterprise, this.conversionByPriceList).then(result => {

        let productList = [] as ProductUtil[];
        for (let i = 0; i < result.rows.length; i++) {
          let prod = result.rows.item(i);
          productList.push({
            idProduct: prod.id_product,
            coProduct: prod.co_product,
            naProduct: prod.na_product,
            points: prod.points,
            txDescription: prod.tx_description,
            idList: prod.id_list,
            price: prod.nu_price,
            coCurrency: prod.co_currency,
            priceOpposite: prod.co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.toHardCurrency(prod.nu_price) :
              this.currencyService.toLocalCurrency(prod.nu_price), // Precio en la moneda opuesta a la lista de precio
            coCurrencyOpposite: this.currencyService.oppositeCoCurrency(prod.co_currency),
            stock: prod.qu_stock,
            idEnterprise: prod.id_enterprise,
            coEnterprise: prod.co_enterprise,
            images: this.imageServices.mapImagesFiles.get(prod.co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(prod.co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: prod.id_product_structure,
          });
        }
        return this.productListToOrderUtil(productList);
      })
  }

  getOrderUtilsbyIdProductAndPricelists(idProducts: number[], idPriceLists: number[]) {
    return this.db.getProductsbyIdProductAndPricelists(this.database, idProducts, idPriceLists, this.monedaSeleccionada.coCurrency,
      this.empresaSeleccionada.idEnterprise, this.conversionByPriceList).then(result => {

        let productList = [] as ProductUtil[];
        for (let i = 0; i < result.rows.length; i++) {
          let prod = result.rows.item(i);
          productList.push({
            idProduct: prod.id_product,
            coProduct: prod.co_product,
            naProduct: prod.na_product,
            points: prod.points,
            txDescription: prod.tx_description,
            idList: prod.id_list,
            price: prod.nu_price,
            coCurrency: prod.co_currency,
            priceOpposite: prod.co_currency === this.currencyService.getLocalCurrency ?
              this.currencyService.toHardCurrency(prod.nu_price) :
              this.currencyService.toLocalCurrency(prod.nu_price), // Precio en la moneda opuesta a la lista de precio
            coCurrencyOpposite: this.currencyService.oppositeCoCurrency(prod.co_currency),
            stock: prod.qu_stock,
            idEnterprise: prod.id_enterprise,
            coEnterprise: prod.co_enterprise,
            images: this.imageServices.mapImagesFiles.get(prod.co_product) === undefined ? '../../../assets/images/nodisponible.png' : this.imageServices.mapImagesFiles.get(prod.co_product)?.[0],
            typeStocks: undefined,
            productUnitList: undefined,
            idProductStructure: prod.id_product_structure,
          });
        }
        return this.productListToOrderUtil(productList);
      })
  }

  deleteOrder(coOrder: string) {
    //borra el pedido y todos sus documentos relacionados
    return this.db.deleteOrder(this.database, coOrder).then(result => {
      console.log("Borrado pedido " + coOrder);
      console.log(result);
    }).catch(error => {
      console.error("Error al borrar pedido " + coOrder);
      console.error(error);
    });
  }

  getClientChannelOrderTypes(idClient: number) {
    return this.db.getClientChannelOrderTypes(this.database, idClient, this.empresaSeleccionada.idEnterprise);
  }

  getOrderTypeProductStructure(idEnterprise: number) {
    return this.db.getOrderTypeProductStructure(this.database, idEnterprise);
  }

  getDistributionChannels(idEnterprise: number) {
    return this.db.getDistributionChannels(this.database, idEnterprise);
  }



  totalUnidades(input: UnitInfo) {
    //esta funcion maneja la lista de totales por unidad que aparece en el tab 'total'
    //la idea es vaciar totalUnidad, e irla llenando con las unidades que van apareciendo en la totalizacion
    let units = this.totalUnidad.filter(u => u.idUnit == input.idUnit);
    if (units.length > 0) {
      units[0].quAmount += input.quAmount;
    } else {
      // hacemos copia para evitar comportamiento anormal
      let unit = JSON.parse(JSON.stringify(input));
      this.totalUnidad.push(unit);
    }
  }

  getProductStructures(idEnterprise: number) {
    return this.db.getProductStructures(this.database, idEnterprise);
  }

  getClientAvgStock(idEnterprise: number, idClient: number, idProductUnit: number[], idAddressClient: number, idProduct: number[]) {
    return this.db.getClientAvgStock(this.database, idEnterprise, idClient, idProductUnit, idAddressClient, idProduct);
  }

  getParentStructures() {
    for (let i = 0; i < this.productStructures.length; i++) {
      const item = this.productStructures[i];
      const parent = this.getParent(item);
      this.parentStructures.set(item.idProductStructure, parent.naProductStructure);
    }
    //console.log("PARENT STRUCTURES")
    //console.log(this.parentStructures);

  }

  getParent(ps: ProductStructure): ProductStructure { //!! funcion recursiva
    let parent = this.productStructures.find(p => p.coProductStructure === ps.scoProductStructure);
    if (parent) {
      if (parent.scoProductStructure === "NULL") {
        return parent;
      } else {
        return this.getParent(parent);
      }
    } else {
      console.log("hubo un problema al localizar estructura padre de " + ps.naProductStructure);
      return ps;
    }

  }

  getProductMinMulList(idEnterprise: number) {
    return this.db.getProductMinMul(this.database, idEnterprise);
  }
  /*
    getSaldosCliente(id_client: number, co_currency: string){
      return this.db.getSaldosCliente(this.database, id_client,
         this.currencyService.multimoneda ,co_currency);
    }
  
  */

  async sugerirPedido() {

    //creamos un pedido nuevo
    let cliente = this.datosPedidoSugerido.cliente;
    let direccion = this.datosPedidoSugerido.direccion;
    let coOrder = this.dateService.generateCO(0);
    let ProductIds: number[] = this.datosPedidoSugerido.productos.map(p => p.idProduct);
    let productUnitIds: number[] = [];
    let errorMsgFlag = false;
    //console.log('LISTA UNIT INFO');
    //console.log(JSON.stringify(this.listaUnitInfo));
    for (let i = 0; i < this.datosPedidoSugerido.productos.length; i++) {
      const product = this.datosPedidoSugerido.productos[i];
      const unitInfo = this.listaUnitInfo.find(u => (u.coUnit === product.coUnit) && (u.idProduct == product.idProduct));
      //console.log('unitInfo: '+JSON.stringify(unitInfo));
      //console.log('product: '+JSON.stringify(product));
      if (unitInfo != undefined) {
        productUnitIds.push(unitInfo.idProductUnit);
      }
    }

    this.listaSeleccionada = this.datosPedidoSugerido.list;

    //buscamos los promedios de ese cliente:
    let promedios: ClientAvgProduct[];
    await this.getClientAvgStock(this.empresaSeleccionada.idEnterprise, cliente.idClient,
      productUnitIds, direccion.idAddress, ProductIds).then(result => {
        promedios = result;
      });


    await this.getOrderUtilsbyIdProduct(ProductIds, this.listaSeleccionada.idList).then(orderUtils => {
      let details: OrderDetail[] = [];
      let pedido: Orders = {
        "idOrder": 0,
        "coOrder": coOrder,
        "coClient": cliente.coClient,
        "idClient": cliente.idClient,
        "daOrder": this.dateService.hoyISOFullTime(),
        "daCreated": this.dateService.hoyISOFullTime(),
        "naResponsible": "",
        "idUser": this.getIdUser(),
        "idOrderCreator": this.getIdUser(),
        "inOrderReview": false,
        "nuAmountTotal": 0,
        "nuAmountFinal": 0,
        "coCurrency": this.empresaSeleccionada.coCurrencyDefault,
        "daDispatch": this.dateService.hoyISO(),
        "txComment": this.getTag('INV_PED_SUG'),
        "nuPurchase": "",
        "coEnterprise": this.empresaSeleccionada.coEnterprise,
        "coUser": this.getCoUser(),
        "coPaymentCondition": cliente.coPaymentCondition,
        "idPaymentCondition": cliente.idPaymentCondition,
        "idEnterprise": this.empresaSeleccionada.idEnterprise,
        "coAddress": direccion.coAddress,
        "idAddress": direccion.idAddress,
        "nuAmountDiscount": 0,
        "nuAmountTotalBase": 0,
        "stOrder": VISIT_STATUS_SAVED,
        "coordenada": this.coordenadas,
        "nuDiscount": 0,
        "idCurrency": this.currencyService.getCurrency(this.empresaSeleccionada.coCurrencyDefault).idCurrency,
        "idCurrencyConversion": this.currencyService.getOppositeCurrency(this.empresaSeleccionada.coCurrencyDefault).idCurrency,
        "nuValueLocal": this.currencyService.localValue,
        "nuAmountTotalConversion": 0,
        "nuAmountFinalConversion": 0,
        "procedencia": "Denario",
        "nuAmountTotalBaseConversion": 0,
        "nuAmountDiscountConversion": 0,
        "idOrderType": this.listaOrderTypes[0].idOrderType,
        "orderDetails": details,
        "nuDetails": 0,
        "nuAmountTotalProductDiscount": 0,
        "nuAmountTotalProductDiscountConversion": 0,
        "hasAttachments": false,
        "nuAttachments": 0,
        "idDistributionChannel": null,
        "coDistributionChannel": null,
      }

      for (let i = 0; i < this.datosPedidoSugerido.productos.length; i++) {
        let product = this.datosPedidoSugerido.productos[i];
        let item = orderUtils.filter(x => x.idProduct == product.idProduct)[0];
        let detailUnits: OrderDetailUnit[] = [];
        let coOrderDetail = this.dateService.generateCO(i);
        if ((item != undefined) && (item.nuPrice > 0)) {
          for (let j = 0; j < item.unitList.length; j++) {
            let unit = item.unitList[j];
            let quOrder = 0;
            let promedio = promedios.find(x => (x.idProduct == unit.idProduct) && (x.idProductUnit == unit.idProductUnit));
            if (promedio == undefined) {
              quOrder = product.totalUnits;
            } else {
              quOrder = promedio.average - product.totalUnits;
            }
            let quSuggested = quOrder;
            if (item.quMultiple > 1) {
              //caso productMinMul
              let n = quOrder % item.quMultiple;
              if (quOrder < item.quMinimum) {
                quOrder = item.quMinimum;
              } else {
                quSuggested = item.quMultiple - n + quOrder;
              }
            }


            let detailunit: OrderDetailUnit = {
              "idOrderDetailUnit": 0,
              "coOrderDetailUnit": this.dateService.generateCO((10 * i) + j),
              "coOrderDetail": coOrderDetail,
              "coProductUnit": unit.coProductUnit,
              "idProductUnit": unit.idProductUnit,
              "quOrder": quSuggested,
              "coEnterprise": this.empresaSeleccionada.coEnterprise,
              "idEnterprise": this.empresaSeleccionada.idEnterprise,
              "coUnit": unit.coUnit,
              "quSuggested": quSuggested
            }

            detailUnits.push(detailunit);
          }
          let detail: OrderDetail = {
            "idOrderDetail": 0,
            "coOrderDetail": coOrderDetail,
            "coOrder": coOrder,
            "coProduct": product.coProduct,
            "naProduct": product.naProduct,
            "idProduct": product.idProduct,
            "nuPriceBase": item.nuPrice,
            "nuAmountTotal": 0,
            "coWarehouse": item.coWarehouse,
            "idWarehouse": item.idWarehouse,
            "quSuggested": 0,
            "coEnterprise": this.empresaSeleccionada.coEnterprise,
            "idEnterprise": this.empresaSeleccionada.idEnterprise,
            "iva": item.iva,
            "nuDiscountTotal": 0,
            "coDiscount": "",
            "idDiscount": 0,
            "coPriceList": item.coPriceList,
            "idPriceList": item.idPriceList,
            "posicion": i,
            "nuPriceBaseConversion": item.oppositeNuPrice,
            "nuDiscountTotalConversion": 0,
            "nuAmountTotalConversion": 0,
            "orderDetailUnit": detailUnits,
            "orderDetailDiscount": []
          }
          details.push(detail);
        } else {
          errorMsgFlag = true;
        }
      }
      pedido.orderDetails = details;
      pedido.nuDetails = details.length;
      this.order = pedido;
      //reseteamos al estado natural
      this.desdeSugerencia = false;
      if (this.datosPedidoSugerido.enviar) {
        //para enviarlo luego
        this.coClientStockAEnviar = this.datosPedidoSugerido.coClientStock;
        this.idClientStockAEnviar = this.datosPedidoSugerido.idClientStock;
      }
      this.datosPedidoSugerido = {} as SugerenciaPedido;


      if (errorMsgFlag) {
        this.message.transaccionMsjModalNB(this.getTag('PED_ERROR_SUGERIR'));
      }

    })
  }

  getIdUser() {
    let idUser = localStorage.getItem('idUser');
    if (idUser == null) {
      return 0;
    } else {
      return Number.parseInt(idUser);
    }
  }

  getCoUser() {
    let coUser = localStorage.getItem('coUser');
    if (coUser == null) {
      return '';
    } else {
      return coUser;
    }
  }

/*   getStatusPedidos(idOrder: number) {
    //trae los estados de pedidos que se pueden usar en la app
    return this.historyTransaction.getStatusTransaction(this.database, 2, idOrder);

  } */



}



