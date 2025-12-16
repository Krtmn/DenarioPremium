export class CollectDiscounts {

  static CollectDiscountsJson(obj: CollectDiscounts) {
    return new CollectDiscounts(
      obj['idCollectDiscount'],
      obj['nuCollectDiscount'],
      obj['naCollectDiscount'],
      obj['requireInput'],
    );
  }

  constructor(
    public idCollectDiscount: number,
    public nuCollectDiscount: number,
    public naCollectDiscount: string,
    public requireInput: boolean,

  ) { }
}
