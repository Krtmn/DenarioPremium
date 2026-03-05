export class StraightSwap {
 static StraightSwapJson(obj: StraightSwap) {
    return new StraightSwap(
        obj['idSwap'],    
        obj['coSwap'],
        obj['idProduct'],
        obj['coProduct'],
        obj['daCambio'],
        obj['idUnit'],
        obj['coUnit'],
        obj['idEnterprise'],
        obj['coEnterprise'],
        obj['quSwap'],
    );
}

  constructor(
  public idSwap: number,
  public coSwap: string,
  public idProduct: number,
  public coProduct: string,
  public daCambio: string,
  public idUnit: number,
  public coUnit: string,
  public idEnterprise: number,
  public coEnterprise: string,
  public quSwap: number,
  ) { }
}
