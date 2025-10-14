import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ReturnList } from 'src/app/modelos/ReturnList';
import { Return } from 'src/app/modelos/tables/return';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { ReturnDatabaseService } from 'src/app/services/returns/return-database.service';
import { ReturnLogicService } from 'src/app/services/returns/return-logic.service';
import { DELIVERY_STATUS_SAVED, DELIVERY_STATUS_SENT, DELIVERY_STATUS_TO_SEND } from 'src/app/utils/appConstants';
import { ItemListaDevoluciones } from '../../item-lista-devoluciones';
import { SynchronizationComponent } from 'src/app/synchronization/synchronization.component';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';


@Component({
    selector: 'devolucion-list',
    templateUrl: './devolucion-list.component.html',
    styleUrls: ['./devolucion-list.component.scss'],
    standalone: false
})
export class DevolucionListComponent implements OnInit {
  returnLogic = inject(ReturnLogicService);
  returnDatabaseService = inject(ReturnDatabaseService);
  geoLoc = inject(GeolocationService);
  dbService = inject(SynchronizationDBService);

  tags = new Map<string, string>([]);
  returnList: ReturnList[] = [];
  selectedReturn: string = "";
  selectedReturnIndex: number = 0;
  alertDelete: boolean = false;
  searchText: string = '';
  mensajeDelete = ""
  headerDelete = "";

  constructor() { }

  ngOnInit() {
    this.tags = this.returnLogic.tags;
    this.headerDelete = this.tags.get('DENARIO_DEV')!,
      this.mensajeDelete = this.tags.get('DENARIO_DEV_CONFIRM_DELETE')!,
      this.returnLogic.getReturnList().then(() => {
        this.returnList = this.returnLogic.returnList;
      })
      this.returnLogic.newReturn.coordenada = "";
      if (this.returnLogic.userMustActivateGPS) {
      this.geoLoc.getCurrentPosition().then(xy => {
        if (xy.length > 0) {
          this.returnLogic.newReturn.coordenada = xy;
        }
      })
    } 
  }

  public buttonsDelete = [
    {
      text: this.tags.get('MSG_BOTON_CANCELAR_DEV') ? this.tags.get('MSG_BOTON_CANCELAR_DEV') : "Cancelar",
      role: 'cancel',
      handler: () => {
        //console.log('Alert canceled');
      },
    },
    {
      text: this.tags.get('MSG_BOTON_DELETE_DEV') ? this.tags.get('MSG_BOTON_DELETE_DEV') : "Eliminar",
      role: 'confirm',
      handler: () => {
        this.deleteReturn();
      },
    }
  ];

  onReturnSelected(coReturnSelected: string, stReturn: number) {
    if (this.returnLogic.userMustActivateGPS && stReturn === 1) {
      if(this.returnLogic.newReturn.coordenada && this.returnLogic.newReturn.coordenada.length > 0){
        this.returnLogic.findReturnSelected(coReturnSelected);
      } else {
      this.geoLoc.getCurrentPosition().then(xy => {
        if (xy.length > 0) {
          this.returnLogic.newReturn.coordenada = xy;
          this.returnLogic.findReturnSelected(coReturnSelected);
        }
      })
    }
    } else {
      this.returnLogic.findReturnSelected(coReturnSelected);
    }

  }

  showAlertDelete(deleteReturn: ItemListaDevoluciones, index: number) {
    this.selectedReturn = deleteReturn.coReturn;
    this.selectedReturnIndex = index;
    this.setAlertDelete(true);
  }

  setAlertDelete(value: boolean) {
    this.alertDelete = value;
  }

  deleteReturn() {
    // primero elimino los detalles si existen
    this.returnDatabaseService.deleteReturnDetails(this.dbService.getDatabase(), this.selectedReturn).then(() => {
      //luego elimino la devolucion
      this.returnDatabaseService.deleteReturn(this.dbService.getDatabase(), this.selectedReturn).then(() => {
        this.returnList.splice(this.selectedReturnIndex, 1);
        this.returnLogic.itemReturns.splice(this.selectedReturnIndex, 1);
      });
    });
  }

  handleInput(event: any) {
    this.searchText = event.target.value.toLowerCase();
  }

  getStatusOrderName(status: number, naStatus: string) {
    switch (status) {
      case DELIVERY_STATUS_SAVED: return this.tags.get('DENARIO_DEV_SAVED')! == undefined ? "Guardado" : this.tags.get('DENARIO_DEV_SAVED')!;
      case DELIVERY_STATUS_TO_SEND: return this.tags.get('DENARIO_DEV_TO_BE_SENDED')! == undefined ? "Por enviar" : this.tags.get('DENARIO_DEV_TO_BE_SENDED')!;
      case DELIVERY_STATUS_SENT: return this.tags.get('DENARIO_DEV_SENDED')! == undefined ? "Enviado" : this.tags.get('DENARIO_DEV_SENDED')!;
      case 6: return naStatus!;
      default: return '';
    }
  }
}
