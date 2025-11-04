import { Component, OnInit, inject } from '@angular/core';
import { InfiniteScrollCustomEvent } from '@ionic/angular';
import { ItemListaCobros } from 'src/app/cobros/item-lista-cobros';
import { Collection } from 'src/app/modelos/tables/collection';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { CollectionService } from 'src/app/services/collection/collection-logic.service';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { DELIVERY_STATUS_SAVED, DELIVERY_STATUS_SENT, DELIVERY_STATUS_TO_SEND } from 'src/app/utils/appConstants';

@Component({
  selector: 'app-cobros-list',
  templateUrl: './cobros-list.component.html',
  styleUrls: ['./cobros-list.component.scss'],
  standalone: false
})
export class CobrosListComponent implements OnInit {
  //SERVICIOS
  public enterpriseServ = inject(EnterpriseService);
  public collectService = inject(CollectionService);
  public geoLoc = inject(GeolocationService);
  private messageService = inject(MessageService);
  public synchronizationServices = inject(SynchronizationDBService);

  coordenada = '';

  public valid: Boolean = false;
  public alertDelete: boolean = false;
  public searchText: string = '';

  public indice = 0;
  public headerDelete = "";
  public mensajeDelete = "";
  public selectedCollect!: Collection;
  public selectedCollectIndex: number = 0;
  public buttonsDelete = [
    {
      text: this.collectService.collectionTags.get('MSG_BOTON_CANCELAR_DEV') ? this.collectService.collectionTags.get('MSG_BOTON_CANCELAR_DEV') : "Cancelar",
      role: 'cancel',
      handler: () => {
        //console.log('Alert canceled');
      },
    },
    {
      text: this.collectService.collectionTags.get('MSG_BOTON_DELETE_DEV') ? this.collectService.collectionTags.get('MSG_BOTON_DELETE_DEV') : "Eliminar",
      role: 'confirm',
      handler: () => {
        this.deleteCollect(0);
      },
    }
  ];


  constructor() { }

  ngOnInit() {
    if (this.collectService.userMustActivateGPS) {
      this.coordenada = '';
      this.geoLoc.getCurrentPosition().then(xy => {
        if (xy.length > 0) {
          this.coordenada = xy;

        }
      })
    }
    this.collectService.newCollect = false;
    this.headerDelete = this.collectService.collectionTags.get('COB_HEADER_MESSAGE')!;
    this.mensajeDelete = this.collectService.collectionTags.get('COB_CONFIRM_DELETE')!;
    this.collectService.initLogicService();
  }

  onCollectSelect(coCollection: string, index: number, stCollection: number) {
    if (this.collectService.userMustActivateGPS && stCollection < 3) {
      if (!this.coordenada && this.coordenada.length < 1) {
        this.geoLoc.getCurrentPosition().then(xy => {
          if (xy.length > 0) {
            this.coordenada = xy;
            this.openCollect(coCollection, index);
          }
        })
      } else {
        this.openCollect(coCollection, index);
      }
    } else {
      this.openCollect(coCollection, index);
    }

  }

