import { Injectable, inject } from '@angular/core';

import { CurrencyEnterprise } from 'src/app/modelos/tables/currencyEnterprise';
import { GlobalConfigService } from '../globalConfig/global-config.service';
import { Observable } from 'rxjs';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite';
import { DateServiceService } from '../dates/date-service.service';
//import { DateServiceService } from '../dates/date-service.service';



@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  //injects  
  private globalConfig = inject(GlobalConfigService);
  private dateService = inject(DateServiceService);

  public multimoneda: any;
  public localCurrency!: CurrencyEnterprise;
  public hardCurrency!: CurrencyEnterprise;
  public currencyRelation: any;
  public localValue: any;

  public precision: number = 0;

  constructor(


  ) {
    this.precision = Number.parseInt(this.globalConfig.get('parteDecimal'));

  }

  setup(db: SQLiteObject): Promise<void> {
    if (this.hardCurrency != undefined && this.localCurrency != undefined) {
      return Promise.resolve();
    } else {
      /* Esta funcion se debe correr al inicializar un modulo que use este servicio.
        */
      //console.log("[CurrencyService] SETUP");
      var check: boolean;
      this.multimoneda = this.globalConfig.get("multiCurrency") === "true"
      if (this.multimoneda) {
        check = (this.localCurrency == null || this.hardCurrency == null
          || this.currencyRelation == null || this.localValue == null);
      } else {
        check = this.localCurrency == null;
      }
      if (check) {
        //console.log("[CurrencyService] Buscamos las variables en BD")
        this.queryLocalCurrency(db);
        if (this.multimoneda) {
          this.queryHardCurrency(db);
          this.queryCurrencyRelation(db);
          this.queryLocalValue(db);
        }
        //this.currencyTest();
        return Promise.resolve();
      } else {
        //console.log("[CurrencyService] Ya tenemos las variables")
        return Promise.resolve();
      }
    }

  }

  formatNumber(input: number) {
    // Formatea un número a la moneda local y con la precisión correcta
    this.precision = Number.parseInt(this.globalConfig.get('parteDecimal'));
    if (isNaN(input)) input = 0;

    // Validar precisión
    let precision = Number(this.precision);
    if (isNaN(precision) || precision < 0 || precision > 20) {
      precision = 2; // Valor por defecto seguro
    }

    return Intl.NumberFormat("es-VE", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(input);
  }

  toOppositeCurrency(coCurrency: string, amount: number) {
    //Convierte de una moneda a otra
    //console.log("[CurrencyService] toOppositeCurrency: " + coCurrency + " " + amount);
    if (this.multimoneda) {
      if (coCurrency === this.localCurrency.coCurrency) {
        return this.toHardCurrency(amount);
      } else {
        return this.toLocalCurrency(amount);
      }
    } else {
      return amount;
    }
  }

  toLocalCurrency(hardAmount: number): number {
    return (hardAmount * this.localValue) / this.currencyRelation;
  }

  toHardCurrency(localAmount: number): number {
    return (localAmount * this.currencyRelation) / this.localValue;
  }

  toLocalCurrencyByNuValueLocal(hardAmount: number, nuValueLocal: number): number {
    if (nuValueLocal == null)
      return 0;
    else
      return this.cleanFormattedNumber(this.formatNumber((hardAmount * nuValueLocal) / this.currencyRelation)); /* if (coTypeDoc == 'NC' || coTypeDoc == 'AB') {
      return nuValueLocal;
    } else {
      return (hardAmount * nuValueLocal) / this.currencyRelation;
    }
 */
  }

  toHardCurrencyByNuValueLocal(localAmount: number, nuValueLocal: number): number {
    if (nuValueLocal == null)
      return 0;
    else
      return this.cleanFormattedNumber(this.formatNumber((localAmount * this.currencyRelation) / nuValueLocal)); /* if (coTypeDoc == 'NC' || coTypeDoc == 'AB') {
      return nuValueLocal;
    } else {
      return (localAmount * this.currencyRelation) / nuValueLocal;
    } */

  }

  public cleanFormattedNumber(str: string): number {
    // Elimina espacios
    str = str.trim();
    // Elimina separador de miles (puntos)
    str = str.replace(/\./g, '');
    // Cambia la coma decimal por punto
    str = str.replace(/,/g, '.');
    // Convierte a número
    return Number(str);
  }



  async toLocalCurrencyByDate(db: SQLiteObject, hardAmount: number, date: string) {
    return this.getLocalValuebyDate(db, date).then((localValue) => {
      return (hardAmount * localValue) / this.currencyRelation;
    });
  }

  async toHardCurrencyByDate(db: SQLiteObject, localAmount: number, date: string) {
    return this.getLocalValuebyDate(db, date).then((localValue) => {
      return (localAmount * this.currencyRelation) / localValue;
    });
  }

  getLocalCurrency(): CurrencyEnterprise {
    return this.localCurrency;
  }

  getHardCurrency(): CurrencyEnterprise {
    return this.hardCurrency;
  }

  getLocalValue(): string {
    // devuelve localValue con el numero apropiado de decimales.
    return this.formatNumber(Number(this.localValue));
  }

  oppositeCoCurrency(coCurrency: string) {
    if (this.multimoneda) {
      if (coCurrency === this.localCurrency.coCurrency) {
        return this.hardCurrency.coCurrency;
      } else {
        return this.localCurrency.coCurrency;
      }
    } else {
      return "";
    }

  }

  getCurrency(coCurrency: string) {
    if (this.multimoneda) {
      if (coCurrency === this.localCurrency.coCurrency) {
        return this.localCurrency;
      } else {
        return this.hardCurrency;
      }
    } else {
      return this.localCurrency;
    }
  }

  getOppositeCurrency(coCurrency: string) {
    if (this.multimoneda) {
      if (coCurrency === this.hardCurrency.coCurrency) {
        return this.localCurrency;
      } else {
        return this.hardCurrency;
      }
    } else {
      return this.localCurrency;
    }

  }

  async getLocalValuebyDate(db: SQLiteObject, date: string) {
    //let isoDate = this.dateService.toISOString(date);
    //CABLE apestoso que probablemente tengamos que cambiar para clientes internacionales
    let isoDate = date + "T04:00:00.000+00:00";
    var selectStatement = "SELECT nu_value_local FROM conversion_types WHERE date_conversion = ? ORDER BY id_conversion_type DESC LIMIT 1";
    return db.executeSql(selectStatement, [isoDate]).then((result: any) => {
      var localValue = 0;
      if (result.rows.length > 0) {
        localValue = result.rows.item(0).nu_value_local;
      }
      return localValue;
    })
  }

  currencyTest() {
    //Para probar que todas las funciones y variables esten bien
    console.log("[CurrencyService] TESTIN");
    console.log("multicurrency: " + this.globalConfig.get("multiCurrency"));
    console.log("localCurrency:" + JSON.stringify(this.getLocalCurrency()));
    if (this.multimoneda) {
      console.log("hardCurrency:" + JSON.stringify(this.getHardCurrency()));
      console.log("currencyRelation: " + this.currencyRelation.toString());
      console.log("localValue: " + this.localValue.toString());

      console.log("100 " + this.getLocalCurrency().coCurrency + " = " + this.toHardCurrency(100).toString() + this.getHardCurrency().coCurrency);
      console.log("100 " + this.getHardCurrency().coCurrency + " = " + this.toLocalCurrency(100).toString() + this.getLocalCurrency().coCurrency);

    }


  }

  //========================= QUERIES =========================
  queryLocalCurrency(db: SQLiteObject) {
    var selectStatement = "SELECT * FROM currency_enterprises WHERE local_currency = 'true'";
    this.queryCurrency(db, selectStatement).then((c) => {
      if (c) {
        this.localCurrency = c
        localStorage.setItem("localCurrency", this.localCurrency.coCurrency)


      }


    });
  }

  queryHardCurrency(db: SQLiteObject) {
    var selectStatement = "SELECT * FROM currency_enterprises WHERE hard_currency = 'true'";
    this.queryCurrency(db, selectStatement).then((c) => {
      if (c) {
        this.hardCurrency = c
        localStorage.setItem("hardCurrency", this.hardCurrency.coCurrency)
      }


    });
  }

  async queryCurrency(db: SQLiteObject, selectStatement: string) {

    return db.executeSql(selectStatement, []).then((result: any) => {
      var currency: CurrencyEnterprise
      var c;
      if (result.rows.length > 0) {
        c = result.rows.item(0);
        currency = new CurrencyEnterprise(
          c.id_currency_enterprise,
          c.co_currency,
          c.id_currency,
          c.local_currency,
          c.hard_currency,
          c.co_enterprise,
          c.id_enterprise
        )
        return currency;
      } else {
        throw ("[CurrencyService] No llego data de moneda");
      }
    }).catch((error: any) => console.log(error))


  }

  async queryCurrencyRelation(db: SQLiteObject) {
    var selectStatement = "SELECT nu_exchange_rate FROM currency_relations ORDER BY id_currency_relation DESC LIMIT 1";
    //console.log("[CurrencyService] "+selectStatement);
    return db.executeSql(selectStatement, []).then((result: any) => {
      var relation: any;
      if (result.rows.length > 0) {
        relation = result.rows.item(0).nu_exchange_rate;
        this.currencyRelation = relation;

      }

    })
  }

  async queryLocalValue(db: SQLiteObject) {
    /*
  this.getLocalValuebyDate(db, this.dateService.onlyDateHoyISO()).then((localValue) => {
      this.localValue = localValue;
  });
  */

    var selectStatement = "SELECT nu_value_local FROM conversion_types ORDER BY date_conversion DESC LIMIT 1";
    return db.executeSql(selectStatement, []).then((result: any) => {
      var localValue: any;
      if (result.rows.length > 0) {
        localValue = result.rows.item(0).nu_value_local;
        //console.log("[CurrencyService] "+selectStatement);

        this.localValue = localValue;

      }

    })
  }
}
