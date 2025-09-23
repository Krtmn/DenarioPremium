export class MessageSaveOrExit {

    static messageSaveOrExitJson(obj: MessageSaveOrExit) {
        return new MessageSaveOrExit(
            obj['header'],
            obj['saveAndExitBtn'],
            obj['exitBtn'],
            obj['cancelBtn']
        );
    }

    constructor(
        public header: string,
        public saveAndExitBtn: string,
        public exitBtn: string,
        public cancelBtn: string,

       
    ) { }
}