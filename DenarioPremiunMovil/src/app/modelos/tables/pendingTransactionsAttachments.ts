export class PendingTransactionsAttachments {

  static pendingTransactionsAttachmentsJson(obj: PendingTransactionsAttachments) {
    return new PendingTransactionsAttachments(
      obj['naAttachment'],
      obj['idTransaction'],
      obj['coTransaction'],
      obj['type'],
      obj['naTransaction'],
      obj['position'],
      obj['cantidad'],
    );
  }

  constructor(
    public naAttachment: string,
    public idTransaction: number,
    public coTransaction: string,
    public type: string,
    public naTransaction: string,
    public position: number,
    public cantidad: number,
  ) { }
}
