import { Component, OnInit, inject } from '@angular/core';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { CollectionService } from 'src/app/services/collection/collection-logic.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { MessageService } from 'src/app/services/messageService/message.service';

@Component({
    selector: 'app-cobro',
    templateUrl: './cobro.component.html',
    styleUrls: ['./cobro.component.scss'],
    standalone: false
})
export class CobroComponent implements OnInit {

  public messageAlert!: MessageAlert;
  public collectService = inject(CollectionService);
  public messageService = inject(MessageService);
  public globalConfig = inject(GlobalConfigService);

  public subs: any;

  public segment = 'default';
  public fecha!: Date;


  constructor() {
    this.collectService.collectValidTabs = false;
  }


  ngOnInit() {
    if (this.collectService.initCollect) {
      this.collectValidFunc();
    } else {
      this.collectService.collectValidTabs = true;
      this.segment = "default";
    }
  }

  collectValidFunc() {
    this.collectService.validCollection.subscribe((data: Boolean) => {
      this.collectService.collectValidTabs = data.valueOf();
    });
  }


  onChangeTab(tab: string) {
    /* if (tab == "documentos") {
      if (this.globalConfig.get('multiCurrency') === "true") {
        if (this.collectService.collection.nuValueLocal) {
          this.messageAlert = new MessageAlert(
            "Denario Cobros",
            "Debe colocar una taza valida"
          );
          this.messageService.alertModal(this.messageAlert);
          this.segment = "default";
        }
      }
    } */
    //    this.segment = tab;
  }

  getDate() {
    console.log(this.fecha);
  }


}