import { GlobalConfiguration } from "./tables/globalConfiguration";


export interface User {
    [index: number]: {
        idUser: number;
        coUser: string;
        lastUpdate: string;
        cliente: string;
        promotor: string;
        errorCode: string;
        errorMessage: string,
        serviceVersion: string,
        jwtAuthResponse: {
            tokenDeAcceso: string
        },
        variablesConfiguracion: [];
        tags: [];
        variablesConfiguracionCliente: [];
    }
}


export class User {
    static user(obj: User) {
        return new User(
            obj['idUser'],
            obj['coUser'],
            obj['name'],
            obj['lastUpdate'],
            obj['cliente'],
            obj['errorCode'],
            obj['jwtAuthResponse'],
            obj['variablesConfiguracion'],
            obj['tags'],
            obj['variablesConfiguracionCliente'],

        );
    }

    constructor(
        public idUser: number,
        public coUser: string,
        public name: string,
        public lastUpdate: string,
        public errorCode: string,
        public cliente: string,
        public jwtAuthResponse: {
            tokenDeAcceso: string
        },
        public variablesConfiguracion: [],
        public tags: [],
        public variablesConfiguracionCliente: [],

    ) { }

}