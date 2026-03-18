export class List {

    static listJson(obj: List) {
        return new List(
            obj['idList'],
            obj['coList'],
            obj['naList'],
            obj['coEnterprise'],
            obj['idEnterprise'],
            obj['showOnly']

        );
    }

    constructor(
        public idList: number,
        public coList: string,
        public naList: string,
        public coEnterprise: string,
        public idEnterprise: number,
        public showOnly: boolean

    ) { }
}