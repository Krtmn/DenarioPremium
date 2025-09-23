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

  changeUser = new Subject<Boolean>; //para mensajes que el boton no va atras

  constructor(
    private sqlite: SQLite,

  ) {
    this.prueba();
  }


  async getNamesTables() {
    (await this.databaseService.getCreateTables()).subscribe((res) => {
      console.log(res);
      this.nameDatabases = res;
      return true;
    });
  }

  prueba() {

    this.sqlite.create({
      name: 'denarioPremium',
      location: 'default'
    }).then((db: SQLiteObject) => {
      this.database = db;
    }).catch(e => {
      console.log(e)
    });
  }

  dropTables(tables: any[]) {
    this.nameDatabases = tables;
    //this.database = this.databaseService.getDatabase();
    var statements = [];
    let dropTable = ""
    localStorage.setItem("createTables", "false");
    for (var i = 0; i < this.nameDatabases.length; i++) {
      dropTable = "DROP TABLE IF EXISTS " + this.nameDatabases[i].name;
      statements.push([dropTable, []])
    }
    return this.database.sqlBatch(statements).then(res => {
      /* dropTable = "DROP TABLE IF EXISTS banks" */
      /* return this.database.executeSql(dropTable).then(res => { */
      return res;
    }).catch(e => {
      console.log(e);
    })

  }
}
