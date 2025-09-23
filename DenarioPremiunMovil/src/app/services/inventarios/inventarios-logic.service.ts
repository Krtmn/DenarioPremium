import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

import { Client } from 'src/app/modelos/tables/client';
import { ClientStocks, ClientStocksDetail, ClientStocksDetailUnits } from 'src/app/modelos/tables/client-stocks';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { ServicesService } from '../services.service';
import { DateServiceService } from '../dates/date-service.service';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { AddresClient } from 'src/app/modelos/tables/addresClient';
import { ClientStockTotal } from 'src/app/modelos/client-stock-total';
import { Inventarios } from 'src/app/modelos/inventarios';
import { TiposPago } from 'src/app/modelos/tipos-pago';
import { DELIVERY_STATUS_SAVED, DELIVERY_STATUS_SENT, DELIVERY_STATUS_TO_SEND, VISIT_STATUS_TO_SEND, VISIT_STATUS_VISITED } from 'src/app/utils/appConstants'
import { ImageServicesService } from '../imageServices/image-services.service';
import { Unit } from 'src/app/modelos/tables/unit';
import { ProductUtil } from 'src/app/modelos/ProductUtil';
import { ProductStructureService } from '../productStructures/product-structure.service';
import { GlobalConfigService } from '../globalConfig/global-config.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { ItemListaInventarios } from 'src/app/inventarios/item-lista-inventarios';
import { HistoryTransaction } from '../historyTransaction/historyTransaction';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite';


@Injectable({
  providedIn: 'root'
})
export class InventariosLogicService {
  public services = inject(ServicesService);
  public dateServ = inject(DateServiceService);
  public router = inject(Router);
  public productStructureService = inject(ProductStructureService);
  public globalConfig = inject(GlobalConfigService);
  public adjuntoService = inject(AdjuntoService);
  public historyTransaction = inject(HistoryTransaction);


  public initInventario: Boolean = true;
  public backRoute = new Subject<string>;
  public inventarioComp: Boolean = false;
  public inventarioList: Boolean = false;
  public containerComp: Boolean = true;
  public typeStocksComponent: Boolean = false;
  public showButtons = new Subject<Boolean>;
  public newClientStock: ClientStocks = {} as ClientStocks;
  public stockValid = new Subject<Boolean>;
  public stockValidToSave = new Subject<Boolean>;
  public stockValidToSend = new Subject<Boolean>;
  public hideTab: Boolean = true;
  public subs: any;
  public nombreCliente: string = "";
  public clientStockValid: Boolean = false;
  public selectedClient: Boolean = false;
  public listaEmpresa: Enterprise[] = [];
  public empresaSeleccionada!: Enterprise;
  public showHeaderButtons: Boolean = false;
  public disableSaveButton: Boolean = true;
  public cannotSendClientStock: Boolean = true;
  public alertMessageOpen: Boolean = false;
  public alertMessage: Boolean = false;
  public disabledEnterprise: boolean = false;
  public userMustActivateGPS: boolean = false;


  public enterpriseClientStock: Enterprise = {} as Enterprise;
  public clientClientStock: Client = {} as Client;
  public client!: Client;


  public inventarioTags = new Map<string, string>([]);
  public inventarioTagsDenario = new Map<string, string>([]);

  public addressClient: AddresClient[] = [];
  public clientStocksTotal: ClientStockTotal[] = [];
  public inventarios: Inventarios[] = [];
  public itemListClientStocks: ItemListaInventarios[] = [];
  public productSelected!: ProductUtil;
  public productSelectedIndex!: number;
  /* public variables = new Map<number, Inventarios[]>([]); */
  public productTypeStocksMap = new Map<number, number>();
  public tiposPago: TiposPago[] = [];
  public typeStocks: Inventarios[] = [];
  public cliente = {} as Client;
  public typeExh: Boolean = false;
  public typeDep: Boolean = false;
  public productUnitList!: Unit[];
  public unitSelected!: Unit;
  public inventarioSent: Boolean = false;
  public showProductList: Boolean = false;
  public isEdit: Boolean = false;

  public message!: string;

  constructor() {

  }

  showHeaderButtonsFunction(headerButtos: Boolean) {
    this.showButtons.next(headerButtos);
  }

  onStockValidToSave(valid: Boolean) {
    console.log('returnLogicService: onReturnValid');
    this.stockValidToSave.next(valid);
  }

  onStockValidToSend(validToSend: Boolean) {
    console.log('returnLogicService: onReturnValidToSend');
    this.stockValidToSend.next(validToSend);
  }

  onClientStockValid(valid: Boolean) {
    console.log('clientStockService: onClientStockValid');
    this.stockValid.next(valid);
  }


