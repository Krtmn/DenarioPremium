import { inject, Injectable } from '@angular/core';
import { CurrencyService } from '../currency/currency.service';
import { DateServiceService } from '../dates/date-service.service';
import { GlobalConfigService } from '../globalConfig/global-config.service';
import { ServicesService } from '../services.service';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { Subject } from 'rxjs';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Currencies } from 'src/app/modelos/tables/currencies';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { EnterpriseService } from '../enterprise/enterprise.service';
import { Deposit, DepositCollect } from 'src/app/modelos/tables/deposit';
import { BankAccount } from 'src/app/modelos/tables/bankAccount';
import { CollectDeposit } from 'src/app/modelos/collect-deposit';
import { HistoryTransaction } from '../historyTransaction/historyTransaction';
import { ItemListaDepositos } from 'src/app/depositos/item-lista-depositos';
import { DEPOSITO_STATUS_NEW, DEPOSITO_STATUS_SAVED, DEPOSITO_STATUS_SENT, DEPOSITO_STATUS_TO_SEND } from 'src/app/utils/appConstants';
import { Return } from 'src/app/modelos/tables/return';

@Injectable({
  providedIn: 'root'
})
export class DepositService {

  public globalConfig = inject(GlobalConfigService);
  public services = inject(ServicesService);
  public dateServ = inject(DateServiceService);
  private currencyServices = inject(CurrencyService);
  public enterpriseServ = inject(EnterpriseService);
  public historyTransaction = inject(HistoryTransaction);


  private database!: SQLiteObject;
  public currencyList!: Currencies[];
  public currencySelected!: Currencies;
  public currencyConversion!: Currencies;
  public enterpriseList!: Enterprise[];
  public enterpriseSelected!: Enterprise;
  public deposit!: Deposit;
  public bankList!: BankAccount[];
  public bankSelected!: BankAccount;
  public cobrosDetails!: CollectDeposit[];
  public listDeposits: Deposit[] = [];
  public itemListaDepositos: ItemListaDepositos[] = [];

  public dateDeposit: string = "";
  public nuDocument: string = "";
  public txComment: string = "";
  public message: string = "";
  public multiCurrency: string = "";

  public daDocument: string = this.dateServ.hoyISOFullTime();;

  public showHeaderButtons: Boolean = false;
  public depositComponent: Boolean = false;
  public depositNewComponent: Boolean = false;
  public depositListComponent: Boolean = false;
  public disabledEnterprise: boolean = false;
  public disabledCurrency: boolean = false;
  public isSelectedBank: boolean = false;
  public disabledSaveButton: boolean = true;
  public disabledSendButton: boolean = true;
  public depositValid: boolean = false;
  public isSelected: boolean = false;
  public tabTotal: boolean = false;
  public hideDeposit: boolean = false;
  public userMustActivateGPS: boolean = true; //si la pongo en false puedes entrar al clickear rapido
  public saveOrExitOpen = false;

  public coordenadas = '';
  public fechaMayor: string = this.dateServ.hoyISO();
  public fechaMenor!: string;

  public backRoute = new Subject<string>;
  public showButtons = new Subject<Boolean>;
  public depositValidToSave = new Subject<Boolean>;
  public depositValidToSend = new Subject<Boolean>;

  public depositTags = new Map<string, string>([]);
  public depositTagsDenario = new Map<string, string>([]);

  public totalDeposit: number = 0;
  public parteDecimal: number = 0;
  public nuAmountDoc: number = 0;
  public nuAmountDocConversion: number = 0;

  public sendDeposit = new Subject<string>;

  public showConversion: boolean = true;
  public localCurrencyDefault: boolean = false;
  public currencyModule: any;

  public DEPOSITO_STATUS_NEW = DEPOSITO_STATUS_NEW;
  public DEPOSITO_STATUS_SAVED = DEPOSITO_STATUS_SAVED;
  public DEPOSITO_STATUS_TO_SEND = DEPOSITO_STATUS_TO_SEND;
  public DEPOSITO_STATUS_SENT = DEPOSITO_STATUS_SENT;

  public alertButtons = [
    /*     {
          text: '',
          role: 'cancel'
        }, */
    {
      text: '',
      role: 'confirm'
    },
  ];
  public alertButtonsSend = [
    {
      text: '',
      role: 'cancel'
    },
    {
      text: '',
      role: 'confirm'
    },
  ];


  constructor() {
    this.multiCurrency = this.globalConfig.get("multiCurrency");

  }


