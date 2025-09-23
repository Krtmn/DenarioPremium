export class InvoiceDetailUnit {

  static invoiceDetailUnitJson(obj: InvoiceDetailUnit) {
      return new InvoiceDetailUnit(
          obj['idInvoiceDetailUnit'],
          obj['coInvoiceDetailUnit'],
          obj['coInvoiceDetail'],
          obj['idInvoiceDetail'],
          obj['coProductUnit'],
          obj['idProductUnit'],
          obj['quInvoice'],
          obj['coEnterprise'],
          obj['idEnterprise'],

        
      );
  }

  constructor(
      public idInvoiceDetailUnit: number,
      public coInvoiceDetailUnit: string,
      public coInvoiceDetail: string,
      public idInvoiceDetail: number,
      public coProductUnit: string,
      public idProductUnit: number,
      public quInvoice: number,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}