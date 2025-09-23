import { Enterprise } from "./tables/enterprise";
import { ProductStructureCount } from "./tables/productStructureCount";
import { TypeProductStructure } from "./tables/typeProductStructure";

export class ProductStructureUtil {
  /* Objeto para tener en el componente padre el valor de los selectores en el componente de Productos */
  constructor(
    public enterprise: Enterprise,
    public typeProductStructure: TypeProductStructure,
    public productStructure: ProductStructureCount 
  ){}
}