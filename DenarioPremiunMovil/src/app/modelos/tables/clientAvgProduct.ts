export class ClientAvgProduct {

  static clientAvgProductJson(obj: ClientAvgProduct) {
      return new ClientAvgProduct(
          obj['idClientAvgProduct'],
          obj['idClient'],
          obj['coClient'],
          obj['idAddressClient'],
          obj['coAddressClient'],
          obj['idProduct'],
          obj['coProduct'],
          obj['idProductUnit'],
          obj['coProductUnit'],
          obj['average'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idClientAvgProduct: number,
      public idClient: number,
      public coClient: string,
      public idAddressClient: number,
      public coAddressClient: string,
      public idProduct: number,
      public coProduct: string,
      public idProductUnit: number,
      public coProductUnit: string,
      public average: number,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}