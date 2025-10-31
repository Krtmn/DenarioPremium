import { ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AdjuntoComponent } from 'src/app/adjuntos/adjunto/adjunto.component';
import { ClienteSelectorComponent } from 'src/app/cliente-selector/cliente-selector.component';
import { Client } from 'src/app/modelos/tables/client';
import { CurrencyEnterprise } from 'src/app/modelos/tables/currencyEnterprise';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { PedidosService } from '../pedidos.service';
import { OrderType } from 'src/app/modelos/tables/orderType';
import { AddresClient } from 'src/app/modelos/tables/addresClient';
import { List } from 'src/app/modelos/tables/list';
import { PriceList } from 'src/app/modelos/tables/priceList';
import { PaymentCondition } from 'src/app/modelos/tables/paymentCondition';
import { ProductosTabComponent } from 'src/app/productos-tab/productos-tab.component';
import { ProductService } from 'src/app/services/products/product.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common'
import { COLOR_VERDE, DELIVERY_STATUS_NEW, DELIVERY_STATUS_SAVED, DELIVERY_STATUS_TO_SEND } from 'src/app/utils/appConstants';
import { ClienteSelectorService } from 'src/app/cliente-selector/cliente-selector.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { Orders } from 'src/app/modelos/tables/orders';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { OrderDetail } from 'src/app/modelos/tables/orderDetail';
import { Discount } from 'src/app/modelos/tables/discount';
import { OrderDetailUnit } from 'src/app/modelos/tables/orderDetailUnit';
import { OrderDetailDiscount } from 'src/app/modelos/orderDetailDiscount';
import { IonInput, Platform } from '@ionic/angular';
import { PendingTransaction } from 'src/app/modelos/tables/pendingTransactions';
import { AutoSendService } from 'src/app/services/autoSend/auto-send.service';
import { Router } from '@angular/router';
import { ServicesService } from 'src/app/services/services.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { OrderUtil } from 'src/app/modelos/orderUtil';
import { ClientChannelOrderType } from 'src/app/modelos/tables/clientChannelOrderType';
import { OrderTypeProductStructure } from 'src/app/modelos/tables/orderTypeProductStructure';
import { DistributionChannel } from 'src/app/modelos/tables/distributionChannel';

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.scss'],
  standalone: false
})
export class PedidoComponent implements OnInit {


  // Injects
  public enterpriseServ = inject(EnterpriseService);
  public currencyServ = inject(CurrencyService);
  public dateServ = inject(DateServiceService)
  public orderServ = inject(PedidosService);
  public productService = inject(ProductService);
  public adjuntoService = inject(AdjuntoService);
  public location = inject(Location);
  public clienteSelectorService = inject(ClienteSelectorService);
  public message = inject(MessageService);
  public router = inject(Router);
  public dbServ = inject(SynchronizationDBService);
  public services = inject(ServicesService);
  public autoSend = inject(AutoSendService);

  public geoServ = inject(GeolocationService);

  public changeDetector = inject(ChangeDetectorRef);



  //tags
  productsTabTags = new Map<string, string>([]);


  public segment = 'default';
  public lockSegments: Boolean = true;
  public hasClient = false;
  public listaEmpresa: Enterprise[] = [];
  public listaDirecciones: AddresClient[] = [];
  public listaDistributionChannel: DistributionChannel[] = [];

  public listaOrderTypes: OrderType[] = [];
  public empresaSeleccionada!: Enterprise;
  public tipoOrden!: OrderType;
  public distChannel!: DistributionChannel;
  public tipoOrdenAnterior!: OrderType;
  public listaAnterior!: List;
  public paymentCondition!: PaymentCondition;

  public hideAdjunto: boolean = true;

  naResponsible = '';
  txComment = '';

  //coordenadas = '';

  inOrderReview = false;
  nuPurchase = '';

  public viewOnly = false; //true = solo lectura


  public direccionCliente!: AddresClient;
  public direccionAnterior!: AddresClient;
  public fechaMinima = this.dateServ.hoyISO();
  public fechaPedido = this.dateServ.hoyISOFullTime();
  public fechaDespacho = this.dateServ.futureDaysISO(2);
  public daDispatchChanged = false;
  public openDaDispatchModal = false;
  public multiempresa = false;
  public multimoneda = false;
  public monedaSeleccionada!: CurrencyEnterprise;
  public localCurrency = {} as CurrencyEnterprise;
  public hardCurrency = {} as CurrencyEnterprise;

  nuOrderRedLabel = false;
  clientRedLabel = false;
  addressRedLabel = false;
  public modalInfoClienteOpen: boolean = false;
  saveOrExitOpen = false;
  parteDecimal = 2;

  nuValueLocal = 0;
  tasaCambio = '0';// la tasa que se muestra en el input

  @Output()
  goToNuevoPedido: EventEmitter<any> = new EventEmitter<any>();

  //Children
  @ViewChild(ClienteSelectorComponent) selectorCliente!: ClienteSelectorComponent;
  @ViewChild(AdjuntoComponent) selectorAdjuntos!: AdjuntoComponent;
  @ViewChild(ProductosTabComponent) selectorProductos!: ProductosTabComponent;
  @ViewChild('nuPurchaseInput') nuPurchaseInput!: IonInput; //el campo mas maricón de toda la creación.
  @ViewChild('naResponsibleInput') naResponsibleInput!: IonInput;
  @ViewChild('txCommentInput') txCommentInput!: IonInput;

  ClientChangeSubscription: Subscription = this.clienteSelectorService.ClientChanged.subscribe(client => {
    //se ejecuta cuando cambia el cliente pero se debe realizar un reset
    let enterprise = this.empresaSeleccionada;
    this.reset(); //reseteamos todo menos la empresa
    this.empresaSeleccionada = enterprise;
    //this.orderServ.reset();

    this.setClientfromSelector(client);
    //como estamos recien reseteados, no hay necesidad de chequear 
    this.clienteSelectorService.checkClient = false;

  })

  backButtonSubscription: Subscription = this.platform.backButton.subscribeWithPriority(10, () => {
    //console.log('backButton was called!');
    this.goBack();
  });

  constructor(
    private platform: Platform,
  ) {

  }

