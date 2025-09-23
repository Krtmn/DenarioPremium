export class Discount {

  static discountJson(obj: Discount) {
      return new Discount(
          obj['idDiscount'],
          obj['idPriceList'],
          obj['quDiscount'],
          obj['coList'],
          obj['idList'],
          obj['coProduct'],
          obj['idProduct'],
          obj['coUnit'],
          obj['idUnit'],
          obj['quVolIni'],
          obj['quVolFin'],
          obj['nuPriority'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idDiscount: number,
      public idPriceList: number,
      public quDiscount: number,
      public coList: string,
      public idList: number,
      public coProduct: string,
      public idProduct: number,
      public coUnit: string,
      public idUnit: number,
      public quVolIni: number,
      public quVolFin: number,
      public nuPriority: number,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}