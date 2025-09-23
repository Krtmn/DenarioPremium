export class UserInformation {

  static userInformationJson(obj: UserInformation) {
      return new UserInformation(
          obj['idUserInformation'],
          obj['coUser'],
          obj['idUser'],
          obj['title'],
          obj['content'],
          obj['coEnterprise'],
          obj['idEnterprise'],
        
      );
  }

  constructor(
      public idUserInformation: number,
      public coUser: string,
      public idUser: string,
      public title: string,
      public content: string,
      public coEnterprise: string,
      public idEnterprise: number,
      
  ) { }
}