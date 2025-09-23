export class CurrencyRelation {

  static currencyRelationJson(obj: CurrencyRelation) {
      return new CurrencyRelation(
          obj['idCurrencyRelation'],
          obj['coCurrencyHard'],
          obj['coCurrencyLocal'],
          obj['nuExchangeRate'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idCurrencyRelation: number,
      public coCurrencyHard: string,
      public coCurrencyLocal: string,
      public nuExchangeRate: number,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}