  openCollect(coCollection: string, index: number) {
    //TENEMOS EL COCOLLECTION, BUSCAR EL RESTO DEL COBRO PARA ABRIR
    //SE SETEA LA EMPRESA DEL COLLECTION

    this.messageService.showLoading().then(() => {

      this.enterpriseServ.setup(this.synchronizationServices.getDatabase()).then(() => {
        this.collectService.enterpriseList = this.enterpriseServ.empresas;

        console.log(coCollection);
        this.collectService.collection = {} as Collection;
        this.collectService.collection = this.collectService.listCollect[index];
        this.collectService.documentSales = [] as DocumentSale[];
        this.collectService.documentSalesBackup = [] as DocumentSale[];
        this.collectService.mapDocumentsSales.clear();
        this.collectService.coTypeModule = this.collectService.collection.coType.toString();
        this.collectService.cobroValid = true;

        switch (Number(this.collectService.collection.coType)) {
          case 0: {
            console.log("ABRIR COBRO");
            this.collectService.isAnticipo = false;
            this.collectService.hideDocuments = false;
            this.collectService.hidePayments = false;
            this.collectService.titleModule = this.collectService.collectionTags.get('COB_NOMBRE_MODULO')!;
            break
          }
          case 1: {
            console.log("ABRIR ANTICIPO")
            this.collectService.isAnticipo = true;
            this.collectService.hideDocuments = true;
            this.collectService.hidePayments = false;
            this.collectService.disabledSelectCollectMethodDisabled = false;
            this.collectService.titleModule = this.collectService.collectionTags.get('COB_NOMBRE_MODULO_ANTICIPO')!;
            break
          }
          case 2: {
            console.log("RETENCION");
            this.collectService.isRetention = true;
            this.collectService.isAnticipo = false;
            this.collectService.hideDocuments = false;
            this.collectService.hidePayments = true;
            this.collectService.titleModule = this.collectService.collectionTags.get('COB_NOMBRE_MODULO_RETENTION')!;
            break
          }
          case 3: {
            console.log("ABRIR IGTF")
            this.collectService.isAnticipo = false;
            this.collectService.hideDocuments = false;
            this.collectService.hidePayments = false;
            this.collectService.titleModule = this.collectService.collectionTags.get('COB_NOMBRE_MODULO_IGTF')!;
            break
          }
          case 4: {
            console.log("ABRIR COBRO");
            this.collectService.isAnticipo = false;
            this.collectService.hideDocuments = false;
            this.collectService.hidePayments = false;
            this.collectService.disabledSelectCollectMethodDisabled = false;
            this.collectService.titleModule = this.collectService.collectionTags.get('COB_MODULE_COBRO25')!;;
          }
        }

        //this.collectService.isOpenCollect = true;
        if (this.collectService.historicoTasa)
          this.collectService.haveRate = true;

        for (var i = 0; i < this.collectService.enterpriseList.length; i++) {
          if (this.collectService.collection.idEnterprise == this.collectService.enterpriseList[i].idEnterprise) {
            this.collectService.enterpriseSelected = this.collectService.enterpriseList[i];
            i = this.collectService.enterpriseList.length;
            break;
          }
        }

        if (this.collectService.userMustActivateGPS) {
          //actualizamos la coordenada
          this.collectService.collection.coordenada = this.coordenada
        }

        this.collectService.getCollectionDetails(this.synchronizationServices.getDatabase(), coCollection).then(collectionDetails => {
          this.collectService.collection.collectionDetails = collectionDetails;
          this.collectService.getCollectionPayments(this.synchronizationServices.getDatabase(), coCollection).then(collectionPayment => {
            if (this.collectService.collection.stCollection == 2 || this.collectService.collection.stCollection == 3) {
              this.collectService.hideDocuments = true;
              this.collectService.hidePayments = true;
            } else if (this.collectService.collection.stCollection == 6) {
              this.collectService.showHeaderButtonsFunction(false);
              this.collectService.hideDocuments = true
              ;
              this.collectService.hidePayments = true;
            } else
              this.collectService.showHeaderButtonsFunction(true);

            this.collectService.collection.collectionPayments = collectionPayment;

            this.collectService.isOpenCollect = true;
            this.collectService.cobroListComponent = false;
            this.collectService.cobroComponent = true;
            this.messageService.hideLoading();
          })
        })
      })
    });
  }

  showAlertDelete(deleteCollect: ItemListaCobros, index: number) {
    const found = this.collectService.listCollect.find(item => item.idCollection === deleteCollect.id_collection);
    if (found) {
      this.selectedCollect = found;
    }
    this.selectedCollectIndex = index;
    this.setAlertDelete(true);

  }

  deleteCollect(index: number) {
    this.collectService.deleteCollection(this.synchronizationServices.getDatabase(), this.selectedCollect.coCollection).then(r => {
      this.collectService.listCollect.splice(this.selectedCollectIndex, 1);
      this.collectService.itemListaCobros.splice(this.selectedCollectIndex, 1);
      console.log(r, "BORRADO CON EXITO");
    })
  }

  setAlertDelete(value: boolean) {
    this.alertDelete = value;
  }

  handleInput(event: any) {
    this.searchText = event.target.value.toLowerCase();
  }

  onIonInfinite(ev: any) {
    this.indice++;
    setTimeout(() => {
      (ev as InfiniteScrollCustomEvent).target.complete();
    }, 800);
  }


  getStatusOrderName(status: number, naStatus: string) {
    switch (status) {
      case DELIVERY_STATUS_SAVED: return this.collectService.collectionTags.get("COB_STATUS_SAVED")!;
      case DELIVERY_STATUS_TO_SEND: return this.collectService.collectionTags.get("COB_STATUS_TO_SEND")!;
      case DELIVERY_STATUS_SENT: return this.collectService.collectionTags.get("COB_STATUS_SENT")!;
      case 6: return naStatus!;
      default: return '';
    }
  }

  getCoTypeName(coType: string | number): string {
    const typeStr = String(coType);
    switch (typeStr) {
      case '0': return this.collectService.collectionTags.get("COB_TYPE_COBRO")!;
      case '1': return this.collectService.collectionTags.get("COB_TYPE_ANTICIPO")!;
      case '2': return this.collectService.collectionTags.get("COB_TYPE_RETENCION")!;
      case '3': return this.collectService.collectionTags.get("COB_TYPE_IGTF")!;

      default: return 'Cobro';
    }
  }
}