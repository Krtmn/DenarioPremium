
export class ApplicationTags {
    static applicationTagsJson(obj: ApplicationTags) {
        return new ApplicationTags(
            obj['idApplicationTag'],
            obj['coApplicationTag'],
            obj['coLanguage'],
            obj['coModule'],
            obj['naModule'],
            obj['tag']
        );
    }

    constructor(
        public idApplicationTag: number,
        public coApplicationTag: string,
        public coLanguage: string,
        public coModule: string,
        public naModule: string,
        public tag: string
    ) { }

}