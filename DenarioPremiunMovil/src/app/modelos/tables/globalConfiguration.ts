export interface GlobalConfiguration {
    //id: number,
    idConfig: number,
    clave: string,
    valor: string,
    descripcion: string,
}

export class GlobalConfiguration {

    static globalConfigurationJson(obj: GlobalConfiguration) {
        return new GlobalConfiguration(
            //obj['id'],

            obj['idConfig'],
            obj['clave'],
            obj['valor'],
            obj['descripcion'],


        );
    }
    constructor(

        //public id: number,
        public idConfig: number,
        public clave: string,
        public valor: string,
        public descripcion: string,

    ) { }


}