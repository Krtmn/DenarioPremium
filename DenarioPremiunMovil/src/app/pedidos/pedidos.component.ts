import { Component, inject, } from '@angular/core';
import { PedidosService } from './pedidos.service';
import { Router } from '@angular/router';
import { EnterpriseService } from '../services/enterprise/enterprise.service';
import { Enterprise } from '../modelos/tables/enterprise';
import { MessageService } from 'src/app/services/messageService/message.service';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { GeolocationService } from '../services/geolocation/geolocation.service';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ProductStructureService } from '../services/productStructures/product-structure.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';

@Component({
    selector: 'app-pedidos',
    templateUrl: './pedidos.component.html',
    styleUrls: ['./pedidos.component.scss'],
    standalone: false
})
export class PedidosComponent {
  public pedidoComponent: Boolean = false;
  public pedidosComponent: Boolean = true;

  pedidoService = inject(PedidosService);
  enterpriseServ = inject(EnterpriseService);
  geoLoc = inject(GeolocationService);
  prodStructServ = inject(ProductStructureService);
  dbServ = inject(SynchronizationDBService);


  backButtonSubscription: Subscription = this.platform.backButton.subscribeWithPriority(10, () => {
    //console.log('backButton was called!');
    this.router.navigate(['home']);
  });

  constructor(
    private router: Router,
    private platform: Platform,
  ) {

    /*
    this.platform.backButton.subscribeWithPriority(10, () => {
      //Disable default backbutton behavior
      document.addEventListener("backbutton", function(event) {
        event.preventDefault(); event.stopPropagation();
      }, false);
      //console.log('backButton was called!');
      this.router.navigate(['home']);
    });
    */
  }

  ngOnDestroy() {
    this.backButtonSubscription.unsubscribe();
  }

  ngOnInit() {
    this.enterpriseServ.setup(this.dbServ.getDatabase()).then(() => {
      this.pedidoService.empresaSeleccionada = this.enterpriseServ.defaultEnterprise();
      //this.pedidoService.setup();
    });
    if (this.pedidoService.userMustActivateGPS) {
      this.pedidoService.coordenadas = "";
      this.geoLoc.getCurrentPosition().then(xy => {
      if (xy.length > 0) {
        this.pedidoService.coordenadas = xy;
      }
      })
    } 
  }

  getTag(tagName: string) {
    var tag = this.pedidoService.tags.get(tagName);
    if (tag == undefined) {
      console.log("Error al buscar tag " + tagName);
      tag = '';
    }
    return tag;
  }



  nuevoPedido() {
    if (this.pedidoService.userMustActivateGPS) {
      if (!this.pedidoService.coordenadas || this.pedidoService.coordenadas.length == 0) {
      this.geoLoc.getCurrentPosition().then(xy => {
        if (xy.length > 0) {
          this.pedidoService.coordenadas = xy;
          this.goToNuevoPedido();
        }
      })
    }else{
      this.goToNuevoPedido();
    }
    } else {
      this.goToNuevoPedido();
    }
  }

  goToNuevoPedido() {
    this.pedidoService.pedidoModificable = true;
    this.pedidoService.openOrder = false;
    this.pedidoService.copiandoPedido = false;
    this.router.navigate(['pedido']);
  }

  buscarPedido() {
    this.pedidoService.getListaPedidos().then(resp => {

      this.pedidoService.pedidoModificable = false;
      this.pedidoService.openOrder = true;
      this.pedidoService.copiandoPedido = false;
      this.router.navigate(['pedidosLista']);
    });

  }

  copiarPedido() {
    this.pedidoService.pedidoModificable = true;
    this.pedidoService.openOrder = true;
    this.pedidoService.copiandoPedido = true;
    this.router.navigate(['pedidosLista']);
  }
}