  getTags(dbServ: SQLiteObject) {
    return this.services.getTags(dbServ, "DEP", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.depositTags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      return this.services.getTags(dbServ, "DEN", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.depositTags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      return Promise.resolve(true);
    });
  
      
    });
  }
  getTagsDenario(dbServ: SQLiteObject) {
    return this.services.getTags(dbServ, "DEN", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.depositTagsDenario.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      this.alertButtonsSend[0].text = this.depositTagsDenario.get('DENARIO_BOTON_CANCELAR')!
      this.alertButtonsSend[1].text = this.depositTagsDenario.get('DENARIO_BOTON_ACEPTAR')!
      this.alertButtons[0].text = this.depositTagsDenario.get('DENARIO_BOTON_ACEPTAR')!
      return Promise.resolve(true);
    })
  }

  showBackRoute(route: string) {
    console.log('Back-Service: ' + route);
    this.backRoute.next(route);
  }

  showHeaderButtonsFunction(headerButtos: boolean) {
    this.showButtons.next(headerButtos);
  }

  onDepositValidToSave(valid: boolean) {
    console.log('returnLogicService: onReturnValid');
    this.depositValidToSave.next(valid);
  }

  onDepositValidToSend(validToSend: boolean) {
    console.log('returnLogicService: onReturnValidToSend');
    this.depositValidToSend.next(validToSend);
  }

  initServices(dbServ: SQLiteObject) {
    this.enterpriseServ.setup(dbServ).then(() => {
      this.disabledSaveButton = true;
      this.disabledSendButton = true;
      this.hideDeposit = false;
      this.depositValid = false;
      this.enterpriseList = this.enterpriseServ.empresas;
      this.enterpriseSelected = this.enterpriseList[0];
      this.parteDecimal = Number(this.globalConfig.get('parteDecimal'));
      this.disabledEnterprise = this.globalConfig.get('enterpriseEnabled') === 'true' ? false : true;
      this.disabledCurrency = this.globalConfig.get('multiCurrency') === 'true' ? false : true;
      this.userMustActivateGPS = this.globalConfig.get("userMustActivateGPS").toLowerCase() === 'true';
      if (this.globalConfig.get("currencyModule") == "true" ? true : false) {
        this.currencyModule = this.currencyServices.getCurrencyModule("dep");
        this.localCurrencyDefault = this.currencyModule.localCurrencyDefault.toString() === 'true' ? true : false;
        this.showConversion = this.currencyModule.showConversion.toString() === 'true' ? true : false;
        this.disabledCurrency = this.currencyModule.currencySelector.toString() === "true" ? false : true;

      }


      this.deposit = {
        idUser: Number(localStorage.getItem("idUser")),
        coUser: localStorage.getItem("coUser")!,
        idDeposit: null,
        coDeposit: this.dateServ.generateCO(0),
        daDeposit: this.dateDeposit,
        coBank: "",
        nuAccount: "",
        nuDocument: "",
        daDocument: this.daDocument,
        nuAmountDoc: 0,
        nuAmountDocConversion: 0,
        coCurrency: "",
        idEnterprise: this.enterpriseSelected.idEnterprise,
        coEnterprise: this.enterpriseSelected.coEnterprise,
        txComment: "",
        nuValueLocal: 0,
        idCurrency: 0,
        stDeposit: DEPOSITO_STATUS_NEW,
        stDelivery: DEPOSITO_STATUS_NEW,
        isEdit: true,
        isEditTotal: false,
        isSave: false,
        coordenada: this.coordenadas,
        collectionIds: [],
        depositCollect: [] as DepositCollect[]
      }


      this.getCurrencies(dbServ, this.deposit.idEnterprise).then(resp => {
        this.getBankAccounts(dbServ, this.deposit.idEnterprise, this.currencySelected.coCurrency).then(resp => {
          //ya tengo todo para iniciar el deposito
          this.getAllCollectsToDeposit(dbServ, this.deposit.coCurrency).then(resp1 => {
            this.getAllCollectsAnticipoToDeposit(dbServ, this.deposit.coCurrency).then(resp2 => {
              console.log(resp1.length);
              console.log(resp2.length);
            })
          })
        })
      })
    })
  }

  initOpenDeposit(dbServ: SQLiteObject) {
    return this.enterpriseServ.setup(dbServ).then(() => {
      this.bankSelected = {} as BankAccount;
      this.depositValid = false;
      this.enterpriseList = this.enterpriseServ.empresas;
      this.enterpriseSelected = this.enterpriseList[0];
      this.isSelectedBank = true;
      this.depositValid = true;

      this.onDepositValidToSave(true);
      return this.getCurrencies(dbServ, this.deposit.idEnterprise).then(resp => {
        for (var i = 0; i < this.currencyList.length; i++) {
          if (this.currencyList[i].idCurrency == this.deposit.idCurrency) {
            this.currencySelected = this.currencyList[i];
            i = this.currencyList.length;
            break;
          }
        }
        this.getBankAccounts(dbServ, this.deposit.idEnterprise, this.currencySelected.coCurrency).then(resp => {
          //ya tengo todo para iniciar el deposito
          for (var i = 0; i < this.bankList.length; i++) {
            if (this.bankList[i].coBank == this.deposit.coBank) {
              this.bankSelected = this.bankList[i];
              i = this.bankList.length;
              break;
            }
          }

          return Promise.resolve(true);
          /* this.getAllCollectsToDeposit(this.deposit.coCurrency).then(resp1 => {
            this.getAllCollectsAnticipoToDeposit(this.deposit.coCurrency).then(resp2 => {
              return Promise.resolve(true)
            })
          }) */
        })
      })
    })
  }

  updateBankAccounts(dbServ: SQLiteObject) {
    return this.getBankAccounts(dbServ, this.deposit.idEnterprise, this.currencySelected.coCurrency).then(resp => {
      //ya tengo todo para iniciar el deposito
      for (var i = 0; i < this.bankList.length; i++) {
        if (this.bankList[i].coBank == this.deposit.coBank) {
          this.bankSelected = this.bankList[i];
          i = this.bankList.length;
          break;
        }
      }

      return Promise.resolve(true);
      /* this.getAllCollectsToDeposit(this.deposit.coCurrency).then(resp1 => {
        this.getAllCollectsAnticipoToDeposit(this.deposit.coCurrency).then(resp2 => {
          return Promise.resolve(true)
        })
      }) */
    })
  }

  resetDeposit() {
    this.depositValid = false;
    this.enterpriseList = this.enterpriseServ.empresas;
    this.enterpriseSelected = this.enterpriseList[0];
    this.parteDecimal = Number(this.globalConfig.get('parteDecimal'));
    this.disabledEnterprise = this.globalConfig.get('enterpriseEnabled') === 'true' ? false : true;
    this.disabledCurrency = this.globalConfig.get('multiCurrency') === 'true' ? false : true;
    this.userMustActivateGPS = this.globalConfig.get("userMustActivateGPS").toLowerCase() === 'true';

    this.deposit = {
      idUser: Number(localStorage.getItem("idUser")),
      coUser: localStorage.getItem("coUser")!,
      idDeposit: null,
      coDeposit: this.dateServ.generateCO(0),
      daDeposit: this.dateDeposit,
      coBank: "",
      nuAccount: "",
      nuDocument: "",
      daDocument: this.daDocument,
      nuAmountDoc: 0,
      nuAmountDocConversion: 0,
      coCurrency: "",
      idEnterprise: this.enterpriseSelected.idEnterprise,
      coEnterprise: this.enterpriseSelected.coEnterprise,
      txComment: "",
      nuValueLocal: 0,
      idCurrency: 0,
      stDeposit: 0,
      stDelivery: 0,
      isEdit: true,
      isEditTotal: false,
      isSave: false,
      coordenada: this.coordenadas,
      collectionIds: [],
      depositCollect: [] as DepositCollect[]
    }

    return Promise.resolve(true);
  }


  convertirMonto(monto: number) {
    if (this.currencySelected.localCurrency.toString() === "true") {
      return (monto / this.deposit.nuValueLocal).toFixed(this.parteDecimal);
    } else {
      return (monto * this.deposit.nuValueLocal).toFixed(this.parteDecimal);
    }
  }

  totalizarDeposito() {
    this.deposit.nuAmountDoc = 0;
    this.deposit.nuAmountDocConversion = 0;
    let total = 0;
    if (this.deposit && Array.isArray(this.deposit.depositCollect)) {
      for (const dc of this.deposit.depositCollect) {
        const val = Number((dc as any).nuAmountTotal ?? (dc as any).nu_amount_total ?? 0);
        total += isNaN(val) ? 0 : val;
      }
    }

    const factor = Math.pow(10, Number(this.parteDecimal ?? 2));
    this.deposit.nuAmountDoc = Math.round(total * factor) / factor;
    //this.nuAmountDoc = this.deposit.nuAmountDoc;

    // convertir y guardar la conversión tanto en el objeto deposit como en la variable de servicio
    const conv = Number(this.convertirMonto(this.deposit.nuAmountDoc));
    this.deposit.nuAmountDocConversion = isNaN(conv) ? 0 : conv;
    //this.nuAmountDocConversion = this.deposit.nuAmountDocConversion;
  }

  //querys

  getCurrencies(dbServ: SQLiteObject, idEnterprise: number) {
    this.database = dbServ
    return this.database.executeSql('SELECT ' +
      'id_currency_enterprise as idCurrencyEnterprise, ' +
      'id_currency as idCurrency, ' +
      'co_currency as coCurrency, ' +
      'local_currency as localCurrency, ' +
      'hard_currency as hardCurrency, ' +
      'co_enterprise as coEnterprise, ' +
      'id_enterprise as idEnterprise ' +
      'FROM currency_enterprises WHERE id_enterprise = ?',
      [idEnterprise]).then(data => {
        this.currencyList = [] as Currencies[];
        const isTrue = (v: any) => v === true || String(v ?? '').toLowerCase() === 'true';
        const currencyModuleEnabled = isTrue(this.globalConfig.get('currencyModule'));
        for (let i = 0; i < data.rows.length; i++) {
          const item = data.rows.item(i);
          //currencies.push(item);
          this.currencyList.push(item);
          if (!currencyModuleEnabled) {
            if (this.enterpriseSelected.coCurrencyDefault == item.coCurrency) {
              this.currencySelected = item;
              this.deposit.idCurrency = item.idCurrency;
              this.deposit.coCurrency = item.coCurrency;
            } else {
              this.currencyConversion = item;
            }
          }
        }

        if (currencyModuleEnabled) {
          if (this.localCurrencyDefault) {
            let currency = this.currencyList.find(c => ((c?.coCurrency ?? '').toString() === this.currencyServices.getLocalCurrency().coCurrency));
            this.currencySelected = currency!;
            this.deposit.idCurrency = currency!.idCurrency;
            this.deposit.coCurrency = currency!.coCurrency;
          } else {
            let currency = this.currencyList.find(c => ((c?.coCurrency ?? '').toString() === this.currencyServices.getHardCurrency().coCurrency));
            this.currencySelected = currency!;
            this.deposit.idCurrency = currency!.idCurrency;
            this.deposit.coCurrency = currency!.coCurrency;
          }
        }
        return Promise.resolve(true);
      }).catch(e => {
        console.log(e);
      })
  }

  getBankAccounts(dbServ: SQLiteObject, idEnterprise: number, coCurrency: string) {
    let selectStatement = 'SELECT ' +
      'bank_accounts.id_bank_account as idBankAccount,' +
      'bank_accounts.co_bank as coBank,' +
      'bank_accounts.id_bank as idBank,' +
      'bank_accounts.co_account as coAccount,' +
      'bank_accounts.nu_account as nuAccount,' +
      'bank_accounts.co_type as coType,' +
      'bank_accounts.co_currency as coCurrency,' +
      'bank_accounts.id_currency as idCurrency,' +
      'bank_accounts.co_enterprise as coEnterprise,' +
      'bank_accounts.id_enterprise as idEnterprise,' +
      'banks.na_bank as nameBank ' +
      'FROM bank_accounts, banks ' +
      'WHERE bank_accounts.id_enterprise = ? ' +
      'AND bank_accounts.co_currency = ? ' +
      'AND bank_accounts.co_bank = banks.co_bank ' +
      'AND banks.id_enterprise = ?';
    this.database = dbServ;
    return this.database.executeSql(selectStatement,
      [idEnterprise, coCurrency, idEnterprise]).then(data => {
        this.bankList = [] as BankAccount[];
        for (let i = 0; i < data.rows.length; i++) {
          const item = data.rows.item(i);
          //currencies.push(item);
          this.bankList.push(item);
        }
        return Promise.resolve(true);
      }).catch(e => {
        console.log(e);
      })
  }


  getAllCollectsToDeposit(dbServ: SQLiteObject, coCurrency: string) {
    this.database = dbServ;
    /*  let selectStatement = "SELECT DISTINCT(c.co_collection), c.*, cd.co_document, " +
       " (SELECT SUM(cp2.nu_amount_partial) FROM collection_payments cp2 WHERE cp2.co_collection =" +
       " c.co_collection AND cp2.co_payment_method <> 'de' AND cp2.co_payment_method <> 'tr' AND cp2.co_payment_method <> 'ot') as total_deposit," +
       " (SELECT SUM(cp2.nu_amount_partial_conversion) FROM collection_payments cp2 WHERE cp2.co_collection =" +
       " c.co_collection AND cp2.co_payment_method <> 'de' AND cp2.co_payment_method <> 'tr' AND cp2.co_payment_method <> 'ot') as total_deposit_conversion" +
       " FROM collections c, collection_payments cp LEFT OUTER JOIN collection_details cd ON c.co_collection = cd.co_collection" +
       " WHERE c.co_currency = ? AND c.st_collection <> 0 AND c.co_collection = cp.co_collection AND cp.co_payment_method <> 'de'" +
       " AND cp.co_payment_method <> 'tr' AND cd.co_type_doc <> 'CR' and c.id_collection <> 0" +
       " AND c.co_collection NOT IN (SELECT dc.co_collection FROM deposit_collects dc) GROUP BY c.co_collection"; */

    let selectStatement =
      "SELECT DISTINCT(c.co_collection), c.*, cd.co_document, " +
      " (SELECT SUM(cp2.nu_amount_partial) FROM collection_payments cp2 WHERE cp2.co_collection = c.co_collection AND cp2.co_payment_method <> 'de' AND cp2.co_payment_method <> 'tr' AND cp2.co_payment_method <> 'ot') AS total_deposit, " +
      " (SELECT SUM(cp2.nu_amount_partial_conversion) FROM collection_payments cp2 WHERE cp2.co_collection = c.co_collection AND cp2.co_payment_method <> 'de' AND cp2.co_payment_method <> 'tr' AND cp2.co_payment_method <> 'ot') AS total_deposit_conversion " +
      " FROM collections c " +
      " JOIN collection_payments cp ON c.co_collection = cp.co_collection " +
      " LEFT OUTER JOIN collection_details cd ON c.co_collection = cd.co_collection " + // <-- corregido aquí
      " WHERE c.co_currency = ? AND c.st_delivery <> 0 " +
      " AND cp.co_payment_method <> 'de' AND cp.co_payment_method <> 'tr' " +
      " AND cd.co_type_doc <> 'CR' AND c.id_collection <> 0 " +
      " AND c.co_collection NOT IN (SELECT dc.co_collection FROM deposit_collects dc) " +
      " GROUP BY c.co_collection ORDER BY c.co_collection DESC";

    return this.database.executeSql(selectStatement,
      [coCurrency]).then(data => {
        this.cobrosDetails = [] as CollectDeposit[];
        for (var i = 0; i < data.rows.length; i++) {
          const item = data.rows.item(i);
          item.da_collection = this.normalizeDaDeposit(item.da_collection)
          this.cobrosDetails.push(item);
        }
        return Promise.resolve(data.rows);
      }).catch(e => {
        console.log(e);
      })
  }

  getAllCollectsAnticipoToDeposit(dbServ: SQLiteObject, coCurrency: string) {
    this.database = dbServ
   /*  let selectStatement = "SELECT DISTINCT(c.co_collection), c.*, (SELECT SUM(cp2.nu_amount_partial) FROM collection_payments cp2 WHERE " +
      "cp2.co_collection = c.co_collection AND cp2.co_payment_method <> 'de' AND cp2.co_payment_method <> 'tr' AND cp2.co_payment_method <> 'ot') as total_deposit " +
      "FROM collections c, collection_payments cp " +
      "WHERE c.co_currency = ? AND c.st_collection <> 0 AND c.co_collection = cp.co_collection AND cp.co_payment_method <> 'de' " +
      "AND cp.co_payment_method <> 'tr' AND c.id_collection <> 0 AND c.co_type = '1' " +
      "AND c.co_collection NOT IN (SELECT dc.co_collection FROM deposit_collects dc) GROUP BY c.co_collection"; */3

    let selectStatement =
      "SELECT c.co_collection, c.*, " +
      "  (SELECT SUM(cp2.nu_amount_partial) " +
      "   FROM collection_payments cp2 " +
      "   WHERE cp2.co_collection = c.co_collection " +
      "     AND cp2.co_payment_method NOT IN ('de', 'tr', 'ot')) AS total_deposit, " +
      "  (SELECT SUM(cp2.nu_amount_partial_conversion) " +
      "   FROM collection_payments cp2 " +
      "   WHERE cp2.co_collection = c.co_collection " +
      "     AND cp2.co_payment_method NOT IN ('de', 'tr', 'ot')) AS total_deposit_conversion " +
      "FROM collections c " +
      "INNER JOIN collection_payments cp ON c.co_collection = cp.co_collection " +
      "WHERE c.co_currency = ? " +
      "  AND c.st_collection <> 0 " +
      "  AND cp.co_payment_method NOT IN ('de', 'tr') " +
      "  AND c.id_collection <> 0 " +
      "  AND c.co_type = '1' " +
      "  AND c.co_collection NOT IN (SELECT dc.co_collection FROM deposit_collects dc) " +
      "GROUP BY c.co_collection";

    return this.database.executeSql(selectStatement,
      [coCurrency]).then(data => {
        for (var i = 0; i < data.rows.length; i++) {
          const item = data.rows.item(i);
          item.da_collection = this.normalizeDaDeposit(item.da_collection)
          this.cobrosDetails.push(item);
        }
        return Promise.resolve(data.rows);
      }).catch(e => {
        console.log(e);
      })
  }

  deleteDepositsBatch(dbServ: SQLiteObject, deposits: Deposit[]) {
    let queries: any[] = [];
    const deleteStatement = "DELETE FROM deposits WHERE co_deposit = ?";
    const deleteDetailsStatement = "DELETE FROM deposit_collects WHERE co_deposit = ?";

    for (let i = 0; i < deposits.length; i++) {
      let coDeposit = deposits[i].coDeposit;
      queries.push([deleteDetailsStatement, [coDeposit]]);
      queries.push([deleteStatement, [coDeposit]]);
    }
    return dbServ.sqlBatch(queries).then(() => {
      console.log("[Deposit Service] deleteDepositsBatch exitoso");
    }).catch(error => {
      console.log("[Deposit Service] Error al ejecutar deleteDepositsBatch.");
      console.log(error);
    });
  }

  async saveDepositBatch(dbServ: SQLiteObject, deposits: Deposit[]) {
    this.database = dbServ;

    const insertDeposit = 'INSERT OR REPLACE INTO deposits (' +
      'id_deposit,' +
      'co_deposit,' +
      'da_deposit,' +
      'co_bank,' +
      'nu_account,' +
      'nu_document, ' +
      'da_document, ' +
      'nu_amount_doc, ' +
      'co_currency, ' +
      'id_enterprise, ' +
      'co_enterprise, ' +
      'st_deposit, ' +
      'st_delivery, ' +
      'tx_comment, ' +
      'nu_amount_doc_conversion, ' +
      'nu_value_local, ' +
      'id_currency,' +
      'coordenada' +
      ') VALUES (' +
      '?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

    const insertDepositCollect = 'INSERT OR REPLACE INTO deposit_collects (' +
      'id_deposit_collect,' +
      'co_deposit,' +
      'co_collection, ' +
      'id_collection, ' +
      'co_document, ' +
      'nu_amount_total, ' +
      'nu_total_deposit' +
      ') VALUES (' +
      '?,?,?,?,?,?,?)';

    // Array para juntar todos los queries de todos los depósitos
    let allQueries: any[] = [];

    // Procesa cada depósito secuencialmente para evitar condiciones de carrera
    for (const deposit of deposits) {
      // Queries locales para este depósito
      let queries: any[] = [];

      // Insert principal
      queries.push([insertDeposit, [
        deposit.idDeposit,
        deposit.coDeposit,
        deposit.daDeposit,
        deposit.coBank,
        deposit.nuAccount,
        deposit.nuDocument,
        deposit.daDocument,
        deposit.nuAmountDoc,
        deposit.coCurrency,
        deposit.idEnterprise,
        deposit.coEnterprise,
        deposit.stDeposit,
        deposit.stDelivery,
        deposit.txComment,
        deposit.nuAmountDocConversion,
        deposit.nuValueLocal,
        deposit.idCurrency,
        deposit.coordenada
      ]]);

      // Si hay collectionIds, consulta y arma los queries de deposit_collects
      if (Array.isArray(deposit.collectionIds) && deposit.collectionIds.length > 0) {
        const placeholders = deposit.collectionIds.map(() => '?').join(',');
        const selectCollections = `
        SELECT c.co_collection as coCollection,
               c.id_collection as idCollection,
               c.nu_amount_total as nuAmountTotal,
               c.nu_amount_final as nuAmountFinal,
               cd.co_document as coDocument
        FROM collections c
        JOIN collection_details cd ON c.co_collection = cd.co_collection
        WHERE c.id_collection IN (${placeholders})
      `;
        try {
          const collectionsResult = await dbServ.executeSql(selectCollections, deposit.collectionIds);
          for (let i = 0; i < collectionsResult.rows.length; i++) {
            const row = collectionsResult.rows.item(i);
            queries.push([insertDepositCollect, [
              0,
              deposit.coDeposit,
              row.coCollection,
              row.idCollection,
              row.coDocument,
              row.nuAmountTotal,
              row.nuAmountFinal
            ]]);
          }
        } catch (e) {
          console.log('Error al consultar collections:', e);
        }
      }

      // Agrega los queries de este depósito al array global
      allQueries = allQueries.concat(queries);
    }

    // Ejecuta el batch con todos los queries armados
    return dbServ.sqlBatch(allQueries).then(() => {
      return Promise.resolve(true);
    }).catch(e => {
      console.log("Error al ejecutar saveDepositBatch:", e);
      return Promise.reject(e);
    });
  }

  saveDeposit(dbServ: SQLiteObject, deposit: Deposit) {
    let deleteStatementDeposit = 'DELETE FROM deposits WHERE co_deposit = ?';
    let deleteStatementDepositCollect = 'DELETE FROM deposit_collects WHERE co_deposit = ?';
    this.database.executeSql(deleteStatementDepositCollect, [deposit.coDeposit]);
    this.database.executeSql(deleteStatementDeposit, [deposit.coDeposit]);

    this.database = dbServ
    let insertStatement = 'INSERT OR REPLACE INTO deposits (' +
      'id_deposit,' +
      'co_deposit,' +
      'da_deposit,' +
      'co_bank,' +
      'nu_account,' +
      'nu_document, ' +
      'da_document, ' +
      'nu_amount_doc, ' +
      'co_currency, ' +
      'id_enterprise, ' +
      'co_enterprise, ' +
      'st_deposit, ' +
      'st_delivery, ' +
      'tx_comment, ' +
      'nu_amount_doc_conversion, ' +
      'nu_value_local, ' +
      'id_currency,' +
      'coordenada' +
      ') VALUES (' +
      '?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    return this.database.executeSql(insertStatement,
      [
        0,
        deposit.coDeposit,
        deposit.daDeposit,
        deposit.coBank,
        deposit.nuAccount,
        deposit.nuDocument,
        deposit.daDocument,
        deposit.nuAmountDoc,
        deposit.coCurrency,
        deposit.idEnterprise,
        deposit.coEnterprise,
        deposit.stDeposit,
        deposit.stDelivery,
        deposit.txComment,
        deposit.nuAmountDocConversion,
        deposit.nuValueLocal,
        deposit.idCurrency,
        deposit.coordenada
      ]
    ).then(data => {
      console.log("deposit INSERT", data);
      return this.saveDepositCollect(deposit.depositCollect).then(r => {
        return Promise.resolve(true);
      })
    }).catch(e => {
      console.log(e);
    })
  }

  saveDepositCollect(depositCollect: DepositCollect[]) {
    let statementsDepositCollects = [];
    let insertStatement = 'INSERT OR REPLACE INTO deposit_collects (' +
      'id_deposit_collect,' +
      'co_deposit_collect,' +
      'co_deposit,' +
      'co_collection, ' +
      'id_collection, ' +
      'co_document, ' +
      'nu_amount_total, ' +
      'nu_total_deposit' +
      ') VALUES (' +
      '?,?,?,?,?,?,?,?)';

    for (var i = 0; i < depositCollect.length; i++) {
      statementsDepositCollects.push([insertStatement, [
        0,
        depositCollect[i].coDepositCollect,
        depositCollect[i].coDeposit,
        depositCollect[i].coCollection,
        depositCollect[i].idCollection,
        depositCollect[i].coDocument,
        depositCollect[i].nuAmountTotal,
        depositCollect[i].nuTotalDeposit
      ]]);
    }

    return this.database.sqlBatch(statementsDepositCollects).then(res => {
      console.log("DEPOSIT_COLLECTS INSERT", res);
      return Promise.resolve(true);
    }).catch(e => {
      console.log(e);
    })
  }

  getDeposit(dbServ: SQLiteObject, coDeposit: string) {
    return dbServ.executeSql(
      'SELECT * FROM deposits WHERE co_deposit = ?', [coDeposit
    ]).then(res => {
      let deposit = {} as Deposit;
      if (res.rows.length > 0) {

        deposit.coDeposit = res.rows.item(0).co_deposit;
        deposit.daDeposit = res.rows.item(0).da_deposit;
        deposit.coBank = res.rows.item(0).co_bank;
        deposit.nuAccount = res.rows.item(0).nu_account;
        deposit.nuDocument = res.rows.item(0).nu_document;
        deposit.daDocument = res.rows.item(0).da_document;
        deposit.nuAmountDoc = res.rows.item(0).nu_amount_doc;
        deposit.nuAmountDocConversion = res.rows.item(0).nu_amount_doc_conversion;
        deposit.coCurrency = res.rows.item(0).co_currency;
        deposit.idEnterprise = res.rows.item(0).id_enterprise;
        deposit.coEnterprise = res.rows.item(0).co_enterprise;
        deposit.txComment = res.rows.item(0).tx_comment;
        deposit.nuValueLocal = res.rows.item(0).nu_value_local;
        deposit.idCurrency = res.rows.item(0).id_currency;
        deposit.stDeposit = res.rows.item(0).st_deposit;
        deposit.stDelivery = res.rows.item(0).st_delivery;
        deposit.isEdit = false;
        deposit.isEditTotal = false;
        deposit.isSave = false;
        deposit.coordenada = res.rows.item(0).coordenada;
        deposit.depositCollect = [] as DepositCollect[];

      }
      return deposit;
    }).catch(e => {
      let deposit = {} as Deposit;
      console.log(e);
      return deposit;
    })
  }

  getDepositCollect(dbServ: SQLiteObject, coDeposit: string) {
    let selectStatement =
      'SELECT * ' +
      'FROM deposit_collects dc JOIN collections c ON dc.co_collection = c.co_collection WHERE dc.co_deposit = ?'
    return dbServ.executeSql(selectStatement, [coDeposit]).then(res => {
      this.deposit == undefined ? this.deposit = {} as Deposit : null;
      this.deposit.depositCollect = [] as DepositCollect[];
      let depositCollect = {} as DepositCollect
      let item;
      for (var i = 0; i < res.rows.length; i++) {
        depositCollect.idDepositCollect = res.rows.item(i).id_deposit_collect;
        depositCollect.coDepositCollect = res.rows.item(i).co_deposit_collect;
        depositCollect.coDeposit = res.rows.item(i).co_deposit;
        depositCollect.nuAmountTotal = res.rows.item(i).nu_amount_total;
        depositCollect.nuTotalDeposit = res.rows.item(i).nu_total_deposit;
        depositCollect.coCollection = res.rows.item(i).id_collection;
        depositCollect.idCollection = res.rows.item(i).co_collection;
        this.deposit.depositCollect.push(depositCollect);
      }
      this.cobrosDetails = [] as CollectDeposit[];
      for (var i = 0; i < res.rows.length; i++) {
        item = res.rows.item(i)
        item.isSelected = this.deposit.stDelivery == this.DEPOSITO_STATUS_SAVED || this.deposit.stDelivery == this.DEPOSITO_STATUS_SENT || this.deposit.stDelivery == null ? true : false;
        item.da_collection = this.normalizeDaDeposit(item.da_collection)
        this.cobrosDetails.push(item);
      }
      return this.deposit;
    }).catch(e => {
      this.deposit.depositCollect = [] as DepositCollect[];
      console.log(e);
      return this.deposit;
    })
  }

  getIdsDepositCollect(dbServ: SQLiteObject, coDeposit: string) {
    return dbServ.executeSql(
      'SELECT id_collection FROM deposit_collects WHERE co_deposit = ?', [coDeposit
    ]).then(res => {
      let collectionIds = [];
      for (var i = 0; i < res.rows.length; i++) {
        collectionIds.push(res.rows.item(i).id_collection)
      }
      //collection.idCollection = res.rows.item(0).id_collection;
      return collectionIds;


    }).catch(e => {
      let deposit = {} as Deposit;
      console.log(e);
      return deposit;
    })
  }

  getAllDeposits(dbServ: SQLiteObject) {

    return dbServ.executeSql(
      'SELECT ' +
      'id_deposit as idDeposit, ' +
      'co_deposit as coDeposit, ' +
      'da_deposit as daDeposit, ' +
      'co_bank as coBank, ' +
      'id_bank as idBank, ' +
      'nu_account as nuAccount, ' +
      'nu_document as nuDocument, ' +
      'da_document as daDocument, ' +
      'nu_amount_doc as nuAmountDoc, ' +
      'id_currency as idCurrenty, ' +
      'co_currency as coCurrency,' +
      'id_enterprise as idEnterprise,' +
      'co_enterprise as coEnterprise,' +
      'st_deposit as stDeposit,' +
      'st_delivery as stDelivery,' +
      'tx_comment as txComment,' +
      'nu_value_local as nuValueLocal,' +
      'nu_amount_doc as nuAmountDoc, ' +
      'coordenada as coordenada ' +
      'FROM deposits ORDER BY st_delivery DESC, da_deposit DESC, st_deposit ASC, id_deposit DESC ', []).then(async res => {
        let promises: Promise<void>[] = [];

        this.listDeposits = [] as Deposit[];
        this.itemListaDepositos = [] as ItemListaDepositos[];

        for (var i = 0; i < res.rows.length; i++) {
          let item = res.rows.item(i);
          this.listDeposits.push(item);
          let p = this.historyTransaction.getStatusTransaction(dbServ, 6, item.idDeposit!).then(status => {


            item.stDelivery == null ? 0 : item.stDelivery;
            if (item.idDeposit == 0) {
              item.stDeposit == this.DEPOSITO_STATUS_SAVED ? status = 'Guardado' : status;
              item.stDeposit == this.DEPOSITO_STATUS_TO_SEND ? status = 'Por Enviar' : status;
            }

            const itemListaDeposit: ItemListaDepositos = {
              idDeposit: item.idDeposit ?? 0,
              coDeposit: item.coDeposit,
              stDeposit: item.stDeposit,
              stDelivery: item.stDelivery,
              daDeposit: this.normalizeDaDeposit(item.daDeposit),
              naStatus: status,
              nuAmountDoc: item.nuAmountDoc.toFixed(this.parteDecimal),
              coCurrency: item.coCurrency,
              coBank: item.coBank
            };
            this.itemListaDepositos.push(itemListaDeposit);
          });

          promises.push(p);

        }
        await Promise.all(promises);

        return this.listDeposits;
      }).catch(e => {
        this.listDeposits = [] as Deposit[];
        console.log(e);
        return this.listDeposits;
      })
  }

  deleteDeposit(dbServ: SQLiteObject, coDeposit: string) {
    return dbServ.executeSql(
      'DELETE FROM deposits WHERE co_deposit = ?', [coDeposit
    ]).then(res => {
      console.log("DELETED DEPOSIT", res);
      return Promise.resolve(this.deleteDepositCollect(dbServ, coDeposit));
    }).catch(e => {
      console.log(e);
      return Promise.resolve(false);
    })
  }
  deleteDepositCollect(dbServ: SQLiteObject, coDeposit: string) {
    return dbServ.executeSql(
      'DELETE FROM deposit_collects WHERE co_deposit = ?', [coDeposit
    ]).then(res => {
      console.log("DELETED DEPOSIT_COLLECT", res);
      return Promise.resolve(true);
    }).catch(e => {
      console.log(e);
      return Promise.resolve(false);
    })
  }

  getCurrencyConversion(coCurrency: string) {
    this.currencyConversion = this.currencyServices.getOppositeCurrency(coCurrency);
  }

  private normalizeDaDeposit(value: string): string {
    if (!value) {
      return value;
    }

    // Formato esperado: YYYY-MM-DD HH:mm:ss
    // Si viene como ISO con zona: YYYY-MM-DDTHH:mm:ss.sss+00:00
    if (value.includes('T')) {
      return value.substring(0, 19).replace('T', ' ');
    }

    // Si solo trae fecha, agrega hora
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value} 00:00:00`;
    }

    // Si trae minutos sin segundos, agrega segundos
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) {
      return `${value}:00`;
    }

    return value;
  }

}
