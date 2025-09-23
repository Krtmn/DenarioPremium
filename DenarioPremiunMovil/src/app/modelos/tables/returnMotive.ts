export class ReturnMotive {

    static returnMotiveJson(obj: ReturnMotive) {
        return new ReturnMotive(
            obj['idMotive'],
            obj['naMotive']          
        );
    }
  
    constructor(
        public idMotive: number,
        public naMotive: string
    ) { }
  }