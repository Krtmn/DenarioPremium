export class ProductMinMulFav {

  static productMinMulJson(obj: ProductMinMulFav) {
      return new ProductMinMulFav(
          obj['idProductMinMul'],
          obj['coProduct'],
          obj['idProduct'],
          obj['quMinimum'],
          obj['quMultiple'],
          obj['flag'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idProductMinMul: number,
      public coProduct: string,
      public idProduct: number,
      public quMinimum: number,
      public quMultiple: number,
      public flag: boolean,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}