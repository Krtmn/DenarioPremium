import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { ServicesService } from '../services/services.service';
import { Client } from '../modelos/tables/client';

@Injectable({
  providedIn: 'root'
})
export class ClienteSelectorService {
  private syncServ = inject(SynchronizationDBService);
  private servicesServ = inject(ServicesService);
  public tags = new Map<string, string>([]);
  public db!: SQLiteObject;
  public clientes!: Client[];
  moduleNames: Map<string,string> = new Map<string,string>();
  public clienteAnterior: null | Client = null;
  public checkClient = false;

  public colorModulo: string = '';

  public nombreModulo: string = '';

  ClientChanged = new Subject<Client>;

  constructor() {
    this.db = this.syncServ.getDatabase();
    //obtenemos los tags
    this.servicesServ.getTags(this.db, "CLI", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.tags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }

    });
    this.getModuleNames();

   }

   onCLientChanged(client: Client){
    //console.log("[Cliente-Selector] que mamadera de gallo es esa de cambiar cliente..... que va");
    this.ClientChanged.next(client);
   }

   getModuleNames(){
    const selectStatement = 'Select * from modules';
    return this.db.executeSql(selectStatement, []).then(result => {
      this.moduleNames = new Map<string, string>();
      for (let i = 0; i < result.rows.length; i++) {
        this.moduleNames.set(result.rows.item(i).na_module, result.rows.item(i).co_module);
      }      
      return this.moduleNames;
    });
   }
}
