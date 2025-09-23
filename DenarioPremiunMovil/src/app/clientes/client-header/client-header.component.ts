import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientLocationService } from 'src/app/services/clientes/locationClient/client-location.service';
import { Subject } from 'rxjs';

import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { PotentialClient } from 'src/app/modelos/tables/potentialClient';
import { PotentialClientDatabaseServicesService } from 'src/app/services/clientes/potentialClient/potential-client-database-services.service';
import { ServicesService } from 'src/app/services/services.service';

@Component({
    selector: 'app-client-header',
    templateUrl: './client-header.component.html',
    styleUrls: ['./client-header.component.scss'],
    standalone: false
})
export class ClientesHeaderComponent implements OnInit {

  public router = inject(Router);
  public clientLogic = inject(ClientLogicService);
  public locationService = inject(ClientLocationService);
  public potentialClientService = inject(PotentialClientDatabaseServicesService)

  public subscriberShow: any;
  public subscriberDisabled: any;
  public subscriberToSend: any;
  public showHeaderButtos: Boolean = false;
  public disableSendButton: Boolean = true;
  public cannotSendClientStock: Boolean = true;
  public showIconPotentialClient: Boolean = false;
  public showIconNewPotentialClient: Boolean = false;
  public showIconsNewPotentialClient: Boolean = false;
  public saveSendLocation: Boolean = false;
  public alertMessageOpen: Boolean = false;
  public header: string = '';
  public mensaje: string = '';
  public texto: string = ""
  public DENARIO_BOTON_CANCELAR: string = ""
  public DENARIO_BOTON_ACEPTAR: string = ""
  public DENARIO_BOTON_SALIR_GUARDAR: string = ""
  public DENARIO_BOTON_SALIR: string = ""

  public alertButtons = [
    {
      text: '',
      role: 'cancel'
    },
    {
      text: '',
      role: 'confirm'
    },
  ];

  public buttonsSalvar = [
    {
      text: '',
      role: 'save',
      handler: () => {
        console.log('save and exit');
        if (this.clientLogic.clientLocationComponent) {
          this.saveSendLocationFunction()
        }
        if (this.clientLogic.clientNewPotentialClientComponent) {
          this.clientLogic.saveSendPotentialClient = false;          
          this.clientLogic.clientNewPotentialClientComponent = false;
          this.clientLogic.clienteNuevoBlancoImg = true;
          this.clientLogic.clientPotentialClientComponent = true;
          this.saveSendNewPotentialCliente(true);
        }
      },
    },
    {
      text: '',
      role: 'exit',
      handler: () => {
        console.log('exit w/o save');
        this.clientLogic.newPotentialClientChanged = false;
        this.clientLogic.saveOrExitOpen = false;
        if (this.clientLogic.clientNewPotentialClientComponent) {
          this.clientLogic.saveSendPotentialClient = false;
          this.clientLogic.clienteNuevoBlancoImg = true;
          this.clientLogic.clientNewPotentialClientComponent = false;
          this.clientLogic.clientPotentialClientComponent = true;

        } else if (this.clientLogic.clientLocationComponent) {
          this.clientLogic.clientLocationComponent = false;
          this.clientLogic.clientListComponent = true;
        }
      },
    },
    {
      text: '',
      role: 'cancel',
      handler: () => {
        console.log('exit canceled');
      },
    },
  ];


  constructor() {

  }

