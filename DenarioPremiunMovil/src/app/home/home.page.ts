import { Component, inject, OnInit } from '@angular/core';
import { App } from '@capacitor/app';
import { NavController } from '@ionic/angular';
import { COLOR_AMARILLO, COLOR_GRIS, COLOR_LILA, COLOR_VERDE } from '../utils/appConstants';
import { CurrencyService } from '../services/currency/currency.service';
import { CurrencyEnterprise } from '../modelos/tables/currencyEnterprise';
import { AutoSendService } from '../services/autoSend/auto-send.service';
import { ServicesService } from '../services/services.service';
import { AdjuntoService } from '../adjuntos/adjunto.service';
import { ImageServicesService } from '../services/imageServices/image-services.service';
import { MessageService } from '../services/messageService/message.service';
import { MessageComponent } from 'src/app/message/message.component';
import { Router } from '@angular/router';
import { GlobalConfigService } from '../services/globalConfig/global-config.service';
import { GeolocationService } from '../services/geolocation/geolocation.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { SynchronizationComponent } from '../synchronization/synchronization.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})

export class HomePage implements OnInit {
  private currencyServices = inject(CurrencyService);
  private autoSend = inject(AutoSendService);
  public adjunt = inject(AdjuntoService);
  public services = inject(ServicesService);
  private imageServices = inject(ImageServicesService);
  private messageService = inject(MessageService);
  private config = inject(GlobalConfigService);
  private geoServ = inject(GeolocationService);
  public synchronizationServices = inject(SynchronizationDBService)
  private router = inject(Router);

  public sub!: object;
  public conexion!: string;
  public isAlertOpen = false;
  public mensaje!: string;
  public alertButtons = ['OK'];
  public interval!: any;
  public user: any = {};

  public apiKey!: string;
  public localCurrency!: CurrencyEnterprise;
  public hardCurrency!: CurrencyEnterprise;
  public ruta!: string;
  public modulos!: { id: number, name: string | undefined; imgIcon: string; routerLink: string; letterColor: string; }[];
  public modulosTransportista!: { id: number, name: string | undefined; imgIcon: string; routerLink: string; letterColor: string; }[];
  /* public modulos: any[] = []; */
  public fechaCreacion: string = "2000-01-01 00:00:00";
  public userMustActivateGPS: boolean = false;


  public id!: string;
  public alertMessageOpenSend: Boolean = false;

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
  constructor(
    private navController: NavController,
  ) {

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (e) {
        this.user = {};
      }
    }

    this.autoSend.ngOnInit();

    if (localStorage.getItem("connected") === "false") {
      this.interval = setTimeout(() => {
        this.messageService.hideLoading()
        this.isAlertOpen = true;
        this.mensaje = "Se ha conectado localmente sin señal de datos, no se ha podido sincronizar.";
      }, 1000);
    } else {
      this.isAlertOpen = true;
      this.messageService.hideLoading();
    }
    //this.userMustActivateGPS = this.config.get("userMustActivateGPS").toLowerCase() === "true";

    this.currencyServices.setup(this.synchronizationServices.getDatabase()).then(() => {
      this.localCurrency = this.currencyServices.getLocalCurrency();
      this.hardCurrency = this.currencyServices.getHardCurrency();
    })

    this.modulos = [
      {
        id: 0,
        "name": this.user.transportista ? this.services.tags.get("HOME_DESPACHOS") : this.services.tags.get("HOME_VISITAS"),
        "imgIcon": "../../../assets/icon/visitasNuevo.svg",
        "routerLink": "/visitas",
        "letterColor": COLOR_LILA,
      },
      {
        id: 1,
        "name": this.services.tags.get("HOME_INVENTARIO"),
        "imgIcon": "../../../assets/icon/inventarioNuevo.svg",
        "routerLink": "/inventarios",
        "letterColor": COLOR_AMARILLO
      },
      {
        id: 2,
        "name": this.services.tags.get("HOME_PEDIDOS"),
        "imgIcon": "../../../assets/icon/pedidosNuevo.svg",
        "routerLink": "/pedidos",
        "letterColor": COLOR_VERDE
      },
      {
        id: 3,
        "name": this.services.tags.get("HOME_DEVOLUCIONES"),
        "imgIcon": "../../../assets/icon/devolucionesNuevo.svg",
        "routerLink": "/devoluciones",
        "letterColor": COLOR_AMARILLO
      },
      {
        id: 4,
        "name": this.services.tags.get("HOME_COBROS"),
        "imgIcon": "../../../assets/icon/cobrosNuevo.svg",
        "routerLink": "/cobros",
        "letterColor": COLOR_VERDE
      },
      {
        id: 5,
        "name": this.services.tags.get("HOME_DEPOSITOS"),
        "imgIcon": "../../../assets/icon/depositosNuevo.svg",
        "routerLink": "/depositos",
        "letterColor": COLOR_LILA
      },
      {
        id: 6,
        "name": this.services.tags.get("HOME_VENDEDORES"),
        "imgIcon": "../../../assets/icon/vendedoresNuevo.svg",
        "routerLink": "/vendedores",
        "letterColor": COLOR_LILA
      },
      {
        id: 7,
        "name": this.services.tags.get("HOME_PRODUCTOS"),
        "imgIcon": "../../../assets/icon/productosNuevo.svg",
        "routerLink": "/productos",
        "letterColor": COLOR_AMARILLO
      },
      {
        id: 8,
        "name": this.services.tags.get("HOME_CLIENTES"),
        "imgIcon": "../../../assets/icon/clientesNuevo.svg",
        "routerLink": "/clientes",
        "letterColor": COLOR_VERDE
      },
      {
        id: 9,
        "name": '',
        "imgIcon": "",
        "routerLink": "",
        "letterColor": ""
      },
      {
        id: 10,
        "name": this.services.tags.get("HOME_SINCRONIZAR"),
        "imgIcon": "../../../assets/icon/sincronizar_40_.svg",
        "routerLink": "/synchronization",
        "letterColor": COLOR_GRIS
      },
      {
        id: 11,
        "name": '',
        "imgIcon": "",
        "routerLink": "",
        "letterColor": ""
      },
    ]

    // Validar el parámetro promotor en el usuario de localStorage
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
        if (this.user.transportista) {
          this.modulosTransportista = this.modulos.filter(m => m.id === 0 || m.id === 8 || m.id === 10);

          this.imageServices.getServerPdfList().then(obs => {
            obs.subscribe({
              complete: () => {
                /* if (this.imageServices.downloadFileList.length > 0) { */
                // Navega primero
                // a la página de inicio y luego descarga las imágenes
                /* this.router.navigate(['home']).then(() => {
                  //this.imageServices.download(this.imageServices.downloadFileList);
                  this.imageServices.downloadWithConcurrency(this.imageServices.downloadFileList);
                }); */
                /* } else {
                  this.router.navigate(['home']);
                } */
                this.getListFilesPremiumDispatch();
              }
            });
          });
        }
      } catch (e) {
        this.user = {};
      }
    }
  }
  getListFilesPremiumDispatch() {
    console.log("getListFilesPremiumDispatch");
    this.imageServices.downloadPdfFilesWithConcurrency(3); // Puedes ajustar el número de descargas simultáneas
  }

  ngOnInit(): void {
    this.imageServices.uploadPhotos();
    console.log(this.services.tags)

    this.alertButtonsSincronice[0].text = "Cancelar"
    this.alertButtonsSincronice[1].text = "Aceptar"

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
  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
  }

  exitApp() {
    /*  this.navController.navigateForward("login"); */
    App.exitApp();
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

}
