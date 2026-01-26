import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { throwError, firstValueFrom } from 'rxjs';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { User } from '../modelos/user';
import { Login } from '../modelos/login';
import { syncResponse } from '../modelos/tables/getSyncResponse';
import { ApplicationTags } from '../modelos/tables/applicationTags';
import { PendingTransaction } from '../modelos/tables/pendingTransactions';




@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  //private WsUrl = "http://soportepremium.ddns.net:8181/PremiumWS/services/";
  private WsUrl = "http://192.168.0.231:8282/PremiumWS/services/";
  //private WsUrl = "http://192.168.0.217:8080/PremiumWS/services/";

  //private WsUrl = "http://denariodemo.ddns.net:8282/PremiumWS/services/";

  //KIBERNO
  //private WsUrl = "http://190.52.107.151:8282/PremiumWS/services/";

  //DEMO
  //private WsUrl = 'http://soportepremium.ddns.net:9090/PremiumWS/services/';

  //Server Savia asanchez // 123456
  //rivate WsUrl = "http://soportepremium.ddns.net:9995/PremiumWS/services/";

  //NUTRINA andres nutac123
  //private WsUrl = "http://soportepremium.ddns.net:9993/PremiumWS/services/";

  //nutrina
  //private WsUrl = 'http://soportepremium.ddns.net:8191/PremiumWS/services/';

  //  private WsUrl = "http://200.35.84.250:8085/PremiumWS/services/";

  //la fuente asanchez // 123456
  //private WsUrl = "http://denariolafuente.dyndns.org:8083/PremiumWS/services/";

  //charcuteria ventas01 // 123456
  //private WsUrl = "http://soportepremium.ddns.net:9998/PremiumWS/services/"

  //El Eden Import
  // private WsUrl = "http://ec2-3-129-33-188.us-east-2.compute.amazonaws.com:8081/PremiumWS/services/";

  //Alimentos Cofivenca
  //private WsUrl = "http://207.244.239.61:9091/PremiumWS/services/";

  //Importadora4k
  //private WsUrl = "http://38.51.157.214:9080/PremiumWS/services/";

  //Alimentos Global MP
  //private WsUrl = "http://3.224.206.209:8081/PremiumWS/services/";


  //mystic ggonzalez // 123456
  //private WsUrl = "http://soportepremium.ddns.net:9292/PremiumWS/services/";

  //el palmar 1988 // 09247*
  //private WsUrl = "http://denarioazucar.ddns.net:8181/PremiumWS/services/";

  //romher 170 // 123456
  // private WsUrl = "http://190.121.225.172:8060/PremiumWS/services/";

  //private WsUrl = "https://denario-mobile-dev.apps.kraftheinz.com/PremiumWS/services/";

  //private WsUrl ="http://52.45.133.141:8282/PremiumWS/services/"

  //private WsUrl = "http://denariodemo.ddns.net:8282/PremiumWS/services/";

  //private WsUrl = "http://200.35.84.250:8085/PremiumWS/services/";

  // diprocher pruebas QA
  //private WsUrl = "http://soportepremium.ddns.net:9991/PremiumWS/services/";

  //private WsUrl = "http://soportepremium.ddns.net:9993/PremiumWS/services/";

  //001 123456 Dist Mundo agricola
  //private WsUrl = "http://soportepremium.ddns.net:9995/PremiumWS/services/";

  //001 123456  miopart
  //private WsUrl = " http://186.14.151.4:59091/PremiumWS/services/";


  private name = "";
  private last = "";
  public tags = new Map<string, string>([]);

  constructor(private http: HttpClient) { }

  getURLService() {
    return this.WsUrl;
  }

  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // Return an observable with a user-facing error message.
    return throwError(
      'Something bad happened; please try again later.');
  }


  // Http Options
  getHttpOptions() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      })
    }
    return httpOptions;
  }

  getHttpOptionsAuthorization() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem("token")
      })
    }
    return httpOptions;

  }

  onLogin(_login: Login, deviceInfo: any, deviceId: any) {
    if (localStorage.getItem("lastUpdate") == null)
      localStorage.setItem("lastUpdate", "2000-01-01 00:00:00.000");

    return this.http.post<User>(this.WsUrl + "authservice/auth",
      {
        "login": _login.login.trim(),
        "password": _login.password,
        "lastLogin": localStorage.getItem("lastUpdate"),
        // "dispositivo": null
        // "login": "prueba",
        //     "password": "123456",
        // "lastLogin": localStorage.getItem("lastUpdate"),
        "dispositivo": {
          "deviceUUID": deviceId.identifier,
          "devicePlatform": deviceInfo.platform,
          "deviceModel": deviceInfo.model,
          "deviceVersion": deviceInfo.name,
          "appVersion": "3.8"
        }
      }, this.getHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  getSync(tables: string) {
    return this.http.post<syncResponse>(this.WsUrl + "syncservice/getsync", tables, this.getHttpOptionsAuthorization())
      .pipe(
        map(resp => {
          return resp
        })
      );
  }


  async getTags(database: SQLiteObject, nameModule: string, coLanguage: string) {
    return database.executeSql(
      'SELECT * FROM application_tags WHERE co_module = ? AND co_language = ?;',
      [
        nameModule, coLanguage
      ]
    ).then(res => {
      let tags: ApplicationTags[] = [];
      for (var i = 0; i < res.rows.length; i++) {
        tags.push({
          idApplicationTag: res.rows.item(i).id_application_tag,
          coApplicationTag: res.rows.item(i).co_application_tag,
          coLanguage: res.rows.item(i).co_language,
          coModule: res.rows.item(i).co_module,
          naModule: res.rows.item(i).na_module,
          tag: res.rows.item(i).tag
        })
      }
      return tags;
    }).catch(e => {
      let tags: ApplicationTags[] = [];
      console.log(e);
      return tags;
    })
  }

  insertPendingTransaction(database: SQLiteObject, pendingTransaction: PendingTransaction) {
    return database.executeSql(
      'INSERT INTO pending_transactions(co_transaction, id_transaction, type) VALUES(?,?,?);',
      [pendingTransaction.coTransaction, pendingTransaction.idTransaction, pendingTransaction.type]
    ).then(res => {
      return true;
    }).catch(e => {
      return false;
    })
  }

  insertPendingTransactionBatch(database: SQLiteObject, pendingTransactions: PendingTransaction[]) {
    var insert = 'INSERT INTO pending_transactions(co_transaction, id_transaction, type) VALUES(?,?,?);';
    var bat = []
    // console.log("insertando batch de transacciones")
    // console.log(pendingTransactions);
    for (let i = 0; i < pendingTransactions.length; i++) {
      bat.push([insert, [pendingTransactions[i].coTransaction,
      pendingTransactions[i].idTransaction, pendingTransactions[i].type]]);
    }
    return database.sqlBatch(bat).then(res => {
      return true;
    }).catch(e => {
      console.error(e);
      return false;
    });
  }

  getUserInformation() {

    return this.http.post<Response>(this.WsUrl + "userservice/userinformation",
      {
        "idUser": localStorage.getItem("idUser")
      }, this.getHttpOptionsAuthorization())
      .pipe(
        catchError(this.handleError)
      );
  }


  async sendImage(transaction: string, id: string, posicion: string, file: string, filename: string, type: string, cantidad: number): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Accept": "application/json",
        'Authorization': 'Bearer ' + localStorage.getItem("token")
      })
    }

    try {
      const fetched = await fetch('data:image/jpeg;base64,' + file);
      const blob = await fetched.blob();

      const data = new FormData();
      data.append('transaction', transaction);
      data.append('id', id);
      data.append('posicion', posicion);
      data.append('file', blob, filename);
      data.append('type', type);
      data.append('cantidad', cantidad.toString());

      console.log("[ServiceService] Subiendo Imagenes");

      const obs = this.http.post<{
        errorCode: String, errorMessage: String, serviceVersion: any, type: string,
        name: string; transaction: string
      }>(this.WsUrl + "uploadimages", data, httpOptions);

      const res = await firstValueFrom(obs);
      console.log("[ServiceService] Respuesta de server:", res);
      return res;
    } catch (err) {
      console.error('[ServiceService] Error al subir la imagen', err);
      throw err;
    }
  }

  getTagsHome() {
    return this.tags;
  }

  setTagsHome(tagsHome: Map<string, string>) {
    this.tags = tagsHome;
  }

}
