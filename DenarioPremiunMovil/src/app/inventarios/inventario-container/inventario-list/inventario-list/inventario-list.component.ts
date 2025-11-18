import { Component, OnInit, inject } from '@angular/core';
import { InfiniteScrollCustomEvent } from '@ionic/angular';
import { ClientStocks } from 'src/app/modelos/tables/client-stocks';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { InventariosLogicService } from 'src/app/services/inventarios/inventarios-logic.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { DELIVERY_STATUS_SAVED, DELIVERY_STATUS_SENT, DELIVERY_STATUS_TO_SEND, VISIT_STATUS_TO_SEND, VISIT_STATUS_VISITED } from 'src/app/utils/appConstants'

@Component({
    selector: 'app-inventario-list',
    templateUrl: './inventario-list.component.html',
    styleUrls: ['./inventario-list.component.scss'],
    standalone: false
})
export class InventarioListComponent implements OnInit {

  public inventariosLogicService = inject(InventariosLogicService)
  public message = inject(MessageService);
  private geoLoc = inject(GeolocationService);
  public synchronizationServices = inject(SynchronizationDBService);
  public listClientStock: ClientStocks[] = []
  public valid: Boolean = false;
  public delete: Boolean = false;
  public searchText: string = '';
  public indice!: number;
  public messageAlert!: MessageAlert;


  constructor() { }

  ngOnInit() {
    this.indice = 0;
    this.message.showLoading().then(() => {
      this.inventariosLogicService.getAllClientStock(this.synchronizationServices.getDatabase(),).then(list => {
        this.listClientStock = list;
        this.message.hideLoading();
        if (this.listClientStock.length == 0)
          this.valid = true;
      });
    })
    if(this.inventariosLogicService.userMustActivateGPS){
      this.inventariosLogicService.newClientStock.coordenada = "";
      this.geoLoc.getCurrentPosition().then(xy => {
        if(xy.length > 0){
          this.inventariosLogicService.newClientStock.coordenada = xy;
        }
      })

    }

  }

  deleteClientStock(index: number) {
    this.delete = true;
    console.log("BORRAR EL ELEMENTO " + index + " de la lista")

    //DEBERIA PREGUNTAR SI DESEA BORRAR EL INVENTARIO

    this.message.showLoading().then(() => {
      this.inventariosLogicService.deleteClientStock(this.synchronizationServices.getDatabase(), this.listClientStock[index].coClientStock).then(response => {
        this.delete = false;
        // this.listClientStock.splice(index, 1);

        if (this.listClientStock.length == 0)
          this.valid = true;

        this.message.hideLoading();
        if (response) {
          this.listClientStock.splice(index, 1);
          this.inventariosLogicService.itemListClientStocks.splice(index, 1);
          this.messageAlert = new MessageAlert(
            "Denario Inventarios",
            "¡EL Inventario se borro con exito!"
          );
          this.message.alertModal(this.messageAlert);
        } else {
          this.messageAlert = new MessageAlert(
            "Denario Inventarios",
            "¡EL Inventario no pudo ser borrado con exito!"
          );
          this.message.alertModal(this.messageAlert);
        }
      })
    })


  }

  beforeOpenStock(index: number) {
    //el pedido no es enviado?: saved = true;
    var saved = (this.listClientStock[index].stClientStock == 1);
    if (this.inventariosLogicService.userMustActivateGPS && saved) {
      if(!this.inventariosLogicService.newClientStock.coordenada || 
        this.inventariosLogicService.newClientStock.coordenada !== ""){
      this.geoLoc.getCurrentPosition().then(xy => {
        if (xy.length > 0) {
          this.inventariosLogicService.newClientStock.coordenada = xy;
          this.openClientStock(index);
        }
      })
    }else{
      this.openClientStock(index);
    }    
    } else {
      this.openClientStock(index);
    }
  }
  openClientStock(index: number) {
    if (!this.delete) {
      this.inventariosLogicService.initClientStockDetails();

      console.log("abrir EL ELEMENTO " + index + " de la lista")
      this.inventariosLogicService.newClientStock = this.listClientStock[index];
      this.inventariosLogicService.inventarioComp = true;
      this.inventariosLogicService.containerComp = false;
      this.inventariosLogicService.inventarioList = false;
      if (this.inventariosLogicService.newClientStock.stClientStock == DELIVERY_STATUS_SENT) {
        this.inventariosLogicService.showHeaderButtonsFunction(false);
        this.inventariosLogicService.hideTab = false;
        this.inventariosLogicService.inventarioSent = true;
      } else {
        this.inventariosLogicService.hideTab = true;
        this.inventariosLogicService.showHeaderButtonsFunction(true);
      }
    }
  }

  onIonInfinite(ev: any) {
    this.indice++;
    setTimeout(() => {
      (ev as InfiniteScrollCustomEvent).target.complete();
    }, 800);
  }

  handleInput(event: any) {
    this.searchText = event.target.value.toLowerCase();
  }

  getStatusOrderName(status: number, naStatus: any) {
    switch (status) {
      case DELIVERY_STATUS_SAVED: return this.inventariosLogicService.inventarioTagsDenario.get("DENARIO_DEV_SAVED")! == undefined ? "Guardado" : this.inventariosLogicService.inventarioTagsDenario.get('DENARIO_DEV_SAVED')!;
      case DELIVERY_STATUS_TO_SEND: return this.inventariosLogicService.inventarioTagsDenario.get("DENARIO_DEV_TO_BE_SENDED")! == undefined ? "Por enviar" : this.inventariosLogicService.inventarioTagsDenario.get('DENARIO_DEV_TO_BE_SENDED')!;
      case DELIVERY_STATUS_SENT: return this.inventariosLogicService.inventarioTagsDenario.get("DENARIO_DEV_STATUS")! == undefined ? "Enviado" : this.inventariosLogicService.inventarioTagsDenario.get('DENARIO_DEV_STATUS')!;
      case 6:
        // naStatus puede ser string o un objeto => normalizar a string
        if (naStatus == null) return 'No Status';
        if (typeof naStatus === 'string') {
          return naStatus;
        }
        if (typeof naStatus === 'object') {
          // intenta varias propiedades comunes
          return naStatus.na_status;
        }
        return String(naStatus);

      default: return '';
    }
  }

}