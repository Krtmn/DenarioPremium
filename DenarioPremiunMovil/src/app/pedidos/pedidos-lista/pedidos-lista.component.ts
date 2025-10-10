import { Component, OnInit, inject } from '@angular/core';
import { PedidosService } from '../pedidos.service';
import { Orders } from 'src/app/modelos/tables/orders';
import { ItemListaPedido } from '../item-lista-pedido';
import { DELIVERY_STATUS_SAVED, DELIVERY_STATUS_SENT, DELIVERY_STATUS_TO_SEND } from 'src/app/utils/appConstants';
import { MessageService } from 'src/app/services/messageService/message.service';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-pedidos-lista',
    templateUrl: './pedidos-lista.component.html',
    styleUrls: ['./pedidos-lista.component.scss'],
    standalone: false
})
export class PedidosListaComponent implements OnInit {
  orderServ = inject(PedidosService);
  geoLoc = inject(GeolocationService);
  DELIVERY_STATUS_SAVED = DELIVERY_STATUS_SAVED; //para usarlo en el html hay que hacer esto.
  public alertDelete = false;
  public headerDelete = '';
  public mensajeDelete = '';

  public orderDelete = '';
  public searchPlaceholder = '';
  public orderDeleteIndex = -1;

  public showCoOrder = false;



  //listaPedidos: ItemListaPedido[] = [];
  searchText: string = '';

  backButtonSubscription: Subscription = this.platform.backButton.subscribeWithPriority(10, () => {
    //console.log('backButton was called!');
    this.router.navigate(['pedidos']);
  });

  public statusOrderNames: { [idOrder: number]: string } = {};

  constructor(
    private platform: Platform,
    private router: Router,
  ) {

  }

  async ngOnInit() {
    this.searchPlaceholder = this.getTag("PED_BUSQUEDA");
    if (this.orderServ.userMustActivateGPS) {
      this.orderServ.coordenadas = "";
      this.geoLoc.getCurrentPosition().then(xy => {
      if (xy.length > 0) {
        this.orderServ.coordenadas = xy;
      }
      })
    } 
  }

  ngOnDestroy() {
    this.backButtonSubscription.unsubscribe();
  }

  selectOrder(order: ItemListaPedido) {
    this.orderServ.pedidoModificable = (order.st_order == DELIVERY_STATUS_SAVED);
    if (this.orderServ.userMustActivateGPS &&
      (this.orderServ.pedidoModificable || this.orderServ.copiandoPedido)) {
        if (!this.orderServ.coordenadas || this.orderServ.coordenadas.length == 0) {
          this.geoLoc.getCurrentPosition().then(xy => {
            if (xy.length > 0) {
              this.orderServ.coordenadas = xy;
              this.openOrder(order);
            }
      })
    }else{
      this.openOrder(order);
    }
    } else {
      this.openOrder(order);
    }
  }


  openOrder(label: ItemListaPedido) {
    //console.log(label);
    this.orderServ.getPedido(label.co_order).then(order => {
      //console.log(order);
      this.orderServ.openOrder = true;

      if (!order) {
        console.error('No se encontro pedido!')
      } else {
        this.orderServ.abrirPedido(order);
      }
    });

  }


  getStatusOrderName(status: number, naStatus: string) {
    switch (status) {
      case DELIVERY_STATUS_SAVED: return this.getTag("PED_STATUS_SAVED");
      case DELIVERY_STATUS_TO_SEND: return this.getTag("PED_STATUS_TO_SEND");
      case DELIVERY_STATUS_SENT: return this.getTag("PED_STATUS_SENT");
      case 6: return naStatus;



      default: return '';
    }
  }

  showAlertDelete(order: ItemListaPedido, index: number) {
    this.headerDelete = this.getTag("PED_NOMBRE_MODULO");
    this.mensajeDelete = this.getTag("PED_ELIMINAR_PEDIDO");
    this.orderDelete = order.co_order;
    this.orderDeleteIndex = index;


    this.setAlertDelete(true);

  }

  deleteOrder() {
    this.orderServ.deleteOrder(this.orderDelete).then(result => {
      this.orderServ.listaPedidos.splice(this.orderDeleteIndex, 1);
      this.ngOnInit();
    });
  }

  handleInput(event: any) {
    this.searchText = event.target.value.toLowerCase();
  }

  setAlertDelete(alert: boolean) {
    this.alertDelete = alert;
  }

  getTag(tagName: string) {
    var tag = this.orderServ.tags.get(tagName);
    if (tag == undefined) {
      console.log("Error al buscar tag " + tagName);
      tag = '';
    }
    return tag;
  }

  public buttonsDelete: { text: string; role: string; handler: () => void; }[] =
    [
      {
        text: 'Cancelar',
        role: 'cancel',
        handler: () => {
          console.log('Alert canceled');
          this.setAlertDelete(false);


        },
      },
      {
        text: 'Aceptar',
        role: 'confirm',
        handler: () => {
          console.log('Alert confirmed');
          this.deleteOrder();
          this.setAlertDelete(false);
        },
      },
    ];

}
