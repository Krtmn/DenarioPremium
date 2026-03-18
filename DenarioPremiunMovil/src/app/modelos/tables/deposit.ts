

export class Deposit {
  static depositJson(obj: Deposit) {
    return new Deposit(
      obj['idUser'],
      obj['coUser'],
      obj['idDeposit'],
      obj['coDeposit'],
      obj['daDeposit'],
      obj['coBank'],
      obj['nuAccount'],
      obj['nuDocument'],
      obj['daDocument'],
      obj['nuAmountDoc'],
      obj['nuAmountDocConversion'],
      obj['coCurrency'],
      obj['idEnterprise'],
      obj['coEnterprise'],
      obj['txComment'],
      obj['nuValueLocal'],
      obj['idCurrency'],
      obj['stDeposit'],
      obj['stDelivery'],
      obj['isEdit'],
      obj['isEditTotal'],
      obj['isSave'],
      obj['coordenada'],
      obj['collectionIds'],
      obj['depositCollect'],
    );
  }

  constructor(

    public idUser: number = 0,
    public coUser: string = "",
    public idDeposit: number | null,
    public coDeposit: string = "",
    public daDeposit: string = "",
    public coBank: string = "",
    public nuAccount: string = "",
    public nuDocument: string = "",
    public daDocument: string = "",
    public nuAmountDoc: number = 0,
    public nuAmountDocConversion: number = 0,
    public coCurrency: string = "",
    public idEnterprise: number = 0,
    public coEnterprise: string = "",
    public txComment: string = "",
    public nuValueLocal: number = 0,
    public idCurrency: number = 0,
    public stDeposit: number = 0,
    public stDelivery: number = 0,
    public isEdit: boolean = false,
    public isEditTotal: boolean = false,
    public isSave: boolean = false,
    public coordenada: string = "",
    public collectionIds: number[] = [],
    public depositCollect: DepositCollect[]
  ) { }
}

export class DepositCollect {
  static depositCollectJson(obj: DepositCollect) {
    return new DepositCollect(
      obj['idDepositCollect'],
      obj['coDepositCollect'],
      obj['coDeposit'],
      obj['coDocument'],
      obj['nuAmountTotal'],
      obj['nuTotalDeposit'],
      obj['coCollection'],
      obj['idCollection'],
      obj['st'],
      obj['isSave'],
      obj['lbClient'],
      obj['daCollection'],

    );
  }

  constructor(
    public idDepositCollect: number = 0,
    public coDepositCollect: string = "",
    public coDeposit: string = "",
    public coDocument: string = "",
    public nuAmountTotal: number = 0,
    public nuTotalDeposit: number = 0,
    public coCollection: string = "",
    public idCollection: number = 0,
    public st: number = 0,
    public isSave: boolean = true,
    public lbClient: string = "",
    public daCollection: string = "",
  ) { }
}

