import { Component, inject, OnInit } from '@angular/core';
import { COLOR_AMARILLO, COLOR_GRIS, COLOR_LILA, COLOR_VERDE } from '../utils/appConstants';
import { ServicesService } from '../services/services.service';
import { MessageService } from '../services/messageService/message.service';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home-sidebar',
  templateUrl: './home-sidebar.component.html',
  styleUrls: ['./home-sidebar.component.scss'],
  standalone: false
})
export class HomeSidebarComponent implements OnInit {
  public services = inject(ServicesService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  public alertMessageOpenSend: Boolean = false;

  constructor(
    private navController: NavController,
  ) { }

  ngOnInit() {
    let aceptar = this.services.tags.get("DENARIO_BOTON_ACEPTAR");
    let cancelar = this.services.tags.get("DENARIO_BOTON_CANCELAR");
    if (aceptar === undefined) {
      aceptar = "Aceptar";
    }
    if (cancelar === undefined) {
      cancelar = "Cancelar";
    }

    this.alertButtonsSincronice[0].text = cancelar;
    this.alertButtonsSincronice[1].text = aceptar;
  }

  async goToModule(module: any) {

    if (module.routerLink == "/synchronization") {
      if (localStorage.getItem("connected") === "false") {
        var msj = this.services.tags.get("DENARIO_ERROR_SYNCRO");
        if (msj === undefined) {
          msj = "";
        }
        this.messageService.transaccionMsjModalNB(msj);

      } else {
        this.alertMessageOpenSend = true;
      }
    } else {
      this.router.navigate([module.routerLink]);
    }
  }

  setResult(ev: any) {
    console.log('Apretó:' + ev.detail.role);
    if (ev.detail.role === 'confirm') {
      this.alertMessageOpenSend = false;
      localStorage.setItem("sincronizarHome", "true");
      //this.synchronizationServices.createTables(JSON.parse(localStorage.getItem("user")!), true);
      /* this.router.navigate(["synchronization"]); */
      this.navController.navigateForward("synchronization/sincronizar")

    } else {
      this.alertMessageOpenSend = false;
    }
  }


  moduloSynchro = {
    "name": this.services.tags.get("HOME_SINCRONIZAR"),
    "imgIcon": "../../../assets/icon/sincronizar_40_.svg",
    "routerLink": "/synchronization",
    "letterColor": COLOR_GRIS

  }

  modulosDatos = [
    {
      "name": this.services.tags.get("HOME_VENDEDORES"),
      "imgIcon": "../../../assets/icon/vendedoresNuevo.svg",
      "routerLink": "/vendedores",
      "letterColor": COLOR_LILA

    },
    {
      "name": this.services.tags.get("HOME_PRODUCTOS"),
      "imgIcon": "../../../assets/icon/productosNuevo.svg",
      "routerLink": "/productos",
      "letterColor": COLOR_AMARILLO

    },
    {
      "name": this.services.tags.get("HOME_CLIENTES"),
      "imgIcon": "../../../assets/icon/clientesNuevo.svg",
      "routerLink": "/clientes",
      "letterColor": COLOR_VERDE

    },
  ]

  modulosTransacciones = [
    {
      "name": this.services.tags.get("HOME_VISITAS"),
      "imgIcon": "../../../assets/icon/visitasNuevo.svg",
      "routerLink": "/visitas",
      "letterColor": COLOR_LILA
    },
    {
      "name": this.services.tags.get("HOME_PEDIDOS"),
      "imgIcon": "../../../assets/icon/pedidosNuevo.svg",
      "routerLink": "/pedidos",
      "letterColor": COLOR_VERDE

    },
    {
      "name": this.services.tags.get("HOME_INVENTARIO"),
      "imgIcon": "../../../assets/icon/inventarioNuevo.svg",
      "routerLink": "/inventarios",
      "letterColor": COLOR_AMARILLO

    },
    {
      "name": this.services.tags.get("HOME_COBROS"),
      "imgIcon": "../../../assets/icon/cobrosNuevo.svg",
      "routerLink": "/cobros",
      "letterColor": COLOR_VERDE

    },



    {
      "name": this.services.tags.get("HOME_DEPOSITOS"),
      "imgIcon": "../../../assets/icon/depositosNuevo.svg",
      "routerLink": "/depositos",
      "letterColor": COLOR_LILA

    },
    {
      "name": this.services.tags.get("HOME_DEVOLUCIONES"),
      "imgIcon": "../../../assets/icon/devolucionesNuevo.svg",
      "routerLink": "/devoluciones",
      "letterColor": COLOR_AMARILLO

    },

  ]



  public alertButtonsSincronice = [
    {
      text: '',
      role: 'cancel'
    },
    {
      text: '',
      role: 'confirm'
    },
  ];

}
