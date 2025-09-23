import { Component, OnInit, OnChanges, inject, Input, EventEmitter, Output } from '@angular/core';
import { Router, ActivatedRoute, ParamMap, NavigationEnd } from '@angular/router';
import { InfiniteScrollCustomEvent } from '@ionic/angular';

import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';

import { PotentialClientDatabaseServicesService } from '../../../services/clientes/potentialClient/potential-client-database-services.service';
import { PotentialClient } from '../../../modelos/tables/potentialClient';
import { SynchronizationDBService } from '../../../services/synchronization/synchronization-db.service';
import { CLIENT_POTENTIAL_STATUS_NEW, CLIENT_POTENTIAL_STATUS_SENT, CLIENT_POTENTIAL_STATUS_TO_SEND } from 'src/app/utils/appConstants';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';




@Component({
    selector: 'app-client-potential-client',
    templateUrl: './client-potential-client.component.html',
    styleUrls: ['./client-potential-client.component.scss'],
    standalone: false
})
export class PotentialClientComponent implements OnInit {

  @Input()
  searchText: string = "";

  public clientLogic = inject(ClientLogicService)
  public potentialClientServices = inject(PotentialClientDatabaseServicesService)
  public message = inject(MessageService);

  public messageAlert!: MessageAlert;
  public nuevo!: number;
  public porEnviar!: number;
  public enviado!: number;
  public delete: Boolean = false;

  constructor(
    private router: Router
  ) {
    this.searchText = "";
    this.clientLogic.indice = 1;

    this.nuevo = CLIENT_POTENTIAL_STATUS_NEW;
    this.enviado = CLIENT_POTENTIAL_STATUS_SENT;
    this.porEnviar = CLIENT_POTENTIAL_STATUS_TO_SEND
  }

  ngOnInit() {

    this.searchText = "";
    this.clientLogic.getPotentialClient();

  }

  openPotentialClientFunction(potencialClient: PotentialClient) {
    if (!this.delete) {

      this.clientLogic.potentialClient = potencialClient;
      this.clientLogic.clienteNuevoBlancoImg = false
      this.clientLogic.clientPotentialClientComponent = false;
      this.clientLogic.clientNewPotentialClientComponent = true;
    }
  }

  deletePotentialClient(index: number) {
    this.delete = true;
    this.message.showLoading().then(() => {
      console.log("borradera");
      this.potentialClientServices.deleteClientPotential(this.clientLogic.potentialClients[index].coClient).then(resp => {
        this.delete = false;
        this.message.hideLoading();
        if (resp) {
          this.clientLogic.potentialClients.splice(index, 1);
          this.messageAlert = new MessageAlert(
            "Denario Clientes",
            "¡Cliente Potencial se borro con exito!"
          );
          this.message.alertModal(this.messageAlert);
        } else {
          this.messageAlert = new MessageAlert(
            "Denario Inventarios",
            "¡Cliente Potencial no pudo ser borrado con exito!"
          );
          this.message.alertModal(this.messageAlert);
        }
      })
    })

  }

  handleInput(event: any) {
    this.searchText = event.target.value.toLowerCase();
  }


  onIonInfinite(ev: any) {
    this.clientLogic.indice++;
    setTimeout(() => {
      (ev as InfiniteScrollCustomEvent).target.complete();
    }, 800);
  }
}
