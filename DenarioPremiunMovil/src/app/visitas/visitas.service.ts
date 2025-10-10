import { inject, Injectable } from '@angular/core';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { IncidenceType } from 'src/app/modelos/tables/incidenceType';
import { IncidenceMotive } from 'src/app/modelos/tables/incidenceMotive';
import { Visit } from '../modelos/tables/visit';
import { GlobalConfigService } from '../services/globalConfig/global-config.service';
import { Incidence } from '../modelos/tables/incidence';
import { ServicesService } from '../services/services.service';
import { AddresClient } from '../modelos/tables/addresClient';
import { ImageServicesService } from '../services/imageServices/image-services.service';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { MessageService } from '../services/messageService/message.service';


@Injectable({
  providedIn: 'root'
})
export class VisitasService {
  public tags = new Map<string, string>([]);

  private services = inject(ServicesService);
  private config = inject(GlobalConfigService);
  private dbServ = inject(SynchronizationDBService);
  public imageServices = inject(ImageServicesService);
  private message = inject(MessageService);

  public editVisit: boolean = false;
  public visit = {} as Visit;

  listaActividades!: IncidenceType[];
  listaMotivos!: IncidenceMotive[];

  //globalConfig
  public userMustActivateGPS!: boolean;
  public transportRole!: boolean;
  public checkAddressClient!: boolean;
  public enterpriseEnabled!: boolean;
  public signatureVisit!: boolean;

  //fin globalConfig

  //Define si el usuario actual es transportista o no. no es el config
  public rolTransportista: boolean = false;
  public coordenadas = '';
  pdfList: string[] = [];
  showPdfList = false;

  constructor(private fileOpener: FileOpener
  ) {



  }

  getTag(tagName: string) {
    var tag = this.tags.get(tagName);
    if (tag == undefined) {
      console.log("Error al buscar tag " + tagName);
      tag = '';
    }
    return tag;
  }


  getTags() {
    if (this.tags.size > 0) {
      //ya tenemos los tags, no hay que hacer nada.
    } else {
      this.services.getTags(this.dbServ.getDatabase(), "VIS", "ESP").then(result => {
        for (var i = 0; i < result.length; i++) {
          this.tags.set(
            result[i].coApplicationTag, result[i].tag
          )
        }
        if (this.tags) {
          //console.log(this.tags);
        }
      })
      this.services.getTags(this.dbServ.getDatabase(), "DEN", "ESP").then(result => {
        for (var i = 0; i < result.length; i++) {
          this.tags.set(
            result[i].coApplicationTag, result[i].tag
          )
        }
        if (this.tags) {
          //console.log(this.tags);
        }
      })
    }

  }

