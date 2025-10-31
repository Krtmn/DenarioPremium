import { inject, Injectable } from '@angular/core';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { EnterpriseService } from '../enterprise/enterprise.service';

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
      "WHERE c.primary_currency = 1 AND c.id_enterprise = ? ORDER BY ct.date_conversion DESC LIMIT 1";

    return dbServ.executeSql(selectStatement, [1]).then(data => {
      console.log('Tasa BCV obtenida', data);
      return data.rows.item(0).nu_value_local;
    })

  }

  getTasaParalelo(idEnterprise: number) {
    const dbServ = this.synchronizationServices.getDatabase();
    let selectStatement = "SELECT ct.nu_value_local FROM conversion_types ct " +
      "JOIN conversion c ON ct.id_conversion = c.id_conversion " +
      "WHERE c.primary_currency = 0 AND c.id_enterprise = ? ORDER BY ct.date_conversion DESC LIMIT 1";

    return dbServ.executeSql(selectStatement, [1]).then(data => {
      console.log('Tasa Paralelo obtenida', data);
      return data.rows.item(0).nu_value_local;
    })
  }

  getEnterprise() {
    return this.enterpriseServ.setup(this.synchronizationServices.getDatabase()).then(() => {
      this.enterpriseList = this.enterpriseServ.empresas;
      return this.enterpriseList;
    });

  }
}