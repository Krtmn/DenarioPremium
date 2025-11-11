export class Modules {

    static modulesJson(obj: Modules) {
        return new Modules(
            obj['idModule'],
            obj['coModule'],
            obj['naModule'],
        );
    }

    constructor(
        public idModule: number,
        public coModule: string,
        public naModule: string,
    ) { }
}