import { inject, Injectable } from '@angular/core';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { EnterpriseService } from '../enterprise/enterprise.service';
import { Conversion } from 'src/app/modelos/tables/conversion';

@Injectable({
  providedIn: 'root'
})
export class ConversionService {

  public synchronizationServices = inject(SynchronizationDBService);
  private enterpriseServ = inject(EnterpriseService);

  public enterpriseList: Enterprise[] = [];

  constructor() {
  }

  getTasaBCV(idEnterprise: number) {

    const dbServ = this.synchronizationServices.getDatabase();

    let selectStatement = "SELECT ct.nu_value_local FROM conversion_types ct " +
      "JOIN conversion c ON ct.id_conversion = c.id_conversion " +
      "WHERE c.primary_currency == 1 AND c.id_enterprise = ? ORDER BY ct.date_conversion DESC LIMIT 1";
    return dbServ.executeSql(selectStatement, [idEnterprise]).then(data => {
      console.log('Tasa BCV obtenida', data);
      return data.rows.item(0).nu_value_local;
    })

  }

  getTasaParalelo(idEnterprise: number) {
    const dbServ = this.synchronizationServices.getDatabase();
    let selectStatement = "SELECT ct.nu_value_local FROM conversion_types ct " +
      "JOIN conversion c ON ct.id_conversion = c.id_conversion " +
      "WHERE c.primary_currency == 0 AND c.id_enterprise = ? ORDER BY ct.date_conversion DESC LIMIT 1";
    return dbServ.executeSql(selectStatement, [idEnterprise]).then(data => {
      console.log('Tasa Paralelo obtenida', data);
      return data.rows.item(0).nu_value_local;
    })
  }


  getRates(idEnterprise: number) {
    const dbServ = this.synchronizationServices.getDatabase();
    let selectStatement = "SELECT * FROM conversion c WHERE c.primary_currency == 0 AND c.id_enterprise = ? ORDER BY c.id_conversion ASC";
    return dbServ.executeSql(selectStatement, [idEnterprise]).then(data => {
      console.log('Tasas obtenidas', data);
      let rates: Conversion[] = [];
      for (var i = 0; i < data.rows.length; i++) {
        rates.push({
          idConversion: data.rows.item(i).id_conversion,
          coConversion: data.rows.item(i).co_conversion,
          naConversion: data.rows.item(i).na_conversion,
          primaryCurrency: data.rows.item(i).primary_currency,
          idEnterprise: data.rows.item(i).id_enterprise,
        });
      }
      return rates;
    })
  }

  getEnterprise() {
    return this.enterpriseServ.setup(this.synchronizationServices.getDatabase()).then(() => {
      this.enterpriseList = this.enterpriseServ.empresas;
      return this.enterpriseList;
    });
  }

  getRate(idConversion: number, idEnterprise: number) {
    const dbServ = this.synchronizationServices.getDatabase();
    let selectStatement = "SELECT ct.nu_value_local FROM conversion_types ct " +
      "WHERE ct.id_conversion = ? AND ct.id_enterprise = ? ORDER BY ct.date_conversion DESC LIMIT 1";

    return dbServ.executeSql(selectStatement, [idConversion, idEnterprise]).then(data => {
      console.log('Tasa Paralelo obtenida', data);
      return data.rows.item(0).nu_value_local;
    })
  }
}