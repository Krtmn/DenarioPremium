import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';


@Injectable({
  providedIn: 'root'
})
export class LoginLogicService {


  public databaseService = inject(SynchronizationDBService);

  public database!: SQLiteObject
  public nameDatabases: any[] = [];
  public imgHome!: string;

  changeUser = new Subject<boolean>() //para mensajes que el boton no va atras

  constructor(
    private sqlite: SQLite,

  ) {
  }


  async getNamesTables() {
    (await this.databaseService.getCreateTables()).subscribe((res) => {
      console.log(res);
      this.nameDatabases = res;
      return true;
    });
  }

  dropTables(tables: any[]): Promise<any> {
    if (this.database == undefined) {
      // devolvemos la promesa para cubrir todos los caminos de ejecución
      return this.sqlite.create({
        name: 'denarioPremium',
        location: 'default'
      }).then((db: SQLiteObject) => {
        this.database = db;
        return this.deleteTables(tables, db);
      }).catch(e => {
        console.error('[dropTables] sqlite.create error:', e);
        throw e;
      });
    } else {
      return this.deleteTables(tables, this.database);
    }
  }

  deleteTables(tables: any[], database: SQLiteObject): Promise<any> {
    const statements: [string, any[]][] = [];
    let dropTable = '';

    // usar el array recibido directamente
    this.nameDatabases = tables;

    localStorage.setItem('createTables', 'false');
    for (let i = 0; i < tables.length; i++) {
      dropTable = 'DROP TABLE IF EXISTS ' + tables[i].name;
      statements.push([dropTable, []]);
    }

    return database.sqlBatch(statements).then(res => {
      return res;
    }).catch(e => {
      console.error('[deleteTables] sqlBatch error:', e);
      throw e;
    });
  }
}
