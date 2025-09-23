export class ProductDetail {

  static productJson(obj: ProductDetail) {
      return new ProductDetail(
          obj['idProduct'],
          obj['coProduct'],
          obj['naProduct'],
          obj['idProductStructure'],
          obj['coProductStructure'],
          obj['naProductStructure'],
          obj['txDescription'],
          obj['idUnit'],          
          obj['coUnit'],          
          obj['naUnit'],          
          obj['points'],
          obj['priceLocal'],
          obj['coCurrencyLocal'],
          obj['priceHard'],
          obj['coCurrencyHard'],
          obj['conversion'],
          obj['stock'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idProduct: number,
      public coProduct: string,
      public naProduct: string,
      public idProductStructure: number,
      public coProductStructure: string,      
      public naProductStructure: string,
      public txDescription: string,
      public idUnit: number,
      public coUnit: string,
      public naUnit: string,
      public points: number,
      public priceLocal: number,
      public coCurrencyLocal: string,
      public priceHard: number | null,
      public coCurrencyHard: string | null,
      public conversion: string | null,
      public stock: number,
      public coEnterprise: string,
      public idEnterprise: number,
  ) { }
}