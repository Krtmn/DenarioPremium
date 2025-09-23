export class MessageButton {
constructor(
    public text: string,
    public role: string,
    public handler: () => void
){}
}
