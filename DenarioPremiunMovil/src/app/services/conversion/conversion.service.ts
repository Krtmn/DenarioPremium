import { Injectable } from '@angular/core';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({
  providedIn: 'root'
})
export class ConversionService {

  constructor() { }

  getTasaBCV(dbServ: SQLiteObject, idEnterprise: number) {

    let selectStatement = "SELECT ct.nu_value_local FROM conversion_types ct " +
      "JOIN conversion c ON ct.id_conversion = c.id_conversion " +
      "WHERE c.primary_currency = 'true' AND c.id_enterprise = ?";

    return dbServ.executeSql(selectStatement, [idEnterprise]).then(data => {
      console.log('Tasa BCV obtenida', data);
    })

  }

  getTasaParalelo(dbServ: SQLiteObject, idEnterprise: number) {

    let selectStatement = "SELECT ct.nu_value_local FROM conversion_types ct " +
      "JOIN conversion c ON ct.id_conversion = c.id_conversion " +
      "WHERE c.primary_currency = 'false' AND c.id_enterprise = ?";

    return dbServ.executeSql(selectStatement, [idEnterprise]).then(data => {
      console.log('Tasa Paralelo obtenida', data);
    })
  }

  getEnterprise(dbServ: SQLiteObject) {9

    let selectStatement = "SELECT id_enterprise, tx_name, tx_currency_code FROM enterprise";

    return dbServ.executeSql(selectStatement, []).then(data => {
      console.log('Empresa obtenida', data);
    })
  }
}