  ngOnInit() {
    this.clientLogic.getTagsDenario().then(resp => {
      if (resp) {
        this.buttonsSalvar[0].text = this.clientLogic.clientTagsDenario.get('DENARIO_BOTON_SALIR_GUARDAR')!
        this.buttonsSalvar[1].text = this.clientLogic.clientTagsDenario.get('DENARIO_BOTON_SALIR')!
        this.buttonsSalvar[2].text = this.clientLogic.clientTagsDenario.get('DENARIO_BOTON_CANCELAR')!
        this.alertButtons[0].text = this.clientLogic.clientTagsDenario.get('DENARIO_BOTON_CANCELAR')!
        this.alertButtons[1].text = this.clientLogic.clientTagsDenario.get('DENARIO_BOTON_ACEPTAR')!
      }
    })

    this.subscriberShow = this.clientLogic.showButtons.subscribe((data: Boolean) => {
      this.showHeaderButtos = data;
    });

    this.subscriberDisabled = this.clientLogic.stockValidToSave.subscribe((data: Boolean) => {
      this.disableSendButton = !data;
    });

    this.subscriberToSend = this.clientLogic.stockValidToSend.subscribe((validToSend: Boolean) => {
      this.cannotSendClientStock = !validToSend;
    });
  }



  setsaveOrExitOpen(isOpen: boolean) {
    this.clientLogic.saveOrExitOpen = isOpen;
  }

  setResult(ev: any) {
    console.log('Apretó:' + ev.detail.role);
    if (this.clientLogic.clientNewPotentialClientComponent) {
      if (ev.detail.role === 'confirm') {
        this.alertMessageOpen = false;
        this.potentialClientService.saveSendNewPotentialCliente(true)

      } else {
        this.alertMessageOpen = false;
      }
    }
    if (this.clientLogic.clientLocationComponent) {
      this.alertMessageOpen = false;
      if (ev.detail.role === 'confirm') {
        this.alertMessageOpen = false;

        this.locationService.saveLocation()

      } else {
        this.alertMessageOpen = false;
      }
    }

  }

  goPotentialClient() {
    this.clientLogic.clientListComponent = false;
    this.clientLogic.clientPotentialClientComponent = true;
    this.clientLogic.clienteNuevoBlancoImg = true;
  }

  goNewPotentialClient() {
    this.clientLogic.potentialClient = {} as PotentialClient;
    this.clientLogic.clientPotentialClientComponent = false;
    this.clientLogic.clientNewPotentialClientComponent = true;
  }

  goBack() {
    if (this.clientLogic.newPotentialClientChanged) {
      this.clientLogic.saveOrExitOpen = true;
    } else if (this.clientLogic.clientContainerComponent) {
      this.clientLogic.showBackRoute('clientContainerComponent');
    } else if (this.clientLogic.clientListComponent) {
      this.clientLogic.showBackRoute('clientListComponent');
    } else if (this.clientLogic.clientDetailComponent) {
      this.clientLogic.showBackRoute('clientDetailComponent');
    } else if (this.clientLogic.clientDocumentSaleComponent) {
      this.clientLogic.showBackRoute('clientDocumentSaleComponent');
    } else if (this.clientLogic.clientPotentialClientComponent) {
      this.clientLogic.showBackRoute('clientPotentialClientComponent');
    } else if (this.clientLogic.clientNewPotentialClientComponent) {
      this.clientLogic.showBackRoute('clientNewPotentialClientComponent');
    } else if (this.clientLogic.clientLocationChanged) {
      this.clientLogic.saveOrExitOpen = true;
    } else if (this.clientLogic.clientLocationComponent) {
      this.clientLogic.showBackRoute('clientLocationComponent');
    } else if (this.clientLogic.clientDocumentSaleComponent) {
      this.clientLogic.showBackRoute('clientDocumentSaleComponent');
    }

  }

  saveSendNewPotentialCliente(salvarEnviar: Boolean) {
    this.clientLogic.saveOrExitOpen = false;
    this.clientLogic.newPotentialClientChanged = false;
    if (salvarEnviar) {
      console.log("SALVAR");
      this.potentialClientService.saveSendNewPotentialCliente(false);

    } else {
      console.log("ENVIAR");
      this.mensaje = this.clientLogic.clientTags.get('CLI_DENARIO_CONFIRM_SEND_POTENTIAL_CLIENT')!;
      this.alertMessageOpen = true;
    }

  }

  saveSendLocationFunction() {
    this.mensaje = this.clientLogic.clientTags.get('CLI_DENARIO_CONFIRM_SEND_LOCATION')!;
    this.alertMessageOpen = true;

  }
}