  getTags(dbServ: SQLiteObject) {
    return this.services.getTags(dbServ, "INV", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.inventarioTags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      if (this.tiposPago.length == 0) {
        this.tiposPago.push({
          type: this.inventarioTags.get('INV_EXH_TYPE')!,
          name: this.inventarioTags.get('INV_EXH_NAME')!,
          selected: false,
        });
        this.tiposPago.push({
          type: this.inventarioTags.get('INV_DEP_TYPE')!,
          name: this.inventarioTags.get('INV_DEP_NAME')!,
          selected: false,
        });
      }
      return Promise.resolve(true);
    })
  }

  getTagsDenario(dbServ: SQLiteObject) {
    return this.services.getTags(dbServ, "DEN", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.inventarioTagsDenario.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      return Promise.resolve(true);
    })
  }

  initClientStockDetails() {
    this.initInventario = true;
    this.selectedClient = false;
    this.inventarioSent = false;
    this.disableSaveButton = true;
    this.cannotSendClientStock = true;
    this.newClientStock = {} as ClientStocks;
    this.newClientStock.clientStockDetails = [] as ClientStocksDetail[];
    /* this.tiposPago = [] as TiposPago[]; */
    /* this.typeStocks = [] as Inventarios[]; */
    /* this.variables = new Map<number, Inventarios[]>(); */
    this.newClientStock.productList = [] as ProductUtil[];
    this.productTypeStocksMap = new Map<number, number>();
    this.typeStocks = [] as Inventarios[];
    this.disabledEnterprise = this.globalConfig.get('enterpriseEnabled') === 'true' ? false : true;
  }

  showBackRoute(route: string) {
    console.log('clientStockService: showBackRoute');
    this.backRoute.next(route);
  }

  getAllAddressByClient(dbServ: SQLiteObject, idClient: number, idEnterprise: number) {
    let selectStatement = 'SELECT * FROM address_clients WHERE id_client = ? AND id_enterprise = ?';
    var database = dbServ;
    let addressClient: AddresClient[] = [];
    return database.executeSql(selectStatement, [idClient, idEnterprise]).then(result => {
      if (result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          addressClient.push({
            idAddress: result.rows.item(i).id_address,
            coAddress: result.rows.item(i).co_address,
            naAddress: result.rows.item(i).na_address,
            idClient: result.rows.item(i).id_client,
            idAddressType: result.rows.item(i).id_address_type,
            coAddressType: result.rows.item(i).co_address_type,
            txAddress: result.rows.item(i).tx_address,
            nuPhone: result.rows.item(i).nu_phone,
            naResponsible: result.rows.item(i).na_responsible,
            coEnterpriseStructure: result.rows.item(i).co_enterprise_structure,
            idEnterpriseStructure: result.rows.item(i).id_enterprise_structure,
            coClient: result.rows.item(i).co_client,
            coEnterprise: result.rows.item(i).co_enterprise,
            idEnterprise: result.rows.item(i).id_enterprise,
            coordenada: result.rows.item(i).coordenada,
            editable: result.rows.item(i).editable,
          });
        }
        this.addressClient = addressClient;
        this.newClientStock.idAddressClient = addressClient[0].idAddress;
        this.newClientStock.coAddressClient = addressClient[0].coAddress;
        return true;
      } else
        return false;
    }).catch(e => {
      this.addressClient = [];
      console.log("[ClientStockLogicService] Error al cargar Sucursales.");
      console.log(e);
      return false;
    })
  };

  clientStocksTotalization() {
    this.clientStocksTotal = [] as ClientStockTotal[]
    for (var i = 0; i < this.newClientStock.clientStockDetails.length; i++) {
      for (var j = 0; j < this.newClientStock.clientStockDetails[i].clientStockDetailUnits.length; j++) {
        let clientStockTotal = new ClientStockTotal;

        clientStockTotal.idProduct = this.newClientStock.clientStockDetails[i].idEnterprise;
        clientStockTotal.coEnterprise = this.newClientStock.clientStockDetails[i].coEnterprise;
        clientStockTotal.idProduct = this.newClientStock.clientStockDetails[i].idProduct;
        clientStockTotal.coProduct = this.newClientStock.clientStockDetails[i].coProduct;
        clientStockTotal.naProduct = this.newClientStock.clientStockDetails[i].naProduct;
        clientStockTotal.naUnit = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[0].naUnit;
        clientStockTotal.idUnit = 0;
        clientStockTotal.coUnit = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[0].coUnit;
        clientStockTotal.totalUnits += this.newClientStock.clientStockDetails[i].clientStockDetailUnits[0].quStock;
        clientStockTotal.ubicacion = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[0].ubicacion;
        if (clientStockTotal.ubicacion = "Exhibicion") {
          clientStockTotal.totalExh += this.newClientStock.clientStockDetails[i].clientStockDetailUnits[0].quStock;
        } else {
          clientStockTotal.totalDep += this.newClientStock.clientStockDetails[i].clientStockDetailUnits[0].quStock;
        }

        this.clientStocksTotal.push(clientStockTotal)

      }
    }

    return this.clientStocksTotal
  }

  setVariablesMap() {
    for (var i = 0; i < this.newClientStock.clientStockDetails.length; i++) {
      this.productTypeStocksMap.set(this.newClientStock.clientStockDetails[i].idProduct, i);
      for (var j = 0; j < this.newClientStock.clientStockDetails[i].clientStockDetailUnits.length; j++) {
        switch (this.newClientStock.clientStockDetails[i].clientStockDetailUnits[j].ubicacion) {
          case "exh": {
            let newTypeStock: Inventarios = {} as Inventarios;
            newTypeStock.tipo = "exh";
            newTypeStock.idProduct = this.newClientStock.clientStockDetails[i].idProduct;
            //newTypeStock.fechaVencimiento = this.dateServ.hoyISO();;
            newTypeStock.cantidad = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[j].quStock;
            newTypeStock.lote = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[j].nuBatch;
            newTypeStock.fechaVencimiento = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[j].daExpiration;
            newTypeStock.unidad = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[j].naUnit;
            newTypeStock.validateCantidad = true;
            newTypeStock.validateLote = true;
            newTypeStock.clientStockDetail = [] as ClientStocksDetail[]
            newTypeStock.clientStockDetail.push(this.newClientStock.clientStockDetails[i]);
            newTypeStock.showDateModalExh = false;
            newTypeStock.showDateModalDep = false;
            this.typeStocks.push(newTypeStock);
            this.typeExh = true;
            break;
          }
          case "dep": {
            let newTypeStock: Inventarios = {} as Inventarios;
            newTypeStock.tipo = "dep";
            newTypeStock.idProduct = this.newClientStock.clientStockDetails[i].idProduct;
            //newTypeStock.fechaVencimiento = this.dateServ.hoyISO();;
            newTypeStock.cantidad = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[j].quStock;
            newTypeStock.lote = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[j].nuBatch;
            newTypeStock.fechaVencimiento = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[j].daExpiration;
            newTypeStock.unidad = this.newClientStock.clientStockDetails[i].clientStockDetailUnits[j].naUnit;
            newTypeStock.validateCantidad = true;
            newTypeStock.validateLote = true;
            newTypeStock.clientStockDetail = [] as ClientStocksDetail[];
            newTypeStock.clientStockDetail.push(this.newClientStock.clientStockDetails[i]);
            newTypeStock.showDateModalExh = false;
            newTypeStock.showDateModalDep = false;
            this.typeStocks.push(newTypeStock);
            this.typeDep = true;
            break;
          }
        }
      }

    }
  }

  setClientStockObject(i: number, j: number, type: string) {
    let idProduct = this.newClientStock.clientStockDetails[i].idProduct;

    for (var k = 0; k < this.newClientStock.productList.length; k++) {
      if (this.newClientStock.productList[k].idProduct == idProduct) {
        this.newClientStock.productList[k].typeStocks = [] as Inventarios[];
        let inventario = {} as Inventarios;
        inventario.validateCantidad = true;
        inventario.validateLote = false;
        inventario.idProduct = idProduct;
        inventario.indexDetail = j;
        inventario.indexDetailUnit = i;
        inventario.tipo = type;
        inventario.unidad = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].naUnit;
        inventario.idProductList = j;
        inventario.fechaVencimiento = this.dateServ.hoyISO();
        inventario.cantidad = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].quStock;
        inventario.lote = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].nuBatch;

        this.newClientStock.productList[k].typeStocks?.push(inventario);

        if (inventario.tipo == "exh") {
          this.typeExh = true;
        } else {
          this.typeDep = true;
        }

        this.newClientStock.productList[k].typeStocks![j].clientStockDetail = [] as ClientStocksDetail[];
        let clientStockDetail = {} as ClientStocksDetail;

        clientStockDetail.idClientStockDetail = 0;
        if (this.typeStocks.length == 1) {
          /* clientStockDetail.coClientStockDetail = this.dateServ.generateCO(0); */
          clientStockDetail.coClientStockDetail = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].coClientStockDetail;
        } else {
          clientStockDetail.coClientStockDetail = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].coClientStockDetail;
        }

        clientStockDetail.coClientStock = this.newClientStock.coClientStock;
        clientStockDetail.idProduct = this.newClientStock.clientStockDetails[k].idProduct;
        clientStockDetail.coProduct = this.newClientStock.clientStockDetails[k].coProduct;
        clientStockDetail.naProduct = this.newClientStock.clientStockDetails[k].naProduct;
        clientStockDetail.coEnterprise = this.newClientStock.coEnterprise;
        clientStockDetail.idEnterprise = this.newClientStock.idEnterprise;
        clientStockDetail.posicion = 0;
        clientStockDetail.isEdit = true;
        clientStockDetail.isSave = true;

        let lengthTypeStocks = this.newClientStock.productList[k].typeStocks?.length! - 1

        this.newClientStock.productList[k].typeStocks![lengthTypeStocks].clientStockDetail.push(clientStockDetail);
        let length = this.newClientStock.productList[k].typeStocks![lengthTypeStocks].clientStockDetail.length - 1;

        this.newClientStock.productList[k].typeStocks![lengthTypeStocks].clientStockDetail[length].clientStockDetailUnits = [] as ClientStocksDetailUnits[];
        let clientStockDetailUnits = {} as ClientStocksDetailUnits;

        clientStockDetailUnits.idClientStockDetailUnit = 0;
        clientStockDetailUnits.coClientStockDetailUnit = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].coClientStockDetailUnit
        clientStockDetailUnits.coClientStockDetail = clientStockDetail.coClientStockDetail
        clientStockDetailUnits.idProductUnit = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].idProductUnit
        clientStockDetailUnits.coProductUnit = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].coProductUnit
        clientStockDetailUnits.idUnit = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].idUnit
        clientStockDetailUnits.coUnit = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].coUnit
        clientStockDetailUnits.quUnit = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].quUnit
        clientStockDetailUnits.naUnit = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].naUnit
        clientStockDetailUnits.quStock = this.newClientStock.clientStockDetails[k].clientStockDetailUnits[j].quStock;
        clientStockDetailUnits.quSuggested = 0;
        clientStockDetailUnits.coEnterprise = this.newClientStock.coEnterprise;
        clientStockDetailUnits.idEnterprise = this.newClientStock.idEnterprise;
        clientStockDetailUnits.ubicacion = type;
        clientStockDetailUnits.isEdit = true
        clientStockDetailUnits.isSave = true;
        clientStockDetailUnits.posicion = 0;
        clientStockDetailUnits.nuBatch = "";
        clientStockDetailUnits.daExpiration = this.newClientStock.productList[k].typeStocks![j].fechaVencimiento;
        this.newClientStock.productList[k].typeStocks![j].clientStockDetail[length].clientStockDetailUnits.push(clientStockDetailUnits);
        /* this.variables.set(this.newClientStock.clientStockDetails[i].idProduct, this.typeStocks); */
      }
    }

    this.onStockValidToSend(true);
    this.onStockValidToSave(true);
  }

  saveClientStockBatch(dbServ: SQLiteObject, clientStocks: ClientStocks[]) {
    const insertClientStock = 'INSERT OR REPLACE INTO client_stocks ('
      + 'id_client_stock, co_client_stock, id_user, co_user, id_client, co_client, id_address_client,'
      + 'co_address_client,coordenada, tx_comment,'
      + 'id_enterprise, co_enterprise, st_client_stock, da_client_stock, lb_client, isSave, nu_attachments, has_attachments'
      + ') VALUES ('
      + '?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

    const insertClientStocksDetails = "INSERT OR REPLACE INTO client_stocks_details ("
      + "id_client_stock_detail, co_client_stock_detail, co_client_stock, na_product, co_product, id_product,"
      + "co_enterprise,id_enterprise, posicion,isSave"
      + ") VALUES ("
      + "?,?,?,?,?,?,?,?,?,?)"

    const insertClientStockDetailsUnit = "INSERT OR REPLACE INTO client_stocks_details_units ("
      + "id_client_stock_detail_unit, co_client_stock_detail_unit,"
      + "co_client_stock_detail, co_product_unit,co_unit,"
      + "id_product_unit,qu_stock,"
      + "co_enterprise,id_enterprise, qu_unit, na_unit,ubicacion, posicion,nu_batch, da_expiration,isSave"
      + ") VALUES ("
      + "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"

    let queries: any[] = []//(string | (string | number | boolean)[])[] = [];

    for (var cliS = 0; cliS < clientStocks.length; cliS++) {
      const clientStock = clientStocks[cliS];

      queries.push([insertClientStock,
        [
          clientStock.idClientStock, clientStock.coClientStock, clientStock.idUser, clientStock.coUser,
          clientStock.idClient, clientStock.coClient, clientStock.idAddressClient, clientStock.coAddressClient,
          clientStock.coordenada, clientStock.txComment, clientStock.idEnterprise, clientStock.coEnterprise,
          clientStock.stClientStock, clientStock.daClientStock, clientStock.lbClient, clientStock.isSave,
          clientStock.nuAttachments, clientStock.hasAttachments
        ]
      ]);

      for (var cliSDetail = 0; cliSDetail < clientStock.clientStockDetails.length; cliSDetail++) {
        const clientStockDetail = clientStock.clientStockDetails[cliSDetail];

        queries.push([insertClientStocksDetails,
          [
            clientStockDetail.idClientStockDetail, clientStockDetail.coClientStockDetail, clientStockDetail.coClientStock,
            clientStockDetail.naProduct, clientStockDetail.coProduct, clientStockDetail.idProduct,
            clientStockDetail.coEnterprise, clientStockDetail.idEnterprise, clientStockDetail.posicion, clientStockDetail.isSave
          ]
        ]);

        for (var cliSDetailUnit = 0; cliSDetailUnit < clientStockDetail.clientStockDetailUnits.length; cliSDetailUnit++) {
          const clientStockDetailUnit = clientStockDetail.clientStockDetailUnits[cliSDetailUnit];

          queries.push([insertClientStockDetailsUnit,
            [
              clientStockDetailUnit.idClientStockDetailUnit, clientStockDetailUnit.coClientStockDetailUnit,
              clientStockDetailUnit.coClientStockDetail, clientStockDetailUnit.coProductUnit, clientStockDetailUnit.coUnit,
              clientStockDetailUnit.idProductUnit, clientStockDetailUnit.quStock,
              clientStockDetailUnit.coEnterprise, clientStockDetailUnit.idEnterprise, clientStockDetailUnit.quUnit,
              clientStockDetailUnit.naUnit, clientStockDetailUnit.ubicacion, clientStockDetailUnit.posicion,
              clientStockDetailUnit.nuBatch, clientStockDetailUnit.daExpiration, clientStockDetailUnit.isSave
            ]
          ]);
        }
      }

    }

    return dbServ.sqlBatch(queries).then(() => { }).catch(error => { });


  }

  saveClientStock(dbServ: SQLiteObject, send: Boolean) {
    var insertStatement: string = '';

    var batch = [];

    if (send) {
      this.newClientStock.stClientStock = DELIVERY_STATUS_TO_SEND;
    } else {
      this.newClientStock.stClientStock = DELIVERY_STATUS_SAVED;
    }
    this.newClientStock.hasAttachments = this.adjuntoService.hasItems();
    this.newClientStock.nuAttachments = this.adjuntoService.getNuAttachment();


    insertStatement = 'INSERT OR REPLACE INTO client_stocks ('
      + 'id_client_stock, co_client_stock, id_user, co_user, id_client, co_client, id_address_client,'
      + 'co_address_client,coordenada, tx_comment,'
      + 'id_enterprise, co_enterprise, st_client_stock, da_client_stock, lb_client, isSave, nu_attachments, has_attachments'
      + ') VALUES ('
      + '?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

    var q = [insertStatement,
      [this.newClientStock.idClientStock, this.newClientStock.coClientStock, this.newClientStock.idUser, this.newClientStock.coUser,
      this.newClientStock.idClient, this.newClientStock.coClient, this.newClientStock.idAddressClient, this.newClientStock.coAddressClient,
      this.newClientStock.coordenada, this.newClientStock.txComment, this.newClientStock.idEnterprise, this.newClientStock.coEnterprise,
      this.newClientStock.stClientStock, this.newClientStock.daClientStock, this.newClientStock.lbClient, this.newClientStock.isSave,
      this.newClientStock.nuAttachments, this.newClientStock.hasAttachments]
    ];
    batch.push(q);

    return dbServ.sqlBatch(batch).then(() => {
      /* return this.getIncidencesByVisit(input[0].idVisit); */
      console.log("SE GUARDO CLIENT_STOCKS");
      /* this.saveClientStocksDetails2(); */
      this.saveClientStocksDetails(dbServ, this.newClientStock.clientStockDetails);
    }).catch(e => {
      console.log("ERROR GUARDAR CLIENT_STOCKS");
      console.log(e);
    });

  }

  saveClientStocksDetails(dbServ: SQLiteObject, clientStockDetails: ClientStocksDetail[]) {
    let insertStatement: string = "";
    var batch: any[] = [];

    insertStatement = "INSERT OR REPLACE INTO client_stocks_details ("
      + "id_client_stock_detail, co_client_stock_detail, co_client_stock, na_product, co_product, id_product,"
      + "co_enterprise,id_enterprise, posicion,isSave"
      + ") VALUES ("
      + "?,?,?,?,?,?,?,?,?,?)"

    /*     this.variables.forEach((value, key) => {
          for (var i = 0; i < value.length; i++) {
    
            var q = [insertStatement,
              [value[i].clientStockDetail[0].idClientStockDetail, value[i].clientStockDetail[0].coClientStockDetail,
              value[i].clientStockDetail[0].coClientStock, value[i].clientStockDetail[0].naProduct,
              value[i].clientStockDetail[0].coProduct, value[i].clientStockDetail[0].idProduct,
              value[i].clientStockDetail[0].coEnterprise, value[i].clientStockDetail[0].idEnterprise,
              value[i].clientStockDetail[0].posicion, value[i].clientStockDetail[0].isSave]
            ]
    
            batch.push(q);
    
          }
        }) */
    for (var i = 0; i < clientStockDetails.length; i++) {
      var q =
        [insertStatement,
          [
            clientStockDetails[i].idClientStockDetail, this.newClientStock.clientStockDetails[i].coClientStockDetail,
            clientStockDetails[i].coClientStock, this.newClientStock.clientStockDetails[i].naProduct,
            clientStockDetails[i].coProduct, this.newClientStock.clientStockDetails[i].idProduct,
            clientStockDetails[i].coEnterprise, this.newClientStock.clientStockDetails[i].idEnterprise,
            clientStockDetails[i].posicion, this.newClientStock.clientStockDetails[i].isSave
          ]
        ]

      batch.push(q);
    }

    return dbServ.sqlBatch(batch).then(() => {
      /* return this.getIncidencesByVisit(input[0].idVisit); */
      console.log("SE GUARDO CLIENT_STOCKS_DETAILS");
      this.saveClientStocksDetailsUnits(dbServ, clientStockDetails);
    }).catch(e => {
      console.log("ERROR GUARDAR CLIENT_STOCKS_DETAILS");
      console.log(e);
    });
  }

  saveClientStocksDetailsUnits(dbServ: SQLiteObject, clientStockDetails: ClientStocksDetail[]) {
    let insertStatement: string = "";
    var batch: any[] = [];
    insertStatement = "INSERT OR REPLACE INTO client_stocks_details_units ("
      + "id_client_stock_detail_unit, co_client_stock_detail_unit,"
      + "co_client_stock_detail, co_product_unit,co_unit,"
      + "id_product_unit,qu_stock,"
      + "co_enterprise,id_enterprise, qu_unit, na_unit,ubicacion, posicion,nu_batch, da_expiration,isSave"
      + ") VALUES ("
      + "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"

    /* this.variables.forEach((value, key) => {
      for (var i = 0; i < value.length; i++) {
        var q = [insertStatement,
          [value[i].clientStockDetail[0].clientStockDetailUnits[0].idClientStockDetailUnit,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].coClientStockDetailUnit,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].coClientStockDetail,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].coProductUnit,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].coUnit,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].idProductUnit,          
          value[i].cantidad,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].coEnterprise,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].idEnterprise,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].quUnit,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].naUnit,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].ubicacion,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].posicion,
          value[i].lote,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].daExpiration,
          value[i].clientStockDetail[0].clientStockDetailUnits[0].isSave]
        ]
        batch.push(q);
      }
    }) */

    for (var i = 0; i < clientStockDetails.length; i++) {
      for (var j = 0; j < clientStockDetails[i].clientStockDetailUnits.length; j++) {
        var q =
          [insertStatement,
            [
              clientStockDetails[i].clientStockDetailUnits[j].idClientStockDetailUnit,
              clientStockDetails[i].clientStockDetailUnits[j].coClientStockDetailUnit,
              clientStockDetails[i].clientStockDetailUnits[j].coClientStockDetail,
              clientStockDetails[i].clientStockDetailUnits[j].coProductUnit,
              clientStockDetails[i].clientStockDetailUnits[j].coUnit,
              clientStockDetails[i].clientStockDetailUnits[j].idProductUnit,
              clientStockDetails[i].clientStockDetailUnits[j].quStock,
              clientStockDetails[i].clientStockDetailUnits[j].coEnterprise,
              clientStockDetails[i].clientStockDetailUnits[j].idEnterprise,
              clientStockDetails[i].clientStockDetailUnits[j].quUnit,
              clientStockDetails[i].clientStockDetailUnits[j].naUnit,
              clientStockDetails[i].clientStockDetailUnits[j].ubicacion,
              clientStockDetails[i].clientStockDetailUnits[j].posicion,
              clientStockDetails[i].clientStockDetailUnits[j].nuBatch,
              clientStockDetails[i].clientStockDetailUnits[j].daExpiration,
              clientStockDetails[i].clientStockDetailUnits[j].isSave]
          ]
        batch.push(q);
      }
    }

    return dbServ.sqlBatch(batch).then(() => {
      /* return this.getIncidencesByVisit(input[0].idVisit); */
      console.log("SE GUARDO CLIENT_STOCKS_DETAILS_UNITS");
      return true;
    }).catch(e => {
      console.log("ERROR GUARDAR CLIENT_STOCKS_DETAILS_UNITS");
      console.log(e);
    });
  }

  /* getClientStock(coClientStock: string) {
    let clientStockDetails = [] as ClientStocksDetail[];
    this.variables.forEach((value, key) => {
      for (var i = 0; i < value.length; i++) {
        let details = {} as ClientStocksDetail;
        let detailsUnits = {} as ClientStocksDetailUnits;
        details.idClientStockDetail = value[i].clientStockDetail[0].idClientStockDetail;
        details.coClientStockDetail = value[i].clientStockDetail[0].coClientStockDetail;
        details.coClientStock = value[i].clientStockDetail[0].coClientStock;
        details.idProduct = value[i].clientStockDetail[0].idProduct;
        details.coProduct = value[i].clientStockDetail[0].coProduct;
        details.naProduct = value[i].clientStockDetail[0].naProduct;
        details.idEnterprise = value[i].clientStockDetail[0].idEnterprise;
        details.coEnterprise = value[i].clientStockDetail[0].coEnterprise;
        details.isEdit = value[i].clientStockDetail[0].isEdit;
        details.posicion = value[i].clientStockDetail[0].posicion;
        details.isSave = value[i].clientStockDetail[0].isSave;

        details.clientStockDetailUnits = [] as ClientStocksDetailUnits[];
        
        detailsUnits.coClientStockDetail = value[i].clientStockDetail[0].clientStockDetailUnits[0].coClientStockDetail;
        detailsUnits.coClientStockDetailUnit = value[i].clientStockDetail[0].clientStockDetailUnits[0].coClientStockDetailUnit;
        detailsUnits.coEnterprise = value[i].clientStockDetail[0].clientStockDetailUnits[0].coEnterprise;
        detailsUnits.coProductUnit = value[i].clientStockDetail[0].clientStockDetailUnits[0].coProductUnit;
        detailsUnits.coUnit = value[i].clientStockDetail[0].clientStockDetailUnits[0].coUnit;
        detailsUnits.daExpiration = value[i].clientStockDetail[0].clientStockDetailUnits[0].daExpiration.replace('T', ' ');
        detailsUnits.idClientStockDetailUnit = value[i].clientStockDetail[0].clientStockDetailUnits[0].idClientStockDetailUnit;
        detailsUnits.idEnterprise = value[i].clientStockDetail[0].clientStockDetailUnits[0].idEnterprise;
        detailsUnits.idProductUnit = value[i].clientStockDetail[0].clientStockDetailUnits[0].idProductUnit;
        detailsUnits.idUnit = value[i].clientStockDetail[0].clientStockDetailUnits[0].idUnit;
        detailsUnits.isEdit = value[i].clientStockDetail[0].clientStockDetailUnits[0].isEdit;
        detailsUnits.isSave = value[i].clientStockDetail[0].clientStockDetailUnits[0].isSave;
        detailsUnits.naUnit = value[i].clientStockDetail[0].clientStockDetailUnits[0].naUnit;
        detailsUnits.nuBatch = value[i].clientStockDetail[0].clientStockDetailUnits[0].nuBatch;
        detailsUnits.posicion = value[i].clientStockDetail[0].clientStockDetailUnits[0].posicion;
        detailsUnits.quStock = value[i].clientStockDetail[0].clientStockDetailUnits[0].quStock;
        detailsUnits.quSuggested = value[i].clientStockDetail[0].clientStockDetailUnits[0].quSuggested;
        detailsUnits.quUnit = value[i].clientStockDetail[0].clientStockDetailUnits[0].quUnit;
        detailsUnits.ubicacion = value[i].clientStockDetail[0].clientStockDetailUnits[0].ubicacion;
        details.clientStockDetailUnits.push(detailsUnits);
        clientStockDetails.push(details);
      }
    })
    this.newClientStock.clientStockDetails = clientStockDetails;
    return Promise.resolve(true);

  } */
  getClientStock(dbServ: SQLiteObject, coClientStock: string) {
    var clientStock: ClientStocks;

    let selectClientStock = "SELECT "
      + "id_client_stock as idClientStock, co_client_stock as coClientStock, id_user as idUser, co_user as coUser,"
      + "id_client as idClient, co_client as coClient, id_address_client as idAddressClient, co_address_client as coAddressClient,"
      + "coordenada, tx_comment as txComment, id_enterprise as idEnterprise, co_enterprise as coEnterprise,"
      + "da_client_stock as daClientStock, st_client_stock as stClientStock, lb_client as lbClient, isSave as isSave, nu_attachments as nuAttachments, has_attachments as hasAttachments  "
      + "FROM client_stocks WHERE co_client_stock = ?"

    return dbServ.executeSql(selectClientStock, [coClientStock]).then(result => {
      clientStock = result.rows.item(0);
      console.log(clientStock);
      return this.getClientStockDetails(dbServ, clientStock.coClientStock).then(details => {
        clientStock.clientStockDetails = details;
        return clientStock
      })
    }).catch(e => {
      console.log("Error al ejecutar getClientStock.");
      console.log(e);
      return clientStock;
    });
  }

  getClientStockDetails(dbServ: SQLiteObject, coCLientStock: string) {
    let selectClientStockDetail = "SELECT "
      + "id_client_stock_detail as idClientStockDetail, co_client_stock_detail as coClientStockDetail, co_client_stock as coClientStock,"
      + "co_product as coProduct, na_product as naProduct, id_product as idProduct, co_enterprise as coEnterprise,"
      + "id_enterprise as idEnterprise, posicion, isSave as isSave "
      + "FROM client_stocks_details WHERE co_client_stock = ?"

    return dbServ.executeSql(selectClientStockDetail, [coCLientStock]).then(data => {
      //console.log(data);
      let clientStockDetails: ClientStocksDetail[] = []
      for (let i = 0; i < data.rows.length; i++) {
        const item = data.rows.item(i);
        clientStockDetails.push(item);
        clientStockDetails[i].clientStockDetailUnits = [] as ClientStocksDetailUnits[]
      }
      return clientStockDetails;

    }).catch(e => {
      console.log("Error al ejecutar getClientStockDetails.");
      console.log(e);
      return [];
    });
  }

  getClientStockDetailsUnits(dbServ: SQLiteObject, coClientStocksDetail: string, index: number) {

    let selectClientStockDetailUnit = "SELECT "
      + "id_client_stock_detail_unit as idClientStockDetailUnit, co_client_stock_detail_unit as coClientStockDetailUnit,"
      + "co_client_stock_detail as coClientStockDetail, co_product_unit as coProductUnit, co_unit as coUnit,"
      + "id_product_unit as idProductUnit, na_unit as naUnit, qu_stock as quStock, co_enterprise as coEnterprise,"
      + "qu_unit as quUnit, ubicacion, id_enterprise as idEnterprise, da_expiration as daExpiration,"
      + "nu_batch as nuBatch, posicion, isSave as isSave "
      + "FROM client_stocks_details_units WHERE co_client_stock_detail = ?";

    return dbServ.executeSql(selectClientStockDetailUnit, [coClientStocksDetail]).then(data => {
      let clientStockDetailUnits = [] as ClientStocksDetailUnits[]
      for (let i = 0; i < data.rows.length; i++) {

        clientStockDetailUnits.push(data.rows.item(i));

      }
      return [index, clientStockDetailUnits] as const;

    }).catch(e => {
      console.log("Error al ejecutar getClientStockDetails.");
      console.log(e);
      return [];
    });

  }

  getAllClientStock(dbServ: SQLiteObject) {
    let selectStatement = "SELECT "
      + "id_client_stock as idClientStock, co_client_stock as coClientStock, id_user as idUser,"
      + "co_user as coUser, id_client as idClient, co_client as coClient, id_address_client as idAddressClient,"
      + "co_address_client as coAddressClient,coordenada, tx_comment as txComment,"
      + "id_enterprise as idEnterprise, co_enterprise as coEnterprise, st_client_stock as stClientStock,"
      + "da_client_stock as daClientStock, lb_client as lbClient, isSave "
      + "FROM client_stocks";
    return dbServ.executeSql(selectStatement, []).then(async data => {
      let promises: Promise<void>[] = [];
      let clientStock = [] as ClientStocks[];
      this.itemListClientStocks = [] as ItemListaInventarios[];

      for (var i = 0; i < data.rows.length; i++) {
        clientStock.push(data.rows.item(i));
        let item = data.rows.item(i);

        // Crea un nuevo objeto para cada item
        let p = this.historyTransaction.getStatusTransaction(dbServ, 5, item.idClientStock!).then(status => {
          const itemClientStock: ItemListaInventarios = {
            idClientStock: item.idClientStock,
            coClientStock: item.coClientStock,
            coClient: item.coClient,
            lbClient: item.lbClient,
            stClientStock: item.stClientStock,
            daClientStock: item.daClientStock,
            naStatus: status
          };
          this.itemListClientStocks.push(itemClientStock);
        });
        promises.push(p);
      }
      await Promise.all(promises);

      return clientStock;
    }).catch(e => {
      console.log("Error al ejecutar getAllClientStock.");
      console.log(e);
      return [];
    });
  }

  deleteClientStock(dbServ: SQLiteObject, coClientStock: string) {
    let deleteStatement = "DELETE FROM client_stocks WHERE co_client_stock = ?";
    return dbServ.executeSql(deleteStatement, [coClientStock]).then(data => {
      return Promise.resolve(true);
    }).catch(e => {
      console.log("Error al ejecutar deleteClientStock.");
      console.log(e);
      return false;
    });
  }

  deleteClientStockDetails(dbServ: SQLiteObject, coClientStockDetail: string) {
    let deleteStatement = "DELETE FROM client_stocks_details WHERE co_client_stock = ?";
    return dbServ.executeSql(deleteStatement, [coClientStockDetail]).then(data => {
      console.log("Se elimino clientStockDetail " + coClientStockDetail);
      return Promise.resolve(true);
    }).catch(e => {
      console.log("Error al ejecutar deleteClientStockDetail.");
      console.log(e);
      return false;
    });
  }

  deleteClientStockDetailsUnits(dbServ: SQLiteObject, coClientStockDetails: string[]) {
    var batch = [];
    let deleteStatement = "DELETE FROM client_stocks_details_units WHERE co_client_stock_detail = ?";
    for (var i = 0; i < coClientStockDetails.length; i++) {

      var q = [deleteStatement, [coClientStockDetails[i]]]

      batch.push(q);

    }
    return dbServ.sqlBatch(batch).then(() => {
      console.log("Se elimino clientStockDetailUnits " + coClientStockDetails);

      return Promise.resolve(true);

    }).catch(e => {
      console.log("Error al ejecutar deleteClientStockDetailUnits.");
      console.log(e);
    });
  }

  onShowProductStructures() {
    this.showProductList = false;
    this.productStructureService.onAddProductCLicked();
  }

}