  async ngOnInit() {


    this.productsTabTags = this.orderServ.ProdSelecttags;
    this.adjuntoService.setup(this.dbServ.getDatabase(), this.orderServ.signatureOrder, false, COLOR_VERDE);

    if (this.orderServ.desdeSugerencia) {
      await this.orderServ.sugerirPedido();
    }

    //setup empresas
    this.enterpriseServ.setup(this.dbServ.getDatabase()).then(() => {
      this.listaEmpresa = this.enterpriseServ.empresas;
      if (this.orderServ.openOrder) {
        this.empresaSeleccionada = this.enterpriseServ.getEntepriseById(this.orderServ.order.idEnterprise);
        this.orderServ.empresaSeleccionada = this.empresaSeleccionada;
        this.orderServ.setup();
        this.tipoOrden = this.orderServ.listaOrderTypes.find((o) => o.idOrderType == this.orderServ.order.idOrderType)!;

        this.tipoOrdenAnterior = this.tipoOrden;
        if (!this.tipoOrden) {
          console.error('Tipo de orden original no encontrado: ' + this.orderServ.order.idOrderType);
        }

        this.orderServ.getClient(this.orderServ.order.idClient).then(c => {
          this.setClientfromSelector(c);
          if (!this.viewOnly) {
            this.selectorCliente.setup(this.empresaSeleccionada.idEnterprise,
              "Pedidos", 'fondoVerde', c, true);
          }
        });

        //SI EL STORDER ES 6, NO DEBO MOSTRAR LA PESTAÑA ADJUNTOS
        if (this.orderServ.order.stOrder == 6) {
          this.hideAdjunto = false;
        } else {
          this.hideAdjunto = true;
        }

      } else {
        this.hideAdjunto = true;
        this.empresaSeleccionada = this.enterpriseServ.defaultEnterprise();
        this.orderServ.empresaSeleccionada = this.empresaSeleccionada;
        this.orderServ.setup();
        this.orderServ.dctoGlobal = 0;
        this.orderServ.order = this.createEmptyOrder(); //pedido vacio porque no puede ser null.
        this.orderServ.cliente = { lbClient: this.orderServ.getTag("PED_PLACEHOLDER_CLIENTE") } as Client;
      }

      this.multiempresa = this.enterpriseServ.esMultiempresa();
      if (!this.viewOnly) {
        this.selectorCliente.setup(this.empresaSeleccionada.idEnterprise,
          "Pedidos", 'fondoVerde', null, false);
      }


      //setup monedas
      this.currencyServ.setup(this.dbServ.getDatabase()).then(() => {
        this.multimoneda = this.currencyServ.multimoneda;
        
        this.localCurrency = this.currencyServ.getLocalCurrency();
        if (this.orderServ.openOrder) {
          this.orderServ.monedaSeleccionada = this.currencyServ.getCurrency(this.orderServ.order.coCurrency);
          if(this.orderServ.pedidoModificable) {
            this.tasaCambio = this.currencyServ.getLocalValue();
            this.nuValueLocal = Number.parseFloat(this.tasaCambio);
          }else{
            this.nuValueLocal = this.orderServ.order.nuValueLocal;
            this.tasaCambio = this.currencyServ.formatNumber(this.nuValueLocal);
            
          }
        }
        else {
          this.orderServ.monedaSeleccionada = this.currencyServ.getCurrency(this.empresaSeleccionada.coCurrencyDefault);
          this.nuValueLocal = Number.parseFloat(this.currencyServ.getLocalValue());
          this.tasaCambio = this.currencyServ.getLocalValue();
        }
        if (this.multimoneda) {
          this.hardCurrency = this.currencyServ.getHardCurrency();
        }
        

        if (this.orderServ.openOrder) {
          this.abrirPedido();

        } else {
          this.reset();
          this.orderServ.coOrder = this.dateServ.generateCO(0);
        }
      })
      //fin setup monedas


    });
    //fin setup empresas


    //config
    this.parteDecimal = this.orderServ.parteDecimal;
    if (!this.orderServ.userMustActivateGPS) {
      //chequeo suave de coordenadas si variable es false
      this.geoServ.getCurrentPosition().then(coords => { this.orderServ.coordenadas = coords });
    }
  }

  ngOnDestroy() {
    this.ClientChangeSubscription.unsubscribe();
    this.backButtonSubscription.unsubscribe();
  }

  reset() {
    this.orderServ.carrito = [];
    this.orderServ.totalUnidad = [];

    this.empresaSeleccionada = this.enterpriseServ.defaultEnterprise();
    this.orderServ.monedaSeleccionada =
      this.currencyServ.getCurrency(this.empresaSeleccionada.coCurrencyDefault);
    this.monedaSeleccionada = this.orderServ.monedaSeleccionada;

    this.adjuntoService.setup(this.dbServ.getDatabase(), this.orderServ.signatureOrder, false, COLOR_VERDE);

    this.orderServ.productSummary();
  }

