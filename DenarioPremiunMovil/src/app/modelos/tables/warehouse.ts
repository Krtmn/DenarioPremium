export class Warehouse {

  static warehouseJson(obj: Warehouse) {
      return new Warehouse(
          obj['idWarehouse'],
          obj['coWarehouse'],
          obj['naWarehouse'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idWarehouse: number,
      public coWarehouse: string,
      public naWarehouse: string,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}