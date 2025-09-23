import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Coordinate } from 'src/app/modelos/coordinate';
import { SynchronizationDBService } from '../../synchronization/synchronization-db.service';
import { UserAddresClients } from 'src/app/modelos/tables/userAddresClients';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite';


@Injectable({
  providedIn: 'root'
})
export class ClientLocationService {

  destroyMap = new Subject<Boolean>; //para mensajes que el boton no va atras
  salvarGuardarLocacion = new Subject<Boolean>; //para mensajes que el boton no va atras
  saveSend = new Subject<Boolean>; //para salvar o guardar el nuevo cliente potencial
  private syncServ = inject(SynchronizationDBService);
  public destruirmapa: Boolean = true;


  constructor() { }

  destroyMapFuncion(data: boolean) {
    return Promise.resolve(this.destroyMap.next(data));
  }


  saveLocation() {
    this.salvarGuardarLocacion.next(true);
  }

  insertUserAddressClient(coordinates: Coordinate) {
    let database = this.syncServ.getDatabase();
    let coordenada = coordinates.lat + "," + coordinates.lng;
    coordinates.idUserAddressClient == undefined ? 0 : coordinates.idUserAddressClient;

    this.updateLocation(coordenada, coordinates.idClient);

    let inserStatement = 'INSERT OR REPLACE INTO user_address_clients (' +
      'id_user_address_client, co_user_address_client,id_address_client, co_address_client,tx_comment, id_user,id_enterprise,coordenada' +
      ') ' +
      'VALUES(?,?,?,?,?,?,?,?)';
    return database.executeSql(inserStatement,
      [coordinates.idUserAddressClient, coordinates.coUserAddressClient, coordinates.idAddressClients,
      coordinates.coAddressClients, coordinates.txComment, localStorage.getItem("idUser"),
      coordinates.idEnterprise, coordenada]
    ).then(res => {
      console.log("SE INSERTO insertUserAddressClient ", res);
    }).catch(e => {
      console.log("ERROR insertUserAddressClient ", e);
    })
  }

  updateLocation(coordenada: string, idClient: number) {
    let database = this.syncServ.getDatabase();
    return database.executeSql(
      'UPDATE address_clients SET coordenada = ? WHERE id_client = ?',
      [coordenada, idClient]
    ).then(res => {
      return true;
    }).catch(e => {
      return false;
    })
  }

  getUserAddresLocation(database: SQLiteObject, coTransaction: string) {
    let userAddresClients: UserAddresClients;
    return database.executeSql(
      'SELECT * FROM user_address_clients WHERE co_user_address_client = ?',
      [coTransaction])
      .then(res => {
        userAddresClients = {
          idUserAddressClient: res.rows.item(0).id_user_address_client,
          coUserAddressClient: res.rows.item(0).co_user_address_client,
          idAddressClient: res.rows.item(0).id_address_client,
          coAddressClient: res.rows.item(0).co_address_client,
          txComment: res.rows.item(0).tx_comment,
          idUser: res.rows.item(0).id_user,
          idEnterprise: res.rows.item(0).id_enterprise,
          coordenada: res.rows.item(0).coordenada,
          status: res.rows.item(0).status

        }
        return userAddresClients;
      }).catch(e => {
        console.log(e);
        return userAddresClients;
      })
  }

}
