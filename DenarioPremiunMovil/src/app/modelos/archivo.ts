export class Archivo{
    constructor(
       public tipo: string,
       public data: string,
       public naFile: string,
       public weightLimitExceeded: boolean = false
    ){}
}