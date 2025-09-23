export class InvoiceDetail {

  static invoiceDetailJson(obj: InvoiceDetail) {
      return new InvoiceDetail(
          obj['idInvoiceDetail'],
          obj['coInvoiceDetail'],
          obj['coInvoice'],
          obj['idInvoice'],
          obj['coProduct'],
          obj['idProduct'],
          obj['nuAmountTotal'],
          obj['coWarehouse'],
          obj['idWarehouse'],
          obj['iva'],
          obj['nuDiscountTotal'],
          obj['coDiscount'],
          obj['idDiscount'],
          obj['coPriceList'],
          obj['idPriceList'],          
          obj['coEnterprise'],
          obj['idEnterprise'],

        
      );
  }

  constructor(
      public idInvoiceDetail: number,
      public coInvoiceDetail: string,
      public coInvoice: string,
      public idInvoice: number,
      public coProduct: string,
      public idProduct: number,
      public nuAmountTotal: number,
      public coWarehouse: string,
      public idWarehouse: number,
      public iva: number,
      public nuDiscountTotal: number,
      public coDiscount: string,
      public idDiscount: number,
      public coPriceList: string,
      public idPriceList: number,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}