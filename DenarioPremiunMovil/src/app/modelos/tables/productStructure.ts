export class ProductStructure {

  static productStructureJson(obj: ProductStructure) {
      return new ProductStructure(
          obj['idProductStructure'],
          obj['type'],
          obj['coProductStructure'],
          obj['naProductStructure'],
          obj['idTypeProductStructure'],
          obj['coTypeProductStructure'],
          obj['scoProductStructure'],
          obj['snaProductStructure'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idProductStructure: number,
      public type: string,
      public coProductStructure: string,
      public naProductStructure: string,
      public idTypeProductStructure: number,
      public coTypeProductStructure: string,
      public scoProductStructure: string,
      public snaProductStructure: number,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}