  abrirPedido() {
    //esta funcion toma un pedido guardado o enviado y lo pone para modificarlo o mostrarlo respectivamente
    //mini reset 
    this.orderServ.carrito = [];
    //[groupByTotalByLines]
    this.orderServ.carritoWithLines = [];
    this.orderServ.totalUnidad = [];
    this.monedaSeleccionada = this.orderServ.monedaSeleccionada;

    //para pedidos enviados: ocultamos los botones y el tab de general.
    this.viewOnly = !this.orderServ.pedidoModificable;

    //Traemos los adjuntos mientras hacemos lo demas.
    this.adjuntoService.setup(this.dbServ.getDatabase(), this.orderServ.signatureOrder, this.viewOnly, COLOR_VERDE);
    this.adjuntoService.getSavedPhotos(this.dbServ.getDatabase(), this.orderServ.order.coOrder, 'pedidos');

    //traemos datos del header que no hemos traido aun

    // Empresa: hecho en setup empresas
    // Moneda: hecho en setup monedas
    // Cliente: hecho en setup empresa
    // Direccion de cliente: hecho en setup empresa, setClientFromSelector(c);
    // Tipo de orden: hecho en setup empresa
    // Lista de precio: hecho en setup empresa, setClientFromSelector(c);
    //Numero de pedido: 

    this.nuPurchase = this.orderServ.order.nuPurchase === null ?
      '' : this.orderServ.order.nuPurchase;

    //coOrder
    this.orderServ.coOrder = this.orderServ.order.coOrder;

    //fecha de pedido:
    if (this.orderServ.pedidoModificable) {
      //usamos la fecha que usariamos si fuera pedido nuevo
      this.fechaMinima = this.dateServ.hoyISO();
      this.fechaPedido = this.dateServ.hoyISOFullTime();
      if (this.orderServ.order.daDispatch != null) {
        this.fechaDespacho = this.dateServ.toISOString(this.orderServ.order.daDispatch);
      } else {
        this.fechaDespacho = this.dateServ.futureDaysISO(2);
      }

      this.daDispatchChanged = false;
    } else {
      //copio las fechas originales para mostrarlas
      this.fechaMinima = this.dateServ.toISOString(this.orderServ.order.daOrder);
      if (this.orderServ.order.daDispatch != null) {
        this.fechaDespacho = this.dateServ.toISOString(this.orderServ.order.daDispatch);
      }
      this.fechaPedido = this.dateServ.toISOString(this.orderServ.order.daOrder);
      this.daDispatchChanged = true;
    }
    //responsable
    this.naResponsible = this.orderServ.order.naResponsible;
    //comentario
    this.txComment = this.orderServ.order.txComment;
    //condicion de pago hecho en setup empresa, setClientFromSelector(c);
    //FIN HEADER

    //CARRITO
    //buscamos la data de los productos en el pedido
    let idProducts: number[] = [];
    let idPriceLists: number[] = [];

    for (let i = 0; i < this.orderServ.order.orderDetails.length; i++) {
      const detail = this.orderServ.order.orderDetails[i];
      idProducts.push(detail.idProduct);
      idPriceLists.push(detail.idPriceList);
    }
    if(this.orderServ.userCanSelectGlobalDiscount) {
      this.orderServ.dctoGlobal = this.orderServ.order.nuDiscount;
    }

    this.orderServ.getOrderUtilsbyIdProductAndPricelists(idProducts, idPriceLists).then(utils => {
      //procedemos a modificar los orderUtil con la data anterior y los agregamos al carrito
      if (utils.length < 1){
        console.error("No se consiguieron los productos del pedido");
        this.orderServ.disableSaveButton = true;
        this.orderServ.disableSendButton = true;
      }
      for (let i = 0; i < this.orderServ.order.orderDetails.length; i++) {
        const detail = this.orderServ.order.orderDetails[i];
        const item = utils.find((u) => u.idProduct == detail.idProduct)!;
        //console.log(detail);
        //console.log(item);
        if (item != undefined) {
          for (let j = 0; j < detail.orderDetailUnit.length; j++) {
            //Unidades con su monto
            const unit = detail.orderDetailUnit[j];
            var unitUtil = item.unitList.find((u) => u.idProductUnit == unit.idProductUnit)!;
            if (unitUtil != undefined) {
              unitUtil.quAmount = unit.quOrder;
              if (unitUtil.idUnit === item.idUnit) {
                item.quAmount = unitUtil.quAmount;
              }
            } else {
              console.error("No se consiguio Unit: " + unit.idProductUnit);
            }
          }
          //pricelist
          item.idPriceList = detail.idPriceList;
          //iva
          item.iva = detail.iva;
          //descuentos
          let dc = item.discountList.find((d) => d.idDiscount == detail.idDiscount)!;
          if (dc != undefined) {
            item.idDiscount = detail.idDiscount;
            item.quDiscount = dc.quDiscount;
          } else {
            if (detail.idDiscount != 0) { //es normal que no tenga descuentos
              console.error("No se consiguio Dcto: " + detail.idDiscount);
            }
          }
          //warehouse
          if (this.orderServ.validateWarehouses) {
            let wh = this.orderServ.listaWarehouse.find((w) => w.coWarehouse == detail.coWarehouse)!;
            if (wh != undefined) {
              item.idWarehouse = wh.idWarehouse;
              item.prevWarehouse = wh.idWarehouse;
              item.naWarehouse = wh.naWarehouse;
            } else {
              console.error("No se consiguio Warehouse: " + detail.coWarehouse);
            }
          }

          if (this.orderServ.pedidoModificable) {
            // se totalizara con los montos nuevos, asi que no se hace nada
          } else {
            //se usan los montos viejos, asi que hay que copiarlos
            item.nuPrice = detail.nuPriceBase;
            item.oppositeNuPrice = detail.nuPriceBaseConversion;
          }

          this.orderServ.alCarrito(item); //agregamos y totalizamos
        } else {
          console.error("No se consiguio producto: " + detail.idProduct);
        }
      }
    });
    //fin openOrder()
  }


  onTouchSegment() {
    if (this.lockSegments) {
      if (!this.hasClient) {
        //this.message.transaccionMsjModalNB(this.orderServ.getTag("PED_CHECK_CLIENTE"));
        this.clientRedLabel = true;
      } else {
        this.clientRedLabel = false;
        this.checkNuOrder();
      }
      if (this.direccionCliente) {
        this.addressRedLabel = false;
      } else {
        this.addressRedLabel = true;
      }
    } else {
      //console.log("segment unlocked");
    }
  }

  segmentLock() {
    //tiene cliente?
    let needsClient = this.orderServ.cliente.idClient == null;
    this.hasClient = !needsClient;
    this.clientRedLabel = needsClient;
    let needsNuOrder = true;
    //tiene direccion?
    let needsAddress = this.direccionCliente == null;
    this.addressRedLabel = needsAddress;

    //tiene numero de orden? (opcional)
    if (this.orderServ.validateNuOrder) {
      needsNuOrder = this.nuPurchase == null || this.nuPurchase.trim().length == 0;
    } else {
      needsNuOrder = false;
    }

    this.lockSegments = needsNuOrder || needsClient || needsAddress;
  }

  goBack() {
    if (this.orderServ.pedidoModificable && this.orderServ.changesMade && this.orderServ.hasItems()) {
      //this.location.back(); //CAMBIAR
      this.saveOrExitOpen = true;
    } else {
      this.location.back();
    }
  }

