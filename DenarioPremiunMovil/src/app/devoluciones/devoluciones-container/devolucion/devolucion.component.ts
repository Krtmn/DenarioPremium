import { Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { ClienteSelectorComponent } from 'src/app/cliente-selector/cliente-selector.component';
import { Client } from 'src/app/modelos/tables/client';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { ReturnLogicService } from 'src/app/services/returns/return-logic.service';
import { DELIVERY_STATUS_SENT, DELIVERY_STATUS_TO_SEND } from 'src/app/utils/appConstants';

@Component({
    selector: 'app-devolucion',
    templateUrl: './devolucion.component.html',
    styleUrls: ['./devolucion.component.scss'],
    standalone: false
})
export class DevolucionComponent implements OnInit {


  enterpriseServ = inject(EnterpriseService);
  returnLogic = inject(ReturnLogicService);
  geoServ = inject(GeolocationService);

  @Input()
  devolucionTags = new Map<string, string>([]);
  @ViewChild(ClienteSelectorComponent)
  selectorCliente!: ClienteSelectorComponent;

  listaEmpresa: Enterprise[] = [];
  empresaSeleccionada!: Enterprise;
  cliente!: Client;
  segment: string = 'default';
  nombreCliente: string = "";
  returnValid: Boolean = false;
  botonAgregar: Boolean = true;
  devolucion: Boolean = true;
  pedido: Boolean = false;


  constructor() { }

  ngOnInit() {
    this.botonAgregar = !this.returnLogic.returnSent;
    if(this.returnLogic.newReturn.stDelivery == undefined){
      //fix temporal para que las devoluciones viejas no fallen
      this.returnLogic.newReturn.stDelivery = this.returnLogic.newReturn.stReturn;
    }      

    if(!this.returnLogic.userMustActivateGPS && (this.returnLogic.newReturn.stDelivery !== DELIVERY_STATUS_TO_SEND &&
       this.returnLogic.newReturn.stDelivery !== DELIVERY_STATUS_SENT &&
      this.returnLogic.newReturn.stDelivery !== 6)){ 
    this.geoServ.getCurrentPosition().then(coords => { this.returnLogic.newReturn.coordenada = coords });
    }
    this.returnLogic.returnValid.subscribe((data: Boolean) => {
      this.returnValid = data;
    });
  }

  onChangeTab(tab: string) {
    this.segment = tab;
  }

}
