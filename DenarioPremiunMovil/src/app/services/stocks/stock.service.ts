import { Injectable, inject } from '@angular/core';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { Warehouse } from 'src/app/modelos/tables/warehouse';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  dbServ = inject(SynchronizationDBService);

  public productWarehouses: Warehouse[] = [];



  constructor() { }

  getWarehousesByIdProduct(idProduct: number) {
    var database = this.dbServ.getDatabase();
    this.productWarehouses = [];
    var select = "select w.* from warehouses w join stocks s on w.id_warehouse = s.id_warehouse join products p on s.id_product = p.id_product where p.id_product = ? order by w.na_warehouse asc"
    return database.executeSql(select, [idProduct]).then(result => {
      for (let i = 0; i < result.rows.length; i++) {
        this.productWarehouses.push({
          idWarehouse: result.rows.item(i).id_warehouse,
          coWarehouse: result.rows.item(i).co_warehouse,
          naWarehouse: result.rows.item(i).na_warehouse,
          idEnterprise: result.rows.item(i).id_enterprise,
          coEnterprise: result.rows.item(i).co_enterprise,
        });
      }
    }
    ).catch(e => {
      this.productWarehouses = [];
      console.log("[StockService] Error al cargar almacenes.");
      console.log(e);
    })
  }

  getStockByIdWarehousesAndIdProduct(idWarehouse: number, idProduct: number) {
    var database = this.dbServ.getDatabase();
    var select = "select s.qu_stock from stocks s where s.id_warehouse = ? and s.id_product = ?"
    return database.executeSql(select, [idWarehouse, idProduct]).then(data => {
      let result = 0;
      if (data.rows.length > 0) {
        result = data.rows.item(0).qu_stock;
      }
      return result
    }
    ).catch(e => {
      console.log("[StockService] Error al cargar getStockByIdWarehousesAndIdProduct.");
      console.log(e);
      return 0;
    })
  }

}
