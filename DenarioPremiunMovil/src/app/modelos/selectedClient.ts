import { Client } from "./tables/client";
import { DocumentSale } from "./tables/documentSale";
export class SelectedClient {
    /* Objeto para tener en el componente padre el valor de los selectores en el componente de Productos */
    constructor(
        public client: Client,
        public document: DocumentSale[]
    ) { }
}