  getConfiguration() {
    this.userMustActivateGPS = 
      this.config.get("userMustActivateGPS").toLowerCase() === 'true';

    this.transportRole = 
      this.config.get("transportRole").toLowerCase() === 'true';

    this.enterpriseEnabled = 
      this.config.get("enterpriseEnabled").toLowerCase() === "true";

    this.checkAddressClient = 
      this.config.get("checkAddressClient").toLowerCase() === "true";

    this.signatureVisit = 
    this.config.get('signatureVisit').toLowerCase() == 'true'

    //no tengo un mejor sitio para el rol, asi que ira acá
    if(this.transportRole) {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        let user = JSON.parse(userStr);
        if (user.transportista) {
          this.rolTransportista = user.transportista;
        }else{
          //puede ser undefined o similar
          this.rolTransportista = false;
        }
      } catch (e) {
        this.rolTransportista = false;
      }
    }
  }else{
    this.rolTransportista = false;
  }
  }

  getLists() {
    this.getIncidenceTypes().then((result: IncidenceType[]) => {
      this.listaActividades = result;

    });
    this.getIncidenceMotives().then((result: IncidenceMotive[]) => {
      this.listaMotivos = result;

    })
  }

  /* getListFilesPremiumDispatch() {
    // Suponiendo que mapPdfFiles es un Map<string, string[]> y cada valor es un array de rutas
    console.log(this.imageServices.mapPdfFiles);
    const iterator = this.imageServices.mapPdfFiles.values();
    const firstEntry = iterator.next().value;
    if (firstEntry && firstEntry.length > 0) {
      const pdfPath = firstEntry[0];
      this.fileOpener.open(pdfPath, 'application/pdf')
        .then(() => console.log('PDF abierto'))
        .catch(e => console.log('Error abriendo PDF', e));
    } else {
      this.message.transaccionMsjModalNB('No hay guía de despacho disponibles.');
    }
  } */

  getListFilesPremiumDispatch() {
    // Llena la lista de PDFs desde el Map
    this.pdfList = [];
    this.imageServices.mapPdfFiles.forEach(arr => {
      const coUser = localStorage.getItem("coUser")!; // O usa this.user.coUser si lo tienes en tu clase
      const filtrados = arr.filter(pdf => pdf.split('/').pop()?.startsWith(coUser));
      this.pdfList.push(...filtrados);
    });
    this.showPdfList = true;
  }

  // Para cerrar la lista
  closePdfList() {
    this.showPdfList = false;
  }

  openPdf(pdf: string) {
    //window.open(pdf, '_blank');
    this.fileOpener.open(pdf, 'application/pdf')
      .then(() => console.log('PDF abierto'))
      .catch(e => console.log('Error abriendo PDF', e));
  }

  getIncidenceMotives() {
    var query = 'SELECT id_type as idType, id_motive as idMotive, na_motive as naMotive from incidence_motives';
    return this.dbServ.getDatabase().executeSql(query, []).then(data => {
      let lists: IncidenceMotive[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        lists.push(data.rows.item(i));
      }
      return lists;
    })
  }

  getIncidenceTypes() {
    var query = 'SELECT id_type as idType, na_type as naType, required_event as requiredEvent, required_signature as requiredSignature FROM incidence_types';
    return this.dbServ.getDatabase().executeSql(query, []).then(data => {
      let lists = [];
      for (let i = 0; i < data.rows.length; i++) {
        lists.push(data.rows.item(i));
      }
      return lists;
    })
  }

  saveVisit(v: Visit) {
    var insertStatement: string;
    var params = []
   
    insertStatement = "INSERT OR REPLACE INTO visits(" +
      "co_visit, st_visit, da_visit, coordenada, id_client, co_client," +
      "na_client, nu_sequence, id_user, co_user, co_enterprise, id_enterprise, id_visit, " +
      "da_real, da_initial, id_address_client, co_address_client, nu_attachments, has_attachments, " +
      "is_reassigned, tx_reassigned_motive, da_reassign, is_visited ) " +
      "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    params = [v.coVisit, v.stVisit, v.daVisit, v.coordenada, v.idClient, v.coClient,
    v.naClient, v.nuSequence, v.idUser, v.coUser, v.coEnterprise, v.idEnterprise, (this.editVisit ? v.idVisit : 0),
    v.daReal, v.daInitial, v.idAddressClient, v.coAddressClient, v.nuAttachments,
    v.hasAttachments, v.isReassigned, v.txReassignedMotive, v.daReassign, v.isVisited];
    //}


    var retrieveStatement = "SELECT id_visit as idVisit, co_visit as coVisit, " +
      "st_visit as stVisit, da_visit as daVisit, " +
      "coordenada, id_client as idClient, co_client as coClient, " +
      "na_client as naClient, nu_sequence as nuSequence, id_user as idUser, " +
      "co_user as coUser, co_enterprise as coEnterprise, id_enterprise as idEnterprise, " +
      "da_real as daReal, da_initial as daInitial, id_address_client as idAddressClient, " +
      "co_address_client as coAddressClient, " +
      "has_attachments as hasAttachments, nu_attachments as nuAttachments, " +
      "is_reassigned as isReassigned, tx_reassigned_motive as txReassignedMotive, da_reassign as daReassign " +
      "FROM visits WHERE co_visit = ?"

    return this.dbServ.getDatabase().executeSql(insertStatement, params).then(
      () => {
        //console.log("inserte visita co:" +v.coVisit); 
        return this.dbServ.getDatabase()
          .executeSql(retrieveStatement, [v.coVisit]).then(data => { return data })
      }
    )
  }

  saveIncidences(input: Incidence[]) {
    var insertStatement: string;

    var batch = [];
    for (let i = 0; i < input.length; i++) {
      let params = [];
      if (input[i].coIncid > 0) {
        insertStatement = "INSERT or replace INTO incidences(id_visit, co_visit, co_incidence, co_type, co_cause, tx_description) VALUES (?,?,?,?,?,?)";
        params = [input[i].idVisit, input[i].coVisit, input[i].coIncid, input[i].coType, input[i].coCause, input[i].txDescription]
      } else {
        insertStatement = "INSERT or replace INTO incidences(id_visit, co_visit, co_type, co_cause, tx_description) VALUES (?,?,?,?,?)";
        params = [input[i].idVisit, input[i].coVisit, input[i].coType, input[i].coCause, input[i].txDescription]
      }
      var q = [insertStatement, params];
      batch.push(q);
    }
    return this.dbServ.getDatabase().sqlBatch(batch).then(() => {
      if (input.length > 0) {
        return this.getIncidencesByVisit(input[0].coVisit);
      } else {
        return input;
      }

    });
  }

  deleteIncidence(coIncidence: number) {
    var deleteStatement = "DELETE FROM incidences  WHERE co_incidence = ?";

    return this.dbServ.getDatabase().executeSql(deleteStatement, [coIncidence]).then(result => {
      console.log('[Visita] Borrando Incidencia co_incidence: ' + coIncidence);
      console.log(result)
    })
  }

  getIncidencesByVisit(coVisit: string) {
    var retrieveStatement = "select id_visit as idVisit, co_visit as coVisit, co_incidence as coIncid, co_type as coType," +
      " co_cause as coCause, tx_description as txDescription FROM incidences where co_visit = ?";

    return this.dbServ.getDatabase().executeSql(retrieveStatement, [coVisit]).then(data => {
      //console.log(data);
      let incidences: Incidence[] = []
      for (let i = 0; i < data.rows.length; i++) {
        const item = data.rows.item(i);
        incidences.push(item);

      }
      return incidences;
    });
  }

  getVisit(co: string) {
    var retrieveStatement = "SELECT * FROM visits WHERE co_visit = ?"

    return this.dbServ.getDatabase().executeSql(retrieveStatement, [co]).then(result => {
      var item = result.rows.item(0);
      console.log(item);
      var visit = this.visitDBtoObj(item);
      console.log(visit);
      return this.getIncidencesByVisit(visit.coVisit).then(inc => {
        visit.visitDetails = inc;
        return visit;
      })
    })

  }


  deleteVisit(co: string) {
    var deleteStatement = "DELETE from visits where co_visit = ?"

    return this.dbServ.getDatabase().executeSql(deleteStatement, [co]).then(result => {
      console.log('[Visita] Borrando Visita co_visit: ' + co);
      console.log(result)

    })

  }

  getVisitList(today: string) {

    var retrieveReassignments = "SELECT * FROM visits WHERE is_reassigned = true AND da_reassign like ? ORDER BY nu_sequence ASC";

    var retrieveVisits = "SELECT * FROM visits WHERE da_visit like ? ORDER BY nu_sequence ASC";

    return this.dbServ.getDatabase().executeSql(retrieveVisits, [today]).then(visitlist => {      
      //console.log(data);
      let visits: Visit[] = []
      for (let i = 0; i < visitlist.rows.length; i++) {
            visits.push(this.visitDBtoObj(visitlist.rows.item(i)));
     }
      if(this.rolTransportista){
        //si es transportista, miro si hay reasignaciones para hoy y las meto en la lista
       return this.dbServ.getDatabase().executeSql(retrieveReassignments, [today]).then(reasignaciones => {
          let reassigned = []
          for (let i = 0; i < reasignaciones.rows.length; i++) {
            reassigned.push(this.visitDBtoObj(reasignaciones.rows.item(i)));
          }
          return [...reassigned, ...visits];
        });
      }else{
        //no es transportista, no miro reasignaciones
        return visits;
      }

    });
  
  }

  visitDBtoObj(item : any) {
    //traduzco el resultado de la bd al objeto visita
      let v: Visit = {
          idVisit: item.id_visit,
          coVisit: item.co_visit,
          stVisit: item.st_visit,
          daVisit: item.da_visit,
          coordenada: item.coordenada,
          idClient: item.id_client,
          coClient: item.co_client,
          naClient: item.na_client,
          nuSequence: item.nu_sequence,
          idUser: item.id_user,
          coUser: item.co_user,
          coEnterprise: item.co_enterprise,
          idEnterprise: item.id_enterprise,
          visitDetails: [],
          daInitial: item.da_initial,
          daReal: item.da_real,
          idAddressClient: item.id_address_client,
          coAddressClient: item.co_address_client,
          coordenadaSaved: item.coordenadaSaved,
          hasAttachments: item.has_attachments,
          nuAttachments: item.nu_attachments,
          isReassigned: item.is_reassigned === "true" ? true : false,
          txReassignedMotive: item.tx_reassigned_motive,
          daReassign: item.da_reassign,
          noDispatchedMotive: item.no_dispatched_motive,
          isDispatched: item.is_dispatched === "true" ? true : false,
          isVisited: item.is_visited === "true" ? true : false,
      }
      return v;
  }

  getNuSequence(date: String) {
    var retrieveStatement = "SELECT max(nu_sequence) as max FROM visits v WHERE da_visit = ?";
    return this.dbServ.getDatabase().executeSql(retrieveStatement, [date]).then(seq => {
      var max = seq.rows.item(0).max;
      if (max == null) {
        return 1
      } else {
        return max + 1;
      }
    })
  }

  getAddressClient(idClient: number) {
    let query = "select id_address as idAddress, co_address as coAddress, na_address as naAddress, " +
      "id_client as idClient, id_address_type as idAddressType, co_address_type as coAddressType, " +
      "tx_address as txAddress, nu_phone as nuPhone, na_responsible as naResponsible, " +
      "co_enterprise_structure as coEnterpriseStructure, id_enterprise_structure as idEnterpriseStructure, " +
      "co_client as coClient, co_enterprise as coEnterprise, id_enterprise as idEnterprise, " +
      "coordenada, editable FROM address_clients where id_client = ?"

    return this.dbServ.getDatabase().executeSql(query, [idClient]).then(data => {
      let list: AddresClient[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        list.push(data.rows.item(i));
      }
      return list;
    })
  }


}
