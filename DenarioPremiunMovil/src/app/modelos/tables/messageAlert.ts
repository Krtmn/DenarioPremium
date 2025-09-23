export class MessageAlert {

    static messageAlertJson(obj: MessageAlert) {
        return new MessageAlert(
            obj['header'],
            obj['message'],
        );
    }

    constructor(
        public header: string,
        public message: string,
       
    ) { }
}