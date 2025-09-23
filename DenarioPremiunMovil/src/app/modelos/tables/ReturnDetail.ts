import { ReturnMotive } from "./returnMotive";
import { Unit } from "./unit";

export class ReturnDetail {

  static returnDetailJson(obj: ReturnDetail) {
    return new ReturnDetail(
      obj['coReturnDetail'],
      obj['idReturn'],
      obj['coReturn'],
      obj['idProduct'],
      obj['coProduct'],
      obj['naProduct'],
      obj['quProduct'],
      obj['coMeasureUnit'],
      obj['naMeasureUnit'],
      obj['idUnit'],
      obj['unit'],
      obj['productUnits'],
      obj['validateProductUnits'],
      obj['nuLote'],
      obj['daDueDate'],
      obj['coDocument'],
      obj['idMotive'],
      //obj['returnMotives']
    );
  }

  constructor(
    public coReturnDetail: string,
    public idReturn: number | null,
    public coReturn: string,
    public idProduct: number,
    public coProduct: string,
    public naProduct: string,
    public quProduct: number,
    public coMeasureUnit: string,
    public naMeasureUnit: string,
    public idUnit: number,
    public unit: Unit | undefined,
    public productUnits: Unit[],
    public validateProductUnits: Unit[],
    public nuLote: string,
    public daDueDate: string | null,
    public coDocument: string,
    public idMotive: number,

    public showDateModal: boolean = false,
    //public returnMotives: ReturnMotive[],
  ) { }
}