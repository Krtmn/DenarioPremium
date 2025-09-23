export class TypeProductStructure {

  static typeProductStructureJson(obj: TypeProductStructure) {
      return new TypeProductStructure(
          obj['idTypeProductStructure'],
          obj['type'],
          obj['coTypeProductStructure'],
          obj['naTypeProductStructure'],
          obj['scoTypeProductStructure'],
          obj['nuLevel'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idTypeProductStructure: number,
      public type: string,
      public coTypeProductStructure: string,
      public naTypeProductStructure: string,
      public scoTypeProductStructure: string,
      public nuLevel: number,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}