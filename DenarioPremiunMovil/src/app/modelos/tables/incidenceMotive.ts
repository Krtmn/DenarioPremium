export class IncidenceMotive {

    static incidenceMotiveJson(obj: IncidenceMotive) {
        return new IncidenceMotive(
            obj['idMotive'],
            obj['naMotive'],
            obj['idType'],
        );
    }

    constructor(
        public idMotive: number ,
        public naMotive: string,
        public idType: number,        
    ) { }
}