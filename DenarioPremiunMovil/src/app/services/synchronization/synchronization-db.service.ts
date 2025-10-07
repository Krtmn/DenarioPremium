import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, fromEventPattern, identity, Observable, throwError } from 'rxjs';
import { NavController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
// import { SQLitePorter } from '@ionic-native/sqlite-porter';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { ServicesService } from '../services.service';
import { syncResponse } from 'src/app/modelos/tables/getSyncResponse';
import { AddresClient } from '../../modelos/tables/addresClient';
import { Client } from 'src/app/modelos/tables/client';
import { Currencies } from 'src/app/modelos/tables/currencies';
import { DistributionChannel } from 'src/app/modelos/tables/distributionChannel';
import { DocumentSaleType } from 'src/app/modelos/tables/documentSaleType';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { List } from 'src/app/modelos/tables/list';
import { PaymentCondition } from 'src/app/modelos/tables/paymentCondition';
import { ProductLine } from 'src/app/modelos/tables/productLine';
import { Product } from 'src/app/modelos/tables/product';
import { Unit } from 'src/app/modelos/tables/unit';
import { ProductUnit } from 'src/app/modelos/tables/productUnit';
import { PriceList } from 'src/app/modelos/tables/priceList';
import { GlobalConfiguration } from 'src/app/modelos/tables/globalConfiguration';
import { Bank } from 'src/app/modelos/tables/bank';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { IncidenceMotive } from 'src/app/modelos/tables/incidenceMotive';
import { IncidenceType } from 'src/app/modelos/tables/incidenceType';
import { ReturnMotive } from 'src/app/modelos/tables/returnMotive';
import { ReturnType } from 'src/app/modelos/tables/returnType';
import { BankAccount } from 'src/app/modelos/tables/bankAccount';
import { Stock } from 'src/app/modelos/tables/stock';
import { Discount } from 'src/app/modelos/tables/discount';
import { Visit } from 'src/app/modelos/tables/visit';
import { IvaList } from 'src/app/modelos/tables/iva';
import { Warehouse } from 'src/app/modelos/tables/warehouse';
import { GlobalDiscount } from 'src/app/modelos/tables/globalDiscount';
import { ProductMinMulFav } from 'src/app/modelos/tables/productMinMul';
import { ClientBankAccount } from 'src/app/modelos/tables/clientBankAccount';
import { UserInformation } from 'src/app/modelos/tables/userInformation';
import { CurrencyEnterprise } from 'src/app/modelos/tables/currencyEnterprise';
import { CurrencyRelation } from 'src/app/modelos/tables/currencyRelation';
import { ConversionType } from 'src/app/modelos/tables/conversionType';
import { ProductStructure } from 'src/app/modelos/tables/productStructure';
import { ProductStructureCount } from 'src/app/modelos/tables/productStructureCount';
import { OrderType } from 'src/app/modelos/tables/orderType';
import { UserProductFav } from 'src/app/modelos/tables/userProductFav';
import { TypeProductStructure } from 'src/app/modelos/tables/typeProductStructure';
import { ClientAvgProduct } from 'src/app/modelos/tables/clientAvgProduct';
import { Invoice } from 'src/app/modelos/tables/invoice';
import { IgtfList } from 'src/app/modelos/tables/igtfList';
import { InvoiceDetail } from 'src/app/modelos/tables/invoiceDetail';
import { InvoiceDetailUnit } from 'src/app/modelos/tables/invoiceDetailUnit';
import { ApplicationTag } from 'src/app/modelos/tables/applicationTag';
import { User } from 'src/app/modelos/user';
import { Router } from '@angular/router';
import { ClientChannelOrderType } from 'src/app/modelos/tables/clientChannelOrderType';
import { OrderTypeProductStructure } from 'src/app/modelos/tables/orderTypeProductStructure';
import { Statuses } from 'src/app/modelos/tables/statuses';
import { TransactionTypes } from 'src/app/modelos/tables/transactionTypes';
import { TransactionStatuses } from 'src/app/modelos/tables/transactionStatuses';
import { Orders } from 'src/app/modelos/tables/orders';
import { PedidosDbService } from 'src/app/pedidos/pedidos-db.service';
import { Collection } from 'src/app/modelos/tables/collection';
import { CollectionService } from '../collection/collection-logic.service';
import { Return } from 'src/app/modelos/tables/return';
import { ClientStocks } from 'src/app/modelos/tables/client-stocks';
import { Deposit } from 'src/app/modelos/tables/deposit';
import { ReturnLogicService } from '../returns/return-logic.service';
import { InventariosLogicService } from '../inventarios/inventarios-logic.service';
import { DepositService } from '../deposit/deposit.service';
import { ReturnDatabaseService } from '../returns/return-database.service';
import { OrderDetail } from 'src/app/modelos/tables/orderDetail';
import { OrderDetailUnit } from 'src/app/modelos/tables/orderDetailUnit';
import { OrderDetailDiscount } from 'src/app/modelos/orderDetailDiscount';

@Injectable({
  providedIn: 'root'
})

export class SynchronizationDBService {
  private database!: SQLiteObject;
  private services = inject(ServicesService);
  private pedidosService = inject(PedidosDbService);
  private collectionService = inject(CollectionService);
  private returnService = inject(ReturnDatabaseService);
  private clientStockService = inject(InventariosLogicService);
  private depositService = inject(DepositService);
  private databaseReady!: BehaviorSubject<boolean>;
  private tables: any[] = [];
  public tablaSincronizando: string = "";
  public inHome: Boolean = true;



  constructor(
    private navController: NavController,

    private sqlite: SQLite,
    private http: HttpClient,
    private router: Router,

  ) {
    this.databaseReady = new BehaviorSubject(false);

    this.tables = [
      { "id": 99996, "nameTable": "transactionImage" },
      { "id": 99997, "nameTable": "incidences" },
      { "id": 99998, "nameTable": "globalConfiguration" },
      { "id": 99999, "nameTable": "versionsTables" },
      { "id": 1, "nameTable": "addressClientTable" },
      { "id": 2, "nameTable": "bankTable" },
      { "id": 3, "nameTable": "clientTable" },
      { "id": 5, "nameTable": "distributionChannelTable" },
      { "id": 6, "nameTable": "documentSaleTable" },
      { "id": 7, "nameTable": "documentSaleTypeTable" },
      { "id": 8, "nameTable": "enterpriseTable" },
      { "id": 9, "nameTable": "incidenceMotiveTable" },
      { "id": 10, "nameTable": "incidenceTypeTable" },
      { "id": 13, "nameTable": "priceListTable" },
      { "id": 15, "nameTable": "productTable" },
      { "id": 16, "nameTable": "returnMotiveTable" },
      { "id": 17, "nameTable": "returnTypeTable" },
      { "id": 20, "nameTable": "bankAccountTable" },
      { "id": 23, "nameTable": "listTable" },
      { "id": 25, "nameTable": "stockTable" },
      { "id": 29, "nameTable": "discountTable" },
      { "id": 31, "nameTable": "paymentConditionTable" },
      { "id": 32, "nameTable": "productUnitTable" },
      { "id": 33, "nameTable": "visitTable" },
      { "id": 34, "nameTable": "ivaListTable" },
      { "id": 35, "nameTable": "warehouseTable" },
      { "id": 37, "nameTable": "globalDiscountTable" },
      { "id": 38, "nameTable": "clientBankAccountTable" },
      { "id": 39, "nameTable": "productMinMulTable" },
      { "id": 40, "nameTable": "userInformationTable" },
      { "id": 42, "nameTable": "currencyEnterpriseTable" },
      { "id": 43, "nameTable": "currencyRelationTable" },
      { "id": 44, "nameTable": "conversionTypeTable" },
      { "id": 46, "nameTable": "typeProductStructureTable" },
      { "id": 48, "nameTable": "productStructureTable" },
      { "id": 50, "nameTable": "unitTable" },
      { "id": 51, "nameTable": "productStructureCountTable" },
      { "id": 52, "nameTable": "orderTypeTable" },
      { "id": 53, "nameTable": "userProductFavTable" },
      { "id": 54, "nameTable": "clientAvgProductTable" },
      { "id": 55, "nameTable": "igtfListTable" },
      { "id": 56, "nameTable": "invoiceTable" },
      { "id": 57, "nameTable": "invoiceDetailTable" },
      { "id": 58, "nameTable": "invoiceDetailUnitTable" },
      { "id": 59, "nameTable": "clientChannelOrderTypeTable" },
      { "id": 60, "nameTable": "orderTypeProductStructureTable" },
      { "id": 61, "nameTable": "statusTable" },
      { "id": 62, "nameTable": "transactionTypeTable" },
      { "id": 63, "nameTable": "transactionStatusesTable" },
      { "id": 64, "nameTable": "orderTable" },
      { "id": 65, "nameTable": "collectionTable" },
      { "id": 66, "nameTable": "returnTable" },
      { "id": 67, "nameTable": "clientStockTable" },
      { "id": 68, "nameTable": "depositTable" },
      { "id": 69, "nameTable": "orderDetailTable" },
      { "id": 70, "nameTable": "orderDetailUnitTable" },
      { "id": 71, "nameTable": "orderDetailDiscountTable" },
    ]
  }

  async initDb(user: User, conexion: Boolean) {
    this.databaseReady = new BehaviorSubject(false);
    this.sqlite.create({
      name: 'denarioPremium',
      location: 'default'
    }).then((db: SQLiteObject) => {
      this.database = db;
      this.createTables(user, conexion);
    }).catch(e => console.log(e));
  }

  getDatabase() {
    return this.database;
  }

  async createTables(user: User, conexion: Boolean) {
    if (localStorage.getItem("createTables") == "false" || localStorage.getItem("createTables") == null) {
      const promesa = new Promise<string>(async (resolve, reject) => {
        if (conexion) {
          var j = 1;
          (await this.getCreateTables()).subscribe((res) => {
            for (var i in res) {
              this.database.executeSql(res[i].sql, []).then((result) => {
                j++;
                if (j == res.length) {
                  localStorage.setItem("createTables", "true");
                  resolve("true");
                }
              }).catch((error) => {
                console.log(error, res[i].table)
              });
            }

          });
        } else {
          localStorage.setItem("createTables", "true");
          resolve("true");

        }
      })

      promesa.then((value) => {
        this.inHome = false;
        if (conexion) {
          let variablesConfiguracion = JSON.parse(localStorage.getItem("globalConfiguration") || "[]");

          this.insertGlobalConfiguration(variablesConfiguracion)
          if (user.tags.length > 0)
            this.insertTags(user.tags)

          this.initTableVersions(this.tables);
          this.navController.navigateForward("synchronization")
        } else
          this.router.navigate(['home']);

      }).catch((error) => {
        console.log(error);
      }).finally(() => {
        console.log("fin promesa insertar")
      });
    } else {
      if (conexion) {
        console.log("YA LAS TABLAS ESTAN CREADAS", user);
        /*      if (localStorage.getItem("sincronizarHome") == "true") {
               localStorage.setItem("sincronizarHome", "false");
               //this.router.navigate(['synchronization']);
               this.inHome = false;
               //this.navController.navigateForward("synchronization")
               
             } else { */
        this.navController.navigateForward("synchronization");
        //this.globalConfig.setVars(user.variablesConfiguracion);
        let variablesConfiguracion = JSON.parse(localStorage.getItem("globalConfiguration") || "[]");

        this.insertGlobalConfiguration(variablesConfiguracion)
        this.insertTags(user.tags)
        //}        //DEBO IR A SINCRONIZAR
      } else {
        //ESTOY SIN DATOS PERO YA SINCRONICE UNA VEZ, SE DEJA LOGGEAR Y SE MANDA MSJ DE NOTIFICACION    
        localStorage.setItem("connected", "false")
        this.services.getTags(this.getDatabase(), "HOME", "ESP").then(result => {
          for (var i = 0; i < result.length; i++) {
            this.services.tags.set(
              result[i].coApplicationTag, result[i].tag
            )
          }
          this.router.navigate(['home']);
        });

      }
    }

  }

  getDataBaseState() {
    return this.databaseReady.asObservable();
  }

  getTablesVersion() {
    return this.database.executeSql("SELECT * FROM versionsTables", []).then(data => {
      let lists = [];
      for (let i = 0; i < data.rows.length; i++) {
        lists.push(data.rows.item(i));
      }
      return lists;
    })
  }

  async getCreateTables(): Promise<Observable<any[]>> {
    return this.http.get<any[]>('assets/database/createTables.json');
  }

  initTableVersions(tables: any[]) {
    var statements = [];

    let insertStatement = "INSERT OR REPLACE INTO versionsTables (id_table, name_table,last_update,numreg) VALUES (?,?,?,?)";

    for (var i = 0; i < tables.length; i++) {
      statements.push([insertStatement, [tables[i].id, tables[i].nameTable, '1970-01-01 00:00:00.000', 0]])
    }
    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log("versionTables Error", e);
    })
  }

  updateVersionsTables(lastUpdate: string, idTable: number) {
    let updateStatement = "UPDATE versionsTables SET last_update = ? WHERE id_table = ?;"
    return this.database.executeSql(
      updateStatement, [lastUpdate, idTable]).then(res => {
        return true;
      }).catch(e => {
        console.log(e);
      })
  }

  async insertGlobalConfiguration(obj: GlobalConfiguration[]) {
    this.tablaSincronizando = "- Variables Configuración";
    var inserStatement = 'INSERT OR REPLACE INTO global_configuration(' +
      'id_config,clave,valor,descripcion) ' +
      'VALUES(?,?,?,?)';
    var statements = [];
    for (var i = 0; i < obj.length; i++) {
      statements.push([inserStatement, [obj[i].idConfig, obj[i].clave, obj[i].valor, obj[i].descripcion]])
    }
    this.database.sqlBatch(statements).then(res => {
      console.log("insertglobal ready");
    }).catch(e => {
      console.log("insertglobal Error", e);
    })
  }

  async insertTags(obj: ApplicationTag[]) {
    this.tablaSincronizando = "- Etiquetas";
    var inserStatement = 'INSERT OR REPLACE INTO application_tags(' +
      'id_application_tag,co_application_tag,co_language,co_module,na_module,tag' +
      ')' +
      'VALUES(?,?,?,?,?,?)';
    var statements = [];

    for (var i = 0; i < obj.length; i++) {
      statements.push([inserStatement, [obj[i].idApplicationTag, obj[i].coApplicationTag, obj[i].coLanguage,
      obj[i].coModule, obj[i].naModule, obj[i].tag]])
    }
    this.database.sqlBatch(statements).then(res => {
      console.log("insertags ready");
    }).catch(e => {
      console.log("insertags Error", e);
    })
  }

  insertAddressClientBatch(arr: AddresClient[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO address_clients(" +
      'id_address, co_address,id_client,id_address_type,co_address_type,' +
      'tx_address, nu_phone,na_responsible,co_enterprise_structure,id_enterprise_structure,' +
      'co_client, co_enterprise, id_enterprise, na_address, coordenada, editable' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      statements.push([insertStatement, [arr[i].idAddress, arr[i].coAddress, arr[i].idClient, arr[i].idAddressType, arr[i].coAddressType,
      arr[i].txAddress, arr[i].nuPhone, arr[i].naResponsible, arr[i].coEnterpriseStructure, arr[i].idEnterpriseStructure,
      arr[i].coClient, arr[i].coEnterprise, arr[i].idEnterprise, arr[i].naAddress, arr[i].coordenada, arr[i].editable]])
    }

    return this.database.sqlBatch(statements).then(res => {
      console.log("insert addresClient ready")
      return res;
    }).catch(e => {
      console.log(e);
    })
  }

  insertBanksBatch(arr: Bank[]) {
    var statements = [];
    let insertStatement = 'INSERT OR REPLACE INTO banks(' +
      'id_bank,co_enterprise,id_enterprise,na_bank,co_bank' +
      ') ' +
      'VALUES(?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idBank, obj.coEnterprise, obj.idEnterprise, obj.naBank, obj.coBank]])
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertClientBatch(arr: Client[]) {
    let insertStatement = 'INSERT OR REPLACE INTO clients(' +
      'id_client,id_enterprise,co_enterprise,co_client,lb_client,' +
      'nu_rif,id_channel,id_warehouse,id_head_quarter,id_list,' +
      'id_payment_condition,co_payment_condition,in_suspension,qu_discount,na_email,' +
      'nu_credit_limit,na_web_site,id_currency,co_currency,multimoneda,collection_iva' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idClient, obj.idEnterprise, obj.coEnterprise, obj.coClient,
      obj.lbClient, obj.nuRif, obj.idChannel, obj.idWarehouse, obj.idHeadQuarter, obj.idList,
      obj.idPaymentCondition, obj.coPaymentCondition, obj.inSuspension, obj.quDiscount, obj.naEmail,
      obj.nuCreditLimit, obj.naWebSite, obj.idCurrency, obj.coCurrency, obj.multimoneda, obj.collectionIva]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);

    })
  }

  insertDistributionChannelBatch(arr: DistributionChannel[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO distribution_channels(" +
      'id_channel,co_channel,na_channel,short_na_channel,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idChannel, obj.coChannel, obj.naChannel,
      obj.shortNaChannel, obj.coEnterprise, obj.idEnterprise]])
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }


  insertDocumentSaleBatch(arr: DocumentSale[]) {
    var statements = [];
    let insertStatement = 'INSERT OR REPLACE INTO document_sales(' +
      'id_document,id_client,co_client,id_document_sale_type, co_document_sale_type,' +
      'da_document,da_due_date,nu_amount_base,nu_amount_discount,nu_amount_tax,' +
      'nu_amount_total,nu_balance,id_currency,co_currency,id_enterprise,' +
      'co_enterprise,nu_document,tx_comment,co_document,co_collection,' +
      'nu_value_local,st_document_sale' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idDocument, obj.idClient, obj.coClient, obj.idDocumentSaleType, obj.coDocumentSaleType,
      obj.daDocument, obj.daDueDate, obj.nuAmountBase, obj.nuAmountDiscount, obj.nuAmountTax,
      obj.nuAmountTotal, obj.nuBalance, obj.idCurrency, obj.coCurrency, obj.idEnterprise,
      obj.coEnterprise, obj.nuDocument, obj.txComment, obj.coDocument, obj.coCollection,
      obj.nuValueLocal, obj.stDocumentSale]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      var statements = [];

      let statementsDocumentSt = 'INSERT OR REPLACE INTO document_st (' +
        'id_document, co_document, st_document' +
        ') VALUES (' +
        '?,?,?)'
      for (var i = 0; i < arr.length; i++) {
        var obj = arr[i];
        statements.push([statementsDocumentSt, [obj.idDocument, obj.coDocument, 0]]);
      }
      this.database.sqlBatch(statements).then(res => {
        console.log(res)
      }).catch(e => {
        console.log(e);
      })
    }).catch(e => {
      console.log(e);
    })
  }

  insertDocumentSaleTypeBatch(arr: DocumentSaleType[]) {
    var statements = [];
    let insertStatement = 'INSERT OR REPLACE INTO document_sale_types(' +
      'id_document_sale_type,co_type,na_type,co_equiv,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?)'


    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idDocumentSaleType, obj.coType,
      obj.naType, obj.coEquiv, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertIncidenceMotiveBatch(arr: IncidenceMotive[]) {
    var statements = [];
    let insertStatement = 'INSERT OR REPLACE INTO incidence_motives(' +
      'id_motive,id_type,na_motive' +
      ') ' +
      'VALUES(?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idMotive, obj.idType, obj.naMotive]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertIncidenceTypeBatch(arr: IncidenceType[]) {
    var statements = [];
    let insertStatement = 'INSERT OR REPLACE INTO incidence_types(' +
      'id_type, na_type, required_event, required_signature' +
      ') ' +
      'VALUES(?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idType, obj.naType, obj.requiredEvent, obj.requiredSignature]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertEnterpriseBatch(arr: Enterprise[]) {
    var statements = [];
    let insertStatement = 'INSERT OR REPLACE INTO enterprises(' +
      'id_enterprise,lb_enterprise,co_enterprise,co_currency_default,enterprise_default, priority_selection' +
      ') ' +
      'VALUES(?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idEnterprise, obj.lbEnterprise, obj.coEnterprise,
      obj.coCurrencyDefault, obj.enterpriseDefault, obj.prioritySelection]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertListBatch(arr: List[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO lists(" +
      'id_list,co_list,na_list,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idList, obj.coList, obj.naList,
      obj.coEnterprise, obj.idEnterprise]])
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertStockBatch(arr: Stock[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO stocks(" +
      'id_stock,id_product,co_product,qu_stock,id_warehouse,' +
      'co_warehouse,da_update_stock,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idStock, obj.idProduct, obj.coProduct,
      obj.quStock, obj.idWarehouse, obj.coWarehouse,
      obj.daUpdateStock, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertDiscountBatch(arr: Discount[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO discounts(" +
      'id_discount,id_price_list,qu_discount,co_list,id_list,' +
      'co_product,co_unit,id_unit,qu_vol_ini,qu_vol_fin,' +
      'nu_priority,id_product,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idDiscount, obj.idPriceList,
      obj.quDiscount, obj.coList, obj.idList,
      obj.coProduct, obj.coUnit, obj.idUnit, obj.quVolIni, obj.quVolFin,
      obj.nuPriority, obj.idProduct, obj.coEnterprise, obj.idEnterprise]]);
    }
    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertPaymentConditionBatch(arr: PaymentCondition[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO payment_conditions(" +
      'id_payment_condition,co_payment_condition,na_payment_condition,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idPaymentCondition, obj.coPaymentCondition,
      obj.naPaymentCondition, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertPriceListBatch(arr: PriceList[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO price_lists(" +
      'id_price_list,co_price_list,id_product,id_list,nu_measure_unit_price,' +
      'nu_price,co_currency,id_currency,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idPriceList, obj.coPriceList, obj.idProduct,
      obj.idList, obj.nuMeasureUnitPrice, obj.nuPrice, obj.coCurrency,
      obj.idCurrency, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertProductBatch(arr: Product[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO products(" +
      'id_product,co_product,na_product,co_primary_unit,co_product_structure,' +
      'id_product_structure,tx_dimension,tx_packing,points,nu_priority,' +
      'featured_product,tx_description, co_enterprise, id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idProduct, obj.coProduct, obj.naProduct,
      obj.coPrimaryUnit, obj.coProductStructure, obj.idProductStructure, obj.txDimension,
      obj.txPacking, obj.points, obj.nuPriority, obj.featuredProduct,
      obj.txDescription, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertReturnMotiveBatch(arr: ReturnMotive[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO return_motives(" +
      'id_motive,na_motive' +
      ') ' +
      'VALUES(?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idMotive, obj.naMotive]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertReturnTypeBatch(arr: ReturnType[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO return_types(" +
      'id_type,na_type' +
      ') ' +
      'VALUES(?,?)'


    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idType, obj.naType]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertBankAccountBatch(arr: BankAccount[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO bank_accounts(" +
      'id_bank_account,co_bank,id_bank,co_account,nu_account,' +
      'co_type,co_currency,id_currency,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idBankAccount, obj.coBank, obj.idBank,
      obj.coAccount, obj.nuAccount, obj.coType, obj.coCurrency, obj.idCurrency,
      obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertProductUnitBatch(arr: ProductUnit[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO product_units(" +
      'id_product_unit,co_product_unit,co_product,id_product,co_unit,' +
      'id_unit,qu_unit,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idProductUnit, obj.coProductUnit,
      obj.coProduct, obj.idProduct, obj.coUnit, obj.idUnit, obj.quUnit,
      obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {

    }).catch(e => {
      console.log(e);
    })
  }

  insertVisitsBatch(arr: Visit[]) {

    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO visits(" +
      'id_visit, co_visit, st_visit, da_visit, coordenada, id_client, co_client,' +
      'na_client, nu_sequence, id_user, co_user, co_enterprise, id_enterprise, da_real,' +
      'da_initial, id_address_client, co_address_client, nu_attachments, has_attachments,' +
      'is_reassigned, tx_reassigned_motive, da_reassign) ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [
        obj.idVisit, obj.coVisit, obj.stVisit, obj.daVisit, obj.coordenada, obj.idClient,
        obj.coClient, obj.naClient, obj.nuSequence, obj.idUser, obj.coUser, obj.coEnterprise,
        obj.idEnterprise, obj.daReal, obj.daInitial, obj.idAddressClient, obj.coAddressClient,
        obj.nuAttachments, obj.hasAttachments, obj.isReassigned, obj.txReassignedMotive, obj.daReassign
      ]]);
    }
    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertIvaBatch(arr: IvaList[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO iva_lists(" +
      'id_iva_list,price_iva,tx_description,default_iva' +
      ') ' +
      'VALUES(?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idIvaList, obj.priceIva,
      obj.txDescripcion, obj.defaultIVA]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertWarehouseBatch(arr: Warehouse[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO warehouses(" +
      'id_warehouse,co_warehouse,na_warehouse,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idWarehouse, obj.coWarehouse, obj.naWarehouse,
      obj.coEnterprise, obj.idEnterprise]]);
    }
    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertGlobalDiscountBatch(arr: GlobalDiscount[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO global_discounts(" +
      'id_global_discount,global_discount,tx_description,default_global_discount' +
      ') ' +
      'VALUES(?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idGlobalDiscount, obj.globalDiscount,
      obj.txDescription, obj.defaultGlobalDiscount]]);
    }
    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertClientBankAccountBatch(arr: ClientBankAccount[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO client_bank_accounts(" +
      'id_client_bank_account,co_client_bank_account,co_bank,id_bank,co_client,' +
      'id_client,nu_account,co_type,co_currency,id_currency,' +
      'co_enterprise,id_enterprise ' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idClientBankAccount, obj.coClientBankAccount,
      obj.coBank, obj.idBank, obj.coClient,
      obj.idClient, obj.nuAccount, obj.coType, obj.coCurrency, obj.idCurrency,
      obj.coEnterprise, obj.idEnterprise]]);
    }
    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertProductMinMulBatch(arr: ProductMinMulFav[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO product_min_muls (" +
      'id_product_min_mul,co_product,id_product,qu_minimum,qu_multiple,' +
      'flag,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?)'
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idProductMinMul, obj.coProduct,
      obj.idProduct, obj.quMinimum, obj.quMultiple,
      obj.flag, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertUserInformationBatch(arr: UserInformation[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO user_informations (" +
      'id_user_information,id_user,co_user,title,content,' +
      'co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idUserInformation, obj.idUser, obj.coUser,
      obj.title, obj.content,
      obj.coEnterprise, obj.idEnterprise]]);
    }
    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertCurrencyEnterpriseBatch(arr: CurrencyEnterprise[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO currency_enterprises  (" +
      'id_currency_enterprise,id_currency,co_currency,local_currency,hard_currency,' +
      'co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idCurrencyEnterprise, obj.idCurrency, obj.coCurrency,
      obj.localCurrency, obj.hardCurrency,
      obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertCurrencyRelationBatch(arr: CurrencyRelation[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO currency_relations  (" +
      'id_currency_relation,co_currency_hard,co_currency_local,nu_exchange_rate,co_enterprise,' +
      'id_enterprise' +

      ') ' +
      'VALUES(?,?,?,?,?,?)'

    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idCurrencyRelation, obj.coCurrencyHard, obj.coCurrencyLocal,
      obj.nuExchangeRate, obj.coEnterprise,
      obj.idEnterprise]]);
    }
    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertConversionTypesBatch(arr: ConversionType[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO conversion_types  (" +
      'id_conversion_type,co_conversion_type,co_currency_hard,co_currency_local,nu_value_local,' +
      'date_conversion,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?)'


    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idConversionType, obj.coConversionType, obj.coCurrencyHard,
      obj.coCurrencyLocal, obj.nuValueLocal,
      obj.dateConversion, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertTypeProductStructureBatch(arr: TypeProductStructure[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO type_product_structures  (" +
      'id_type_product_structure,type,co_type_product_structure,na_type_product_structure,sco_type_product_structure,' +
      'nu_level,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?)'



    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idTypeProductStructure, obj.type,
      obj.coTypeProductStructure, obj.naTypeProductStructure, obj.scoTypeProductStructure,
      obj.nuLevel, obj.coEnterprise, obj.idEnterprise]]);
    }
    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertProductStructureBatch(arr: ProductStructure[]) {
    let insertStatement = "INSERT OR REPLACE INTO product_structures  (" +
      'id_product_structure,type,co_product_structure,na_product_structure,id_type_product_structure,co_type_product_structure,' +
      'sco_product_structure,sna_product_structure,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?)'

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idProductStructure, obj.type, obj.coProductStructure,
      obj.naProductStructure, obj.idTypeProductStructure, obj.coTypeProductStructure,
      obj.scoProductStructure, obj.snaProductStructure, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertUnitBatch(arr: Unit[]) {
    let inserStatement = "INSERT OR REPLACE INTO units(" +
      'id_unit,co_unit,na_unit,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?)'

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([inserStatement, [obj.idUnit, obj.coUnit, obj.naUnit, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertProductStructureCountBatch(arr: ProductStructureCount[]) {
    let insertStatement = "INSERT OR REPLACE INTO product_structure_counts(" +
      'id,id_product_structure,co_product_structure,na_product_structure,qu_products,' +
      'id_type_product_structure,co_type_product_structure,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?)'

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.id, obj.idProductStructure, obj.coProductStructure,
      obj.naProductStructure, obj.quProducts,
      obj.idTypeProductStructure, obj.coTypeProductStructure, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertOrderTypeBatch(arr: OrderType[]) {
    let insertStatement = "INSERT OR REPLACE INTO order_types(" +
      'id_order_type,co_order_type,na_order_type,default_value,co_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?)'

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idOrderType, obj.coOrderType, obj.naOrderType,
      obj.defaultValue, obj.coEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertUserProductFavBatch(arr: UserProductFav[]) {
    let insertStatement = "INSERT OR REPLACE INTO user_product_favs(" +
      'id_user_product_favs,co_user,id_user,co_product,id_product,' +
      'if_change,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?)'

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idUserProductFavs, obj.coUser, obj.idUser, obj.coProduct,
      obj.idProduct, obj.ifChange, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertClientAvgProductBatch(arr: ClientAvgProduct[]) {
    let insertStatement = "INSERT OR REPLACE INTO client_avg_products(" +
      'id_client_avg_product,id_client,co_client,id_product,co_product,' +
      'id_product_unit,co_product_unit,id_address_client,co_address_client,average,' +
      'co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idClientAvgProduct, obj.idClient, obj.coClient,
      obj.idProduct, obj.coProduct,
      obj.idProductUnit, obj.coProductUnit, obj.idAddressClient, obj.coAddressClient, obj.average,
      obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertIgtfBatch(arr: IgtfList[]) {
    let insertStatement = "INSERT OR REPLACE INTO igtf_lists(" +
      'id_igtf,na_igtf,price,descripcion,default_igtf' +
      ') ' +
      'VALUES(?,?,?,?,?)'

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idIgtf, obj.naIgtf, obj.price, obj.descripcion, obj.defaultIgtf]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertInvoiceBatch(arr: Invoice[]) {
    let insertStatement = "INSERT OR REPLACE INTO invoices(" +
      'id_invoice,co_invoice,co_client,id_client,da_invoice,' +
      'na_responsible,id_user,nu_amount_total, nu_amount_final,co_currency,' +
      'da_dispatch,tx_comment,nu_purchase,co_user,co_payment_condition,' +
      'id_payment_condition,co_address_client,id_address_client,nu_discount,id_currency,' +
      'id_conversion_type,nu_value_local,nu_amount_final_conversion,nu_amount_total_conversion,co_enterprise,' +
      'id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idInvoice, obj.coInvoice, obj.coClient,
      obj.idClient, obj.daInvoice,
      obj.naResponsible, obj.idUser, obj.nuAmountTotal, obj.nuAmountFinal, obj.coCurrency,
      obj.daDispatch, obj.txComment, obj.nuPurchase, obj.coUser, obj.coPaymentCondition,
      obj.idPaymentCondition, obj.coAddressClient, obj.idAddressClient, obj.nuDiscount, obj.idCurrency,
      obj.idConversionType, obj.nuValueLocal, obj.nuAmountFinalConversion,
      obj.nuAmountTotalConversion, obj.coEnterprise,
      obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertInvoiceDetailBatch(arr: InvoiceDetail[]) {
    let insertStatement = "INSERT OR REPLACE INTO invoice_details(" +
      'id_invoice_detail,co_invoice_detail,co_invoice,id_invoice,co_product,' +
      'id_product,nu_amount_total,co_warehouse,id_warehouse,iva,' +
      'nu_discount_total,co_discount,id_discount,co_price_list,id_price_list,' +
      'co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idInvoiceDetail, obj.coInvoiceDetail, obj.coInvoice,
      obj.idInvoice, obj.coProduct,
      obj.idProduct, obj.nuAmountTotal, obj.coWarehouse, obj.idWarehouse, obj.iva,
      obj.nuDiscountTotal, obj.coDiscount, obj.idDiscount, obj.coPriceList, obj.idPriceList,
      obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertInvoiceDetailUnitBatch(arr: InvoiceDetailUnit[]) {
    let insertStatement = "INSERT OR REPLACE INTO invoice_detail_units(" +
      'id_invoice_detail_unit,co_invoice_detail_unit,co_invoice_detail,id_invoice_detail,co_product_unit,' +
      'id_product_unit,qu_invoice,co_enterprise,id_enterprise' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?,?)'

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idInvoiceDetailUnit, obj.coInvoiceDetailUnit,
      obj.coInvoiceDetail, obj.idInvoiceDetail, obj.coProductUnit,
      obj.idProductUnit, obj.quInvoice, obj.coEnterprise, obj.idEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertClientChannelOrderTypeBatch(arr: ClientChannelOrderType[]) {
    let insertStatement = 'INSERT OR REPLACE INTO client_channel_order_type (' +
      'id_client_channel_order_type, co_client_channel_order_type, id_client,' +
      'co_client, id_distribution_channel, co_distribution_channel,' +
      'id_order_type, co_order_type, id_enterprise,' +
      'co_enterprise' +
      ') VALUES (' +
      '?,?,?,?,?,?,?,?,?,?)';

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idClientChannelOrderType, obj.coClientChannelOrderType,
      obj.idClient, obj.coClient, obj.idDistributionChannel, obj.coDistributionChannel, obj.idOrderType,
      obj.coOrderType, obj.idEnterprise, obj.coEnterprise]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertOrderTypeProductStructureBatch(arr: OrderTypeProductStructure[]) {
    let insertStatement = 'INSERT OR REPLACE INTO order_type_product_structure (' +
      'id_order_type_product_structure,' +
      'co_order_type_product_structure,' +
      'id_order_type,' +
      'co_order_type,' +
      'id_product_structure,' +
      'co_product_structure,' +
      'id_enterprise,' +
      'co_enterprise' +
      ') VALUES (' +
      '?,?,?,?,?,?,?,?)';

    var statements = [];
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      statements.push([insertStatement, [obj.idOrderTypeProductStructure, obj.coOrderTypeProductStructure, obj.idOrderType,
      obj.coOrderType, obj.idProductStructure, obj.coProductStructure, obj.idEnterprise, obj.coEnterprise
      ]]);
    }

    return this.database.sqlBatch(statements).then(res => {
      // console.log(res);
    }).catch(e => {
      console.log(e);
    })
  }

  insertTransactionStatusesBatch(arr: TransactionStatuses[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO transaction_statuses(" +
      "id_transaction_status, da_transaction_statuses,id_transaction_type," +
      "co_transaction_type,co_transaction,id_transaction," +
      "id_status,co_status" +
      ") " +
      "VALUES(?,?,?,?,?,?,?,?)"

    for (var i = 0; i < arr.length; i++) {
      statements.push([insertStatement, [arr[i].idTransactionStatus, arr[i].daTransactionStatuses,
      arr[i].idTransactionType, arr[i].coTransactionType, arr[i].coTransaction, arr[i].idTransaction,
      arr[i].idStatus, arr[i].coStatus]])
    }

    return this.database.sqlBatch(statements).then(res => {
      console.log("insert transactionStatuses ready")
      return res;
    }).catch(e => {
      console.log(e);
    })
  }

  insertTransactionTypesBatch(arr: TransactionTypes[]) {

    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO transaction_types(" +
      "id_transaction_type,co_transaction_type,na_transaction_type" +
      ") " +
      "VALUES(?,?,?)"

    for (var i = 0; i < arr.length; i++) {
      statements.push([insertStatement, [arr[i].idTransactionType,
      arr[i].coTransactionType, arr[i].naTransactionType]])
    }

    return this.database.sqlBatch(statements).then(res => {
      console.log("insert TransactionTypes ready")
      return res;
    }).catch(e => {
      console.log(e);
    })
  }

  insertStatusesBatch(arr: Statuses[]) {
    var statements = [];
    let insertStatement = "INSERT OR REPLACE INTO statuses(" +
      "id_status, co_status ,na_status" +
      ") " +
      "VALUES(?,?,?)"

    for (var i = 0; i < arr.length; i++) {
      statements.push([insertStatement, [arr[i].idStatus, arr[i].coStatus, arr[i].naStatus]])
    }

    return this.database.sqlBatch(statements).then(res => {
      console.log("insert Statuses ready")
      return res;
    }).catch(e => {
      console.log(e);
    })
  }

  insertOrderBatch(arr: Orders[]) {
    return this.pedidosService.saveOrderBatch(this.database, arr)
  }

  insertOrderDetailBatch(arr: OrderDetail[]) {
    return this.pedidosService.saveOrderDetailBatch(this.database, arr)
  }
  insertOrderDetailUnitBatch(arr: OrderDetailUnit[]) {
    return this.pedidosService.saveOrderDetailUnitBatch(this.database, arr)
  }
  insertOrderDetailDiscountBatch(arr: OrderDetailDiscount[]) {
    return this.pedidosService.saveOrderDetailDiscountBatch(this.database, arr)
  }
  // En SynchronizationDBService
  insertCollectionBatch(arr: Collection[]) {
    return this.collectionService.saveCollectionBatch(this.database, arr);
  }
  insertReturnBatch(arr: Return[]) {
    return this.returnService.saveReturnBatch(this.database, arr);
  }
  insertClientStockBatch(arr: ClientStocks[]) {
    return this.clientStockService.saveClientStockBatch(this.database, arr);
  }
  insertDepositBatch(arr: Deposit[]) {
    return this.depositService.saveDepositBatch(this.database, arr);
  }

  deleteDataTable(arr: number[], nameTable: string, nameId: string) {
    let deleteStatement = "DELETE FROM " + nameTable + " WHERE " + nameId + " IN (" + arr + ")";
    this.database.executeSql(
      deleteStatement, []).then(res => {
        console.log("borrado exitoso " + nameTable)
      }).catch(e => {
        console.log(e);
      })
  }



  getStatusTranssacion(db: SQLiteObject, status: number, transaccionName: string) {
    let query = "SELECT o.id_order, st.na_status FROM transaction_statuses ts " +
      "JOIN orders o ON ts.id_transaction = o.id_order AND ts.co_transaction_type = ? " +
      "JOIN statuses st ON ts.id_status = st.id_status WHERE o.id_order = ? " +
      "ORDER BY ts.da_transaction_statuses limit 1";

    return db.executeSql(query, [status, transaccionName]).then(data => {
      let naStatus: string = "";
      naStatus = data.rows.length > 0 ? data.rows.item(0).na_status : "";
      return naStatus;
    });
  }
}
