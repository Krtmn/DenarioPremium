import { Injectable, inject } from '@angular/core';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { TypeProductStructure } from 'src/app/modelos/tables/typeProductStructure';
import { ProductStructure } from 'src/app/modelos/tables/productStructure';
import { Subject } from 'rxjs';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite';


@Injectable({
  providedIn: 'root'
})
export class ProductStructureService {


  public productStructureCountList: ProductStructure[] = [] 
  public typeProductStructureList: TypeProductStructure[] = [] 
  public idProductStructureList: number[] = [] 
  public coProductStructureListString: string = "";
  public nombreProductStructureSeleccionada = "";

  productStructures = new Subject<Boolean>;

  constructor() { }

  onAddProductCLicked(){
    this.productStructures.next(true);
  }

  onReturnProductTabClicked(){
    this.productStructures.next(false);
  }

  getTypeProductStructuresByIdEnterprise(dbServ:SQLiteObject, idEnterprise: number) {
    console.log('Clickee boton +');
    var database = dbServ
    this.typeProductStructureList = [];
    var select = "SELECT * FROM type_product_structures WHERE id_enterprise = ? ORDER BY nu_level ASC"
    return database.executeSql(select, [idEnterprise]).then( result =>{
        for (let i = 0; i < result.rows.length; i++) {
        this.typeProductStructureList.push({
          idTypeProductStructure: result.rows.item(i).id_type_product_structure,
          coTypeProductStructure: result.rows.item(i).co_type_product_structure,
          naTypeProductStructure: result.rows.item(i).na_type_product_structure,
          type: result.rows.item(i).type,          
          scoTypeProductStructure: result.rows.item(i).sco_type_product_structure,
          nuLevel: result.rows.item(i).nu_level,
          coEnterprise: result.rows.item(i).co_enterprise,
          idEnterprise: result.rows.item(i).id_enterprise
        });
        }
       // console.log(this.productStructureList);
    }).catch(e => {
      this.typeProductStructureList = [];
      console.log("[ProductStructureService] Error al cargar tipos de estructuras.");
      console.log(e);
    })
  }

  getProductStructuresByIdTypeProductStructureAndIdEnterprise(dbServ:SQLiteObject,idTypeProductStructure: number, idEnterprise: number) {
    var database = dbServ
    this.productStructureCountList = [];
    
    var select = "SELECT * FROM product_structures WHERE id_type_product_structure = ? AND id_enterprise = ? ORDER BY na_product_structure ASC"
    return database.executeSql(select, [idTypeProductStructure, idEnterprise]).then( result =>{
        for (let i = 0; i < result.rows.length; i++) {
        this.productStructureCountList.push({
          //id: result.rows.item(i).id,
          idProductStructure: result.rows.item(i).id_product_structure,
          coProductStructure: result.rows.item(i).co_product_structure,
          naProductStructure: result.rows.item(i).na_product_structure,
          quProducts: result.rows.item(i).qu_products,
          idTypeProductStructure: result.rows.item(i).id_type_product_structure,
          coTypeProductStructure: result.rows.item(i).co_type_product_structure,
          coEnterprise: result.rows.item(i).co_enterprise,
          idEnterprise: result.rows.item(i).id_enterprise,
          scoProductStructure: result.rows.item(i).sco_product_structure,
          snaProductStructure: result.rows.item(i).sna_product_structure,
          type: result.rows.item(i).type,
        });
        }
       // console.log(this.productStructureList);
    }).catch(e => {
      this.productStructureCountList = [];
      console.log("[ProductStructureService] Error al cargar estructuras.");
      console.log(e);
    })
  }

  getLowestsProductStructuresByCoProductStructuresAndIdEnterprise(dbServ:SQLiteObject,coProductStructure: string, idEnterprise: number) {
    var database = dbServ
    this.idProductStructureList = [];
    var select = "WITH RECURSIVE estructuras AS (SELECT sqps.co_product_structure, sqps.id_product_structure FROM product_structures sqps WHERE co_product_structure = ? AND id_enterprise = ? UNION SELECT psv.co_product_structure, psv.id_product_structure FROM product_structures psv INNER JOIN estructuras ps ON ps.co_product_structure = psv.sco_product_structure and psv.id_enterprise = ?  ) SELECT * FROM estructuras"
    return database.executeSql(select, [coProductStructure, idEnterprise, idEnterprise]).then( result =>{
        for (let i = 0; i < result.rows.length; i++) {
          this.idProductStructureList.push(result.rows.item(i).id_product_structure);
        }
      // console.log(this.idProductStructureList);
    }).catch(e => {
      this.idProductStructureList = [];
      console.log("[ProductStructureService] Error al cargar nivel mas bajo de estructuras.");
      console.log(e);
    })
  }

}