  saveButton() {
    if (this.orderServ.changesMade) {
      this.saveOrder(DELIVERY_STATUS_SAVED).then(s => {
        this.message.transaccionMsjModalNB(this.orderServ.getTag("PED_AVISO_GUARDADO")); //TAG THIS
        this.orderServ.disableSendButton = false;
      });

    }
  }

  confirmSend() {
    if (this.orderServ.cliente.idClient != null && this.orderServ.carrito.length > 0) {
      this.orderServ.disableSendButton = true;
      this.message.showLoading().then(() => {
        this.saveOrder(DELIVERY_STATUS_TO_SEND).then(order => {

        var transactions: PendingTransaction[] = [];
        var tr: PendingTransaction = new PendingTransaction(
          order.coOrder,
          order.idOrder,
          "order"
        );
        transactions.push(tr);

        if (this.orderServ.coClientStockAEnviar.length > 1) {
          //si venimos de inventario, enviamos el inventario tambien.
          transactions.push({
            coTransaction: this.orderServ.coClientStockAEnviar,
            idTransaction: this.orderServ.idClientStockAEnviar,
            type: "clientStock"
          })
        }
        this.services.insertPendingTransactionBatch(this.dbServ.getDatabase(), transactions).then(() => {
          this.autoSend.ngOnInit();
        });
        this.orderServ.disableSendButton = false;
        this.message.hideLoading();
        this.router.navigate(['pedidos']);
        });
      });
      
    }

  }

  async saveOrder(stOrder: number) {
    let order = this.makeOrder(stOrder);
    await this.orderServ.deleteOrder(this.orderServ.coOrder); //borramos el pedido si este existe para evitar conflictos en BD
    await this.orderServ.saveOrder(order);
    await this.adjuntoService.savePhotos(this.dbServ.getDatabase(), order.coOrder, 'pedidos'); //guardamos adjuntos
    this.orderServ.getListaPedidos(); //actualizamos lista de pedidos
    return order;
  }

  copyButton() {
    console.log("Copy Button");
    // let message = {
    //   header: "Pedido",
    //   message: "Pedido Copiado Exitosamente"
    // }
    let pedido = this.orderServ.copiarPedido(this.orderServ.order);
    this.orderServ.pedidoModificable = true;
    //this.orderServ.copiandoPedido = false;
    this.orderServ.abrirPedido(pedido);
    this.ngOnInit();
    // guardamos luego de abrir para que tenga todos los cambios
    this.saveOrder(DELIVERY_STATUS_SAVED).then(() => {
      this.message.transaccionMsjModalNB(this.orderServ.getTag("PED_AVISO_COPIADO"));
      this.orderServ.setChangesMade(true);
    });

  }

  sendButton() {
    console.log("Send Button");
    let buttonsConfirmSend = [
      {
        text: 'Cancelar',
        role: 'cancel',
        handler: () => {
          console.log('Alert canceled');


        },
      },
      {
        text: 'Aceptar',
        role: 'confirm',
        handler: () => {
          console.log('Alert confirmed');
          this.message.dismissAll();
          this.confirmSend();



        },
      },
    ];
    let message = {
      header: this.orderServ.getTag("PED_NOMBRE_MODULO"),
      message: this.orderServ.getTag("PED_PREGUNTA_GUARDADO")
    } as MessageAlert;

    this.message.alertCustomBtn(message, buttonsConfirmSend);

  }

