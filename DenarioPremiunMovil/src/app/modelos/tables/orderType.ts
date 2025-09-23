export class OrderType {

  static orderTypeJson(obj: OrderType) {
      return new OrderType(
          obj['idOrderType'],
          obj['coOrderType'],
          obj['naOrderType'],
          obj['defaultValue'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idOrderType: number,
      public coOrderType: string,
      public naOrderType: string,
      public defaultValue: boolean,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}