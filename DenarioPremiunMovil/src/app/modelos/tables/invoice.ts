export class Invoice {

  static invoiceJson(obj: Invoice) {
      return new Invoice(
          obj['idInvoice'],
          obj['coInvoice'],
          obj['coClient'],
          obj['idClient'],
          obj['daInvoice'],
          obj['naResponsible'],
          obj['coUser'],
          obj['idUser'],
          obj['daDispatch'],
          obj['txComment'],
          obj['coPaymentCondition'],
          obj['idPaymentCondition'],
          obj['coAddressClient'],
          obj['idAddressClient'],
          obj['nuAmountTotal'],
          obj['nuAmountFinal'],
          obj['nuDiscount'],
          obj['nuPurchase'],
          obj['coCurrency'],
          obj['idCurrency'],
          obj['idConversionType'],
          obj['nuValueLocal'],
          obj['nuAmountFinalConversion'],
          obj['nuAmountTotalConversion'],
          obj['coEnterprise'],
          obj['idEnterprise'],

        
      );
  }

  constructor(
      public idInvoice: number,
      public coInvoice: string,
      public coClient: string,
      public idClient: number,
      public daInvoice: string,
      public naResponsible: string,
      public coUser: string,
      public idUser: number,
      public daDispatch: string,
      public txComment: string,
      public coPaymentCondition: string,
      public idPaymentCondition: number,
      public coAddressClient: string,
      public idAddressClient: number,
      public nuAmountTotal: number,
      public nuAmountFinal: number,
      public nuDiscount: number,
      public nuPurchase: string,
      public coCurrency: string,
      public idCurrency: number,
      public idConversionType: number,
      public nuValueLocal: number,
      public nuAmountFinalConversion: number,
      public nuAmountTotalConversion: number,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}