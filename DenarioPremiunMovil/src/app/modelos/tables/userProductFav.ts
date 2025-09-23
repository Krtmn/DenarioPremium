export class UserProductFav {

  static userProductFavJson(obj: UserProductFav) {
      return new UserProductFav(
          obj['idUserProductFavs'],
          obj['coUser'],
          obj['idUser'],
          obj['coProduct'],
          obj['idProduct'],
          obj['ifChange'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idUserProductFavs: number,
      public coUser: string,
      public idUser: number,
      public coProduct: string,
      public idProduct: number,
      public ifChange: boolean,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}