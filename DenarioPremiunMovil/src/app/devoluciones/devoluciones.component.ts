import { Component, OnInit, inject } from '@angular/core';
import { ServicesService } from '../services/services.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { MessageService } from '../services/messageService/message.service';
import { MessageAlert } from '../modelos/tables/messageAlert';
import { ReturnLogicService } from '../services/returns/return-logic.service';
import { GlobalConfigService } from '../services/globalConfig/global-config.service';

@Component({
    selector: 'app-devoluciones',
    templateUrl: './devoluciones.component.html',
    styleUrls: ['./devoluciones.component.scss'],
    standalone: false
})
export class DevolucionesComponent implements OnInit {

  tags = new Map<string, string>([]);
  services = inject(ServicesService);
  returnLogic = inject(ReturnLogicService);
  db = inject(SynchronizationDBService);
  message = inject(MessageService);
  globalConfig = inject(GlobalConfigService);

  showNewReturn: Boolean = false;
  public mensaje!: string;
  public header!: string;
  subscriberMsj: any;

  constructor() { }

  ngOnInit() {
    this.message.showLoading().then(() => {
      this.getTagsDev();  //buscamos los tags
      this.getTagsCommon();  //buscamos los tags
    });
    this.returnLogic.validateReturn = this.globalConfig.get("validateReturn") == "true";
    this.returnLogic.userMustActivateGPS = this.globalConfig.get("userMustActivateGPS") == "true";
  }

  getTagsDev() {
    this.services.getTags(this.db.getDatabase(), "DEV", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.tags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      this.services.getTags(this.db.getDatabase(), "DEN", "ESP").then(resultDen => {
        for (var j = 0; j < resultDen.length; j++) {
          this.tags.set(
            resultDen[j].coApplicationTag, resultDen[j].tag
          )
        }
        this.returnLogic.tags = this.tags;
      });
    });
    this.message.hideLoading();
  }

  getTagsCommon() {
    this.services.getTags(this.db.getDatabase(), "DEN", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.tags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      this.returnLogic.tags = this.tags;
    })
    this.message.hideLoading();
  }

  /*   setAlertMessage(isOpen: boolean) {
      this.alertMessageOpen = isOpen;
    } */

}
