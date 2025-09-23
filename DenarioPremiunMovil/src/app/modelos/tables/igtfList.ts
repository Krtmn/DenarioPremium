export class IgtfList {

  static igtfListJson(obj: IgtfList) {
      return new IgtfList(
          obj['idIgtf'],
          obj['naIgtf'],
          obj['price'],
          obj['descripcion'],
          obj['defaultIgtf'],
        
      );
  }

  constructor(
      public idIgtf: number,
      public naIgtf: string,
      public price: number,
      public descripcion: string,
      public defaultIgtf: string,
      
  ) { }
}