export class CurrencyEnterprise {

  static currencyEnterpriseJson(obj: CurrencyEnterprise) {
      return new CurrencyEnterprise(
          obj['idCurrencyEnterprise'],
          obj['coCurrency'],
          obj['idCurrency'],
          obj['localCurrency'],
          obj['hardCurrency'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idCurrencyEnterprise: number,
      public coCurrency: string,
      public idCurrency: number,
      public localCurrency: boolean,
      public hardCurrency: boolean,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}