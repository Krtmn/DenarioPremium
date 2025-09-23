import { Imagenes } from "./imagenes";

export class ProductPriceUtil {

  constructor(
      public idProduct: number,
      //public coProduct: string,
      public priceDefault: number,
      public coCurrencyDefault: string,
      public priceOpposite: number,
      public coCurrencyOpposite: string,
  ) { }
}