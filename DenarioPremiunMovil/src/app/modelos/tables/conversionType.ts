export class ConversionType {

  static conversionTypeJson(obj: ConversionType) {
      return new ConversionType(
          obj['idConversionType'],
          obj['coConversionType'],
          obj['coCurrencyHard'],
          obj['coCurrencyLocal'],
          obj['nuValueLocal'],
          obj['dateConversion'],
          obj['coEnterprise'],
          obj['idEnterprise'],
          obj['idConversion'],
        
      );
  }

  constructor(
      public idConversionType: number,
      public coConversionType: string,
      public coCurrencyHard: string,
      public coCurrencyLocal: string,
      public nuValueLocal: number,
      public dateConversion: string,
      public coEnterprise: string,
      public idEnterprise: number,
      public idConversion: number,
      
  ) { }
}