  makeOrder(stOrder: number) {
    //toma la data del pedido y la transforma en un objeto Orders

    let cliente = this.orderServ.cliente;
    let empresa = this.orderServ.empresaSeleccionada;
    if (!this.orderServ.disableDaDispatch) {
      //si esta false siempre voy a buscar la fecha
      this.daDispatchChanged = true;
    }

    let orderDetails: OrderDetail[] = [];
    for (let i = 0; i < this.orderServ.carrito.length; i++) {
      const item = this.orderServ.carrito[i];
      let coOrderDetail = this.dateServ.generateCO(i);
      let tieneDescuento = (item.idDiscount != null && item.idDiscount > 0);

      let units: OrderDetailUnit[] = [];
      for (let j = 0; j < item.unitList.length; j++) {
        const unit = item.unitList[j];
        let u = new OrderDetailUnit(
          0,
          this.dateServ.generateCO((10 * i)) + 'U' + j.toString(),
          coOrderDetail,
          unit.coProductUnit,
          unit.idProductUnit,
          unit.quAmount,
          empresa.coEnterprise,
          empresa.idEnterprise,
          unit.coUnit,
          0,
        )


        units.push(u);

      }
      let discount: OrderDetailDiscount = {} as OrderDetailDiscount;
      if (tieneDescuento) {
        discount = new OrderDetailDiscount(
          0,
          this.dateServ.generateCO(i),
          coOrderDetail,
          0,
          item.idDiscount,
          item.quDiscount,
          item.discountedNuPrice,
          empresa.coEnterprise,
          empresa.idEnterprise
        )
      }

      let od = new OrderDetail(
        0,
        coOrderDetail,
        this.orderServ.coOrder,
        item.coProduct,
        item.naProduct,
        item.idProduct,
        item.nuPrice,
        item.nuPrice * item.quAmount,
        (this.orderServ.validateWarehouses ? item.coWarehouse : ''), //si validWH =  false, se manda 'vacio'
        (this.orderServ.validateWarehouses ? item.idWarehouse : 0),
        0,
        empresa.coEnterprise,
        empresa.idEnterprise,
        item.iva,
        tieneDescuento ? item.nuAmountDiscount : 0,
        tieneDescuento ? '' : '', //TODO Agregar coDiscount a Dicsount, ffs
        tieneDescuento ? item.idDiscount : 0,
        item.coPriceList,
        item.idPriceList,
        i,
        this.monedaSeleccionada.idCurrency === this.localCurrency.idCurrency ?
          this.currencyServ.toHardCurrency(item.nuPrice) : this.currencyServ.toLocalCurrency(item.nuPrice),
        this.monedaSeleccionada.idCurrency === this.localCurrency.idCurrency ?
          this.currencyServ.toHardCurrency(tieneDescuento ? item.nuAmountDiscount : 0) : this.currencyServ.toLocalCurrency(tieneDescuento ? item.nuAmountDiscount : 0),
        this.monedaSeleccionada.idCurrency === this.localCurrency.idCurrency ?
          this.currencyServ.toHardCurrency(item.nuPrice * item.quAmount) : this.currencyServ.toLocalCurrency(item.nuPrice * item.quAmount),
        units,
        [discount],

      );
      orderDetails.push(od);

    }

    let order = {
      idOrder: 0,
      coOrder: this.orderServ.coOrder,
      coClient: cliente.coClient,
      idClient: cliente.idClient,
      daOrder: this.dateServ.hoyISOFullTime(),
      daCreated: this.fechaPedido,
      naResponsible: this.cleanString(this.naResponsible),
      idUser: this.orderServ.getIdUser(),
      idOrderCreator: this.orderServ.getIdUser(),
      inOrderReview: this.inOrderReview,
      nuAmountTotal: this.orderServ.totalPedido,
      nuAmountFinal: this.orderServ.finalPedido,
      coCurrency: this.orderServ.monedaSeleccionada.coCurrency,
      daDispatch: this.daDispatchChanged ? this.fechaDespacho : null,
      txComment: this.cleanString(this.txComment),
      nuPurchase: this.cleanString(this.nuPurchase),
      coEnterprise: empresa.coEnterprise,
      coUser: this.orderServ.getCoUser(),
      coPaymentCondition: this.paymentCondition.coPaymentCondition,
      idPaymentCondition: this.paymentCondition.idPaymentCondition,
      idEnterprise: empresa.idEnterprise,
      coAddress: this.direccionCliente.coAddress,
      idAddress: this.direccionCliente.idAddress,
      nuAmountDiscount: this.orderServ.totalDctoXProducto + this.orderServ.totalGlobalDc,
      nuAmountTotalBase: this.orderServ.totalBase,
      stOrder: stOrder,
      coordenada: this.orderServ.coordenadas,
      nuDiscount: this.orderServ.dctoGlobal,
      idCurrency: this.monedaSeleccionada.idCurrency,
      idCurrencyConversion: this.currencyServ.getOppositeCurrency(this.monedaSeleccionada.coCurrency).idCurrency,
      nuValueLocal: this.currencyServ.localValue,
      nuAmountTotalConversion: this.orderServ.totalPedidoConv,
      nuAmountFinalConversion: this.orderServ.finalPedidoConv,
      procedencia: "Denario",
      nuAmountTotalBaseConversion: this.orderServ.totalBaseConv,
      nuAmountDiscountConversion: this.orderServ.totalDctoXProductoConv,
      idOrderType: this.tipoOrden.idOrderType,
      orderDetails: orderDetails,
      nuDetails: orderDetails.length,
      nuAmountTotalProductDiscount: this.orderServ.totalDctoXProducto,
      nuAmountTotalProductDiscountConversion: this.orderServ.totalDctoXProductoConv,
      hasAttachments: this.adjuntoService.hasItems(),
      nuAttachments: this.adjuntoService.getNuAttachment(),
      idDistributionChannel: this.orderServ.userCanSelectChannel ? this.distChannel.idChannel : null,
      coDistributionChannel: this.orderServ.userCanSelectChannel ? this.distChannel.coChannel : null,
    } as Orders

    console.log(order);
    return order;

  }
  onPricelistSelect() {
    this.orderServ.setChangesMade(true);
    if (this.orderServ.hasItems()) {
      //si el pedido ya tiene cosas, hay que resetear
      let buttonsRevertPricelist = [
        {
          text: this.orderServ.getTag("DENARIO_BOTON_CANCELAR"),
          role: 'cancel',
          handler: () => {
            console.log('Alert canceled');
            this.orderServ.setChangesMade(false);
            this.orderServ.listaSeleccionada = this.listaAnterior;
          },
        },
        {
          text: this.orderServ.getTag("DENARIO_BOTON_ACEPTAR"),
          role: 'confirm',
          handler: () => {
            console.log('Alert confirmed');
            let pricelist = this.orderServ.listaSeleccionada;
            this.reset();
            this.orderServ.listaSeleccionada = pricelist;
            this.listaAnterior = pricelist;
            this.orderServ.listaPriceListFiltrada = this.orderServ.listaPricelist.filter((pl) => pl.idList == pricelist?.idList)
          }
        }
      ]

      this.message.alertCustomBtn({
        header: this.orderServ.getTag('PED_NOMBRE_MODULO'),
        message: this.orderServ.getTag('PED_RESET_PRICELIST')
      } as MessageAlert,
        buttonsRevertPricelist);
    } else {
      //si no hay productos no hay peo, consolidamos el cambio.
      this.listaAnterior = this.orderServ.listaSeleccionada;
      this.orderServ.listaPriceListFiltrada = this.orderServ.listaPricelist.filter((pl) => pl.idList == this.orderServ.listaSeleccionada?.idList)
      this.orderServ.setChangesMade(true);

    }
  }

  disableCurrencySelector() {
    if (!this.multimoneda) {
      return true;
    }
    if (this.viewOnly) {
      return true;
    }
    if (!this.orderServ.multiCurrencyOrder) {
      return true;
    }
    if (this.orderServ.openOrder) {
      return true;
    }
    return false;
  }
  onCurrencySelect() {
    this.multimoneda = false;
    this.changeDetector.detectChanges();
    // ^^ hack estupido para que se actualice correctamente el selector
    console.log("cambiada moneda");
    this.orderServ.setChangesMade(true);
    if (this.orderServ.hasItems()) {
      //si el pedido ya tiene cosas, hay que resetear
      let buttonsRevertCurrency = [
        {
          text: this.orderServ.getTag("DENARIO_BOTON_CANCELAR"),
          role: 'cancel',
          handler: () => {
            console.log('Alert canceled');
            this.orderServ.setChangesMade(false);
            /*this.orderServ.monedaSeleccionada =
               this.currencyServ.getOppositeCurrency(this.orderServ.monedaSeleccionada.coCurrency);*/
          },
        },
        {
          text: this.orderServ.getTag("DENARIO_BOTON_ACEPTAR"),
          role: 'confirm',
          handler: () => {
            console.log('Alert confirmed');
            let moneda = this.monedaSeleccionada;
            this.reset();
            this.orderServ.monedaSeleccionada = moneda;
            this.monedaSeleccionada = moneda;


          },
        },
      ];


      this.message.alertCustomBtn({
        header: this.orderServ.getTag("PED_NOMBRE_MODULO"),
        message: this.orderServ.getTag("PED_RESET_MONEDA")
      } as MessageAlert, buttonsRevertCurrency);
    } else {
      let pricelists = this.orderServ.listaPriceListFiltrada.filter(
        (pl) => pl.idCurrency == this.monedaSeleccionada.idCurrency
      );

      if (!this.orderServ.conversionByPriceList || pricelists.length > 0) {
        //no hay peo, hacemos el cambio;
        this.orderServ.monedaSeleccionada = this.monedaSeleccionada;

      } else {
        this.message.transaccionMsjModalNB(this.orderServ.getTag("PED_ERROR_PRICELIST"));
        this.monedaSeleccionada = this.orderServ.monedaSeleccionada;
        //window.dispatchEvent(new Event('resize'));



      }

    }
    this.productService.onProductStructureCLicked();
    this.multimoneda = true;
    this.changeDetector.detectChanges();
    // ^^ hack estupido para que se actualice correctamente el selector, parte 2

  }

  monedaOpuesta() {
    return this.currencyServ.oppositeCoCurrency(this.orderServ.monedaSeleccionada.coCurrency);
  }

  onChange() {
    this.orderServ.setChangesMade(true);
  }

  onAddressChange() {
    this.addressRedLabel = (this.direccionCliente == null);
    if (this.orderServ.checkAddressClient &&
      (this.direccionCliente.idAddress != this.direccionAnterior.idAddress)) {
      //[checkAddressClient] mensaje de cambio de cliente
      this.message.alertCustomBtn(
        {
          header: this.orderServ.getTag('DENARIO_HEADER_ALERTA'),
          message: this.orderServ.getTag("DENARIO_CAMBIO_DIRECCION")
        },
        [
          {
            text: this.orderServ.getTag('DENARIO_BOTON_CANCELAR'),
            role: 'cancel',
            handler: () => {
              //console.log('Alert canceled');
              this.direccionCliente = this.direccionAnterior;
            },
          },
          {
            text: this.orderServ.getTag('DENARIO_BOTON_ACEPTAR'),
            role: 'confirm',
            handler: () => {
              this.direccionAnterior = this.direccionCliente;
              this.onChange();

            },
          }
        ]
      )
    }
    this.segmentLock();
    this.onChange();
  }

  onOrderTypeChange() {
    if (this.orderServ.userCanSelectChannel) {
      //se muestra mensaje de advertencia ya que es posible necesitar reset
      let buttonsRevertOrderType = [
        {
          text: this.orderServ.getTag("DENARIO_BOTON_CANCELAR"),
          role: 'cancel',
          handler: () => {
            console.log('Alert canceled');
            this.orderServ.setChangesMade(false);
            this.tipoOrden = this.tipoOrdenAnterior;

          },
        },
        {
          text: this.orderServ.getTag("DENARIO_BOTON_ACEPTAR"),
          role: 'confirm',
          handler: () => {
            console.log('Alert confirmed');
            let empresa = this.orderServ.empresaSeleccionada;
            let cliente = this.orderServ.cliente;
            this.orderServ.tipoOrden = this.tipoOrden;
            this.reset();
            this.orderServ.empresaSeleccionada = empresa;
            this.onEnterpriseSelect();
            //this.orderServ.cliente = cliente;
            this.setClientfromSelector(cliente);
            this.tipoOrden = this.orderServ.tipoOrden;
            this.tipoOrdenAnterior = this.tipoOrden;
          }
        }
      ]

      this.message.alertCustomBtn({
        header: this.orderServ.getTag("PED_NOMBRE_MODULO"),
        message: this.orderServ.getTag("PED_RESET_ORDERTYPE")
      } as MessageAlert,
        buttonsRevertOrderType);


    } else {
      //no se hace nada, solo el onchange() 
    }
    this.onChange();
  }

  onGlobalDiscountChange() {
    this.onChange();
    this.orderServ.productSummary();
  }

  onGlobalDiscountCancel() {
    this.orderServ.dctoGlobal = 0;
    this.onGlobalDiscountChange();
  }
  onNuOrderChange() {
    //this.nuPurchase = e.detail.value;
    this.segmentLock();
    this.checkNuOrder();
    this.onChange();
  }
  onNuOrderInput() {
    const clean = this.cleanString(this.nuPurchase)
    if (this.nuPurchase !== clean) {
      this.nuPurchase = clean;
      if (this.nuPurchaseInput && this.nuPurchaseInput.value !== clean) {
        this.nuPurchaseInput.value = clean;
      }
    }
  }

  onNaResponsibleInput() {
    const clean = this.cleanString(this.naResponsible);
    if (this.naResponsible !== clean) {
      this.naResponsible = clean;
      if (this.naResponsibleInput && this.naResponsibleInput.value !== clean) {
        this.naResponsibleInput.value = clean;
      }
    }
  }

  onTxCommentInput() {
    const clean = this.cleanString(this.txComment);
    if (this.txComment !== clean) {
      this.txComment = clean;
      if (this.txCommentInput && this.txCommentInput.value !== clean) {
        this.txCommentInput.value = clean;
      }
    }
  }

  checkNuOrder() {
    if (this.orderServ.validateNuOrder) {
      if (this.nuPurchase.trim().length > 0) {
        //todo fine
        this.nuOrderRedLabel = false;
      } else {
        //this.message.transaccionMsjModalNB(this.orderServ.getTag("PED_CHECK_ORDER#"));
        this.nuOrderRedLabel = true; //mostramos "campo obligatorio" bajo el input
        this.nuPurchaseInput.setFocus();
      }
    }
  }
  onEnterpriseSelect() {
    if (this.orderServ.carrito.length > 0 || this.adjuntoService.hasItems() || this.orderServ.cliente.idClient) {
      // el pedido tiene cosas, asi que hay que resetear
      let buttonsRevertEnterprise = [
        {
          text: this.orderServ.getTag("DENARIO_BOTON_CANCELAR"),
          role: 'cancel',
          handler: () => {
            console.log('Alert canceled');
            this.orderServ.setChangesMade(false);
            this.empresaSeleccionada = this.orderServ.empresaSeleccionada

          },
        },
        {
          text: this.orderServ.getTag("DENARIO_BOTON_ACEPTAR"),
          role: 'confirm',
          handler: () => {
            console.log('Alert confirmed');
            let empresa = this.empresaSeleccionada;
            this.reset();
            this.orderServ.cliente = { lbClient: this.orderServ.getTag("PED_PLACEHOLDER_CLIENTE") } as Client;
            this.hasClient = false;
            this.clientRedLabel = true;
            this.empresaSeleccionada = empresa;
            this.onEnterpriseSelect();



          },
        },
      ];

      this.message.alertCustomBtn({
        header: this.orderServ.getTag("PED_NOMBRE_MODULO"),
        message: this.orderServ.getTag("PED_RESET_EMPRESA")
      } as MessageAlert, buttonsRevertEnterprise);

    } else {
      this.orderServ.empresaSeleccionada = this.empresaSeleccionada;
      this.orderServ.setup();

      //Cliente
      this.orderServ.cliente = { lbClient: this.orderServ.getTag("PED_PLACEHOLDER_CLIENTE") } as Client;
      this.selectorCliente.updateClientList(this.empresaSeleccionada.idEnterprise);

      //OrderType
      if (this.orderServ.orderTypeByEnterprise) {
        this.selectOrderTypebyEnterprise()
      }

    }

  }

  selectOrderTypebyEnterprise() {

    if (this.tipoOrden == undefined) {
      this.tipoOrden = this.listaOrderTypes[0];
    }

    this.tipoOrdenAnterior = this.tipoOrden;
    this.orderServ.tipoOrden = this.tipoOrden;



  }

  listCompare(a: List, b: List) {
    return a && b ? a.idList === b.idList : a === b;
  }

  payCondCompare(a: PaymentCondition, b: PaymentCondition) {
    return a && b ? a.idPaymentCondition === b.idPaymentCondition : a === b;
  }

  currencyCompare(a: CurrencyEnterprise, b: CurrencyEnterprise) {
    return a && b ? a.idCurrency === b.idCurrency : a === b;
  }

  setClientfromSelector(cliente: Client) {
    if (cliente) {
      this.orderServ.cliente = cliente;
      this.segmentLock();
      if (this.orderServ.carrito.length > 0 || this.adjuntoService.hasItems()) {
        //si pedido tiene elementos o adjuntos, ya no le permitimos cambiar;
        this.clienteSelectorService.checkClient = true;
      }



      //distribution channel y order type (userCanSelectChannel)
      if (this.orderServ.userCanSelectChannel) {
        this.orderServ.getClientChannelOrderTypes(cliente.idClient).then(data => {
          this.orderServ.clientChannelOrderTypes = data;
          //filtramos dist channel y order type por cliente
          this.listaDistributionChannel = this.orderServ.distributionChannels.filter((d) => data.find((c) => c.idDistributionChannel == d.idChannel));
          this.distChannel = this.listaDistributionChannel[0];
          this.listaOrderTypes = this.orderServ.listaOrderTypes.filter((o) => data.find((c) => c.idOrderType == o.idOrderType));
          if (this.orderServ.orderTypeByEnterprise && !this.orderServ.openOrder) {
            this.selectOrderTypebyEnterprise();
          } else {
            if (this.orderServ.openOrder) {
              this.tipoOrden = this.listaOrderTypes.find((o) => o.idOrderType == this.orderServ.order.idOrderType)!;
            } else {
              this.tipoOrden = this.listaOrderTypes[0];
            }
            this.tipoOrdenAnterior = this.tipoOrden;
            this.orderServ.tipoOrden = this.tipoOrden;
          }

        })
      } else {
        this.listaOrderTypes = this.orderServ.listaOrderTypes;
        if (this.orderServ.orderTypeByEnterprise) {
          this.selectOrderTypebyEnterprise();
        } else {
          if (this.orderServ.openOrder) {
            this.tipoOrden = this.listaOrderTypes.find((o) => o.idOrderType == this.orderServ.order.idOrderType)!;
          } else {
            this.tipoOrden = this.listaOrderTypes[0];
          }
          this.tipoOrdenAnterior = this.tipoOrden;
          this.orderServ.tipoOrden = this.tipoOrden; //para filtrar structures luego
        }
      }


      // Lista
      let list = this.orderServ.listaList.find((list) => list.idList == cliente.idList);
      if (list != undefined) {
        this.orderServ.listaSeleccionada = list;
        this.listaAnterior = list;
        this.orderServ.listaPriceListFiltrada = this.orderServ.listaPricelist.filter((pl) => pl.idList == list?.idList)
      }


      //Payment Condition

      let idPaymentCondition: number;
      if (this.orderServ.openOrder) {
        if (this.orderServ.order && this.orderServ.order.idPaymentCondition) {
          idPaymentCondition = this.orderServ.order.idPaymentCondition;
        } else {
          idPaymentCondition = cliente.idPaymentCondition;
        }
      } else {
        idPaymentCondition = cliente.idPaymentCondition;
      }

      let payCond = this.orderServ.listaPaymentCondition.find((pc) => pc.idPaymentCondition == idPaymentCondition)
      if (payCond != undefined) {
        this.paymentCondition = payCond;
      }

      // Address Client
      let idAddressClients: number;
      if (this.orderServ.openOrder) {

        if (this.orderServ.order && this.orderServ.order.idAddress) {
          idAddressClients = this.orderServ.order.idAddress;
        } else {
          idAddressClients = 0;
        }

      } else {
        idAddressClients = 0;
      }
      this.message.showLoading().then(() => {
        this.orderServ.getAddressClient(cliente.idClient).then(data => {
        this.listaDirecciones = data;

        if(idAddressClients > 0){
        let dir = data.find((dir) => dir.idAddress == idAddressClients);
        if (dir != undefined) {
          this.direccionCliente = dir;

        } else {
          this.direccionCliente = data[0];
        }
        }else{
          this.direccionCliente = data[0];
        }
        this.direccionAnterior = this.direccionCliente;
        this.segmentLock();
        this.message.hideLoading();
      });
       });

      //[multiCurrencyOrder] cambio de moneda
      if (this.orderServ.multiCurrencyOrder && !this.orderServ.openOrder) {
        this.monedaSeleccionada = this.currencyServ.getCurrency(cliente.coCurrency);
        this.onCurrencySelect();
      }

      //saldos si es pedido guardado/enviado
      if (this.orderServ.openOrder) {
        if (this.currencyServ.multimoneda) {
          let saldoCliente = 0, saldoOpuesto = 0;
          if (cliente.coCurrency == this.localCurrency.coCurrency) {
            saldoCliente = cliente.saldo1 + this.currencyServ.toLocalCurrency(cliente.saldo2);
            saldoOpuesto = this.currencyServ.toHardCurrency(saldoCliente);
          } else {
            saldoCliente = cliente.saldo1 + this.currencyServ.toHardCurrency(cliente.saldo2);
            saldoOpuesto = this.currencyServ.toLocalCurrency(saldoCliente);
          }
          cliente.saldo1 = saldoCliente;
          cliente.saldo2 = saldoOpuesto;
        }
        this.orderServ.cliente = cliente;


      }

    }
    else {
      console.log("cliente vacio");
    }
  }

  //MODAL DE INFO DE CLIENTE
  modalInfoCliente(open: boolean) {
    this.modalInfoClienteOpen = open;
  }

  setsaveOrExitOpen(open: boolean) {
    this.saveOrExitOpen = open;
  }

  getDefaultList() {
    let list = this.orderServ.listaList.find((l) => l.idList == this.orderServ.cliente.idList)?.naList;

    if (list == undefined) {
      return '';
    } else {
      return list;
    }

  }

  formatNum(input: number) {
    return this.currencyServ.formatNumber(input);
  }

  onDateDispatchChange() {
    if (this.dateServ.compareDates(this.fechaMinima, this.fechaDespacho)) {
      this.onChange();
      this.daDispatchChanged = true;
    } else {
      this.fechaDespacho = this.dateServ.futureDaysISO(3);
    }
    this.openDaDispatchModal = false;
  }

  onDateDispatchCancel() {
    this.daDispatchChanged = false;
    this.openDaDispatchModal = false;
  }

  setOpenDaDispatchModal(open: boolean) {
    this.openDaDispatchModal = open;
  }

  buttonsSalvar = [
    {
      text: this.orderServ.getTag('DENARIO_BOTON_SALIR_GUARDAR'),
      role: 'save',
      handler: () => {
        console.log('save and exit');
        this.saveOrder(DELIVERY_STATUS_SAVED);
        this.router.navigate(['pedidos']);

      },
    },
    {
      text: this.orderServ.getTag('DENARIO_BOTON_SALIR'),
      role: 'exit',
      handler: () => {
        console.log('exit w/o save');
        this.router.navigate(['pedidos']);
      },
    },
    {
      text: this.orderServ.getTag('DENARIO_BOTON_CANCELAR'),
      role: 'cancel',
      handler: () => {
        console.log('exit canceled');
        this.setsaveOrExitOpen(false);

      },
    },
  ];


  cleanString(str: string): string {
    // Elimina ;
    str = str.replace(/;/g, '');
    // Elimina comillas simples
    str = str.replace(/'/g, '');
    // Elimina comillas dobles
    str = str.replace(/"/g, '');


    return str;
  }
createEmptyOrder(): Orders {
    const empresa = this.orderServ.empresaSeleccionada ?? this.enterpriseServ.defaultEnterprise();
    const moneda = this.orderServ.monedaSeleccionada ?? this.currencyServ.getLocalCurrency();

    return {
      idOrder: 0,
      coOrder: this.dateServ.generateCO(0),
      coClient: '',
      idClient: 0,
      daOrder: this.dateServ.hoyISOFullTime(),
      daCreated: this.dateServ.hoyISOFullTime(),
      naResponsible: '',
      idUser: this.orderServ.getIdUser(),
      idOrderCreator: this.orderServ.getIdUser(),
      inOrderReview: false,
      nuAmountTotal: 0,
      nuAmountFinal: 0,
      coCurrency: moneda.coCurrency,
      daDispatch: null,
      txComment: '',
      nuPurchase: '',
      coEnterprise: empresa.coEnterprise,
      coUser: this.orderServ.getCoUser(),
      coPaymentCondition: '',
      idPaymentCondition: 0,
      idEnterprise: empresa.idEnterprise,
      coAddress: '',
      idAddress: 0,
      nuAmountDiscount: 0,
      nuAmountTotalBase: 0,
      stOrder: DELIVERY_STATUS_NEW,
      coordenada: this.orderServ.coordenadas ?? '',
      nuDiscount: 0,
      idCurrency: moneda.idCurrency,
      idCurrencyConversion: this.currencyServ.getOppositeCurrency(moneda.coCurrency).idCurrency,
      nuValueLocal: this.currencyServ.localValue,
      nuAmountTotalConversion: 0,
      nuAmountFinalConversion: 0,
      procedencia: "Denario",
      nuAmountTotalBaseConversion: 0,
      nuAmountDiscountConversion: 0,
      idOrderType: this.tipoOrden?.idOrderType ?? 0,
      orderDetails: [],
      nuDetails: 0,
      nuAmountTotalProductDiscount: 0,
      nuAmountTotalProductDiscountConversion: 0,
      hasAttachments: false,
      nuAttachments: 0,
      idDistributionChannel: null,
      coDistributionChannel: null,
    } as Orders;
  }
  getNaPaymentCondition(coPaymentCondition: string) {
    let payCond = this.orderServ.listaPaymentCondition.find((pc) => pc.coPaymentCondition == coPaymentCondition);

    if (payCond) {
      return payCond.naPaymentCondition;
    } else {
      return '';
    }
  }
}
