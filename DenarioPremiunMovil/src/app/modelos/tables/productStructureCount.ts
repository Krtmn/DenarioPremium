export class ProductStructureCount {

  static productStructureCountJson(obj: ProductStructureCount) {
      return new ProductStructureCount(
          obj['id'],
          obj['idProductStructure'],
          obj['coProductStructure'],
          obj['naProductStructure'],
          obj['quProducts'],
          obj['idTypeProductStructure'],
          obj['coTypeProductStructure'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public id: number,
      public idProductStructure: string,
      public coProductStructure: string,
      public naProductStructure: string,
      public quProducts: number,
      public idTypeProductStructure: number,
      public coTypeProductStructure: string,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}