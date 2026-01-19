import { Position } from '@capacitor/geolocation';
export class CollectDiscounts {

  static CollectDiscountsJson(obj: CollectDiscounts) {
    return new CollectDiscounts(
      obj['idCollectDiscount'],
      obj['nuCollectDiscount'],
      obj['naCollectDiscount'],
      obj['requireInput'],
      obj['nuAmountCollectDiscount'],
      obj['nuAmountCollectDiscountConversion'],
      obj['position'],
    );
  }

  constructor(
    public idCollectDiscount: number,
    public nuCollectDiscount: number,
    public naCollectDiscount: string,
    public requireInput: boolean,
    public nuAmountCollectDiscount: number,
    public nuAmountCollectDiscountConversion: number,
    public position: number,

  ) { }
}
