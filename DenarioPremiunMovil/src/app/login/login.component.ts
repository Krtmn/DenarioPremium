import { Component, OnInit, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { Platform } from '@ionic/angular';

import { ServicesService } from '../services/services.service';
import { FormControl, FormGroup } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { PluginListenerHandle } from '@capacitor/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Device } from '@capacitor/device';
import { GlobalConfigService } from '../services/globalConfig/global-config.service';

import { User } from '../modelos/user';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { Login } from '../modelos/login';
import { MessageService } from 'src/app/services/messageService/message.service';
import { MessageAlert } from '../modelos/tables/messageAlert';
import { LoginLogicService } from '../services/login/login-logic.service';
import { ImageServicesService } from '../services/imageServices/image-services.service';
import { Imagenes } from '../modelos/imagenes';
import { ScreenOrientation, OrientationType } from '@capawesome/capacitor-screen-orientation';
import { Keyboard } from '@capacitor/keyboard';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent implements OnInit {
  public loginLogic = inject(LoginLogicService);

  private messageService = inject(MessageService);
  private synchronization = inject(SynchronizationDBService);
  private globalConfig = inject(GlobalConfigService);
  private services = inject(ServicesService);
  private message = inject(MessageService);

  public database!: SQLiteObject;
  public db!: SQLite;
  private user!: User;
  private deviceInfo!: {};
  private deviceId!: {};
  public isAlertOpen = false;
  public errorMsj = "";
  public alertButtons = ['OK'];
  public showPassword = true;
  public loginDetail!: Login;
  public login!: string;
  public password!: string;
  public messageAlert!: MessageAlert;
  public versionApp!: string;
  public version!: number;
  public subs: any;
  public subsChangeUser: any;
  public fechaCreacion: string = "2000-01-01 00:00:00";
  public downloadFileList: Imagenes[] = [];
  public removeFileList: Imagenes[] = [];
  public listFilesImages: string[] = [];
  public networkListener!: PluginListenerHandle;
  public isIOS: boolean = false; // <-- NUEVA PROPIEDAD
  public showFooter: boolean = true; // <-- NUEVA PROPIEDAD

  async ngOnInit() {
    App.getInfo().then(async (res) => {
      //this.versionApp = res.version;
      this.versionApp = "6.2.3"; //ESTE ES EL CAMPO QUE SE MUESTRA EN EL LOGIN DE LA APP
      this.version = 8;  //ESTE ES EL NUMERO DE VERSION QUE SE USA PARA SABER SI HAY QUE ACTUALIZAR LA BD
      //COLOCA EL PRIMER NUMERO DE VERSIONAPP EN VERSION PARA PODER SABER SI ES MAS NUEVA LA APP
      console.log(res);
      if (localStorage.getItem("versionApp") == null)
        localStorage.setItem("versionApp", this.version.toString());
      else {
        if (Number(this.version) > Number(localStorage.getItem("versionApp"))) {
          (await this.synchronization.getCreateTables()).subscribe((res) => {
            this.loginLogic.dropTables(res).then((res: any) => {
              localStorage.clear();
              localStorage.setItem("versionApp", this.version.toString());
            })
          })
        }
      }
    })

    this.loginDetail = {} as Login;
    if (localStorage.getItem("recuerdame") == "true") {
      this.loginDetail.login = localStorage.getItem("login")!;
      this.loginDetail.password = localStorage.getItem("password")!;
      this.loginDetail.recuerdame = true;
    }

    //si comentan esta lineas se desbloquea la orientacion del telefono
    //window.screen.orientation.lock('portrait') //ya no funciona

    ScreenOrientation.lock({ type: OrientationType.PORTRAIT });

    //subcripcion por si cambian el usuario
    this.subsChangeUser = this.loginLogic.changeUser.subscribe(async (data: Boolean) => {
      //SI LE DAN A ACEPTAR, HAY QUE BORRAR LA BD, GUARDAR EN LOCALSTORAGE EL NUEVO LOGIN Y PASS, 
      //Y SINCRONIZAR CON LOS NUEVOS DATOS
      console.log(data);
      let f = this.loginForm;
      localStorage.setItem("login", f.value.login.trim());
      localStorage.setItem("password", f.value.password);
      (await this.synchronization.getCreateTables()).subscribe((res) => {
        this.loginLogic.dropTables(res).then((res: any) => {
          console.log(res)
          console.log(f);
          localStorage.removeItem("lastUpdate")
          this.validateConnection(f)
          this.subsChangeUser.unsubscribe();
        })
      })
    })



    this.deviceInfo = await Device.getInfo();
    this.deviceId = await Device.getId();
    //console.log(this.deviceInfo, this.deviceId);
    this.isIOS = this.platform.is('ios'); // <-- DETECTA SI ES iOS

    Keyboard.addListener('keyboardWillShow', () => {
      this.showFooter = false;
    });
    Keyboard.addListener('keyboardWillHide', () => {
      this.showFooter = true;
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe()
    this.subsChangeUser.unsubscribe()
  }

  constructor(
    private navController: NavController,
    private sqlite: SQLite,
    private platform: Platform
  ) {
    this.ngOnInit();


  }
  loginForm = new FormGroup({
    login: new FormControl(),
    password: new FormControl(),
    recuerdame: new FormControl(),
  });

  /* validateConnection(f: NgForm) { */
  validateConnection(f: FormGroup) {
    this.message.showLoading().then(() => {

      if (localStorage.getItem("connectionType") == "wifi" || localStorage.getItem("connectionType") == "cellular") {
        //HAY CONEXION
        this.onLogin(f, this.deviceInfo, this.deviceId, true);
      } else if (localStorage.getItem("lastUpdate") != null && localStorage.getItem("lastUpdate") != "2000-01-01 00:00:00.000") {
        this.onLogin(f, this.deviceInfo, this.deviceId, false);

      } else {
        this.messageAlert = new MessageAlert(
          "Denario Premium",
          "Debe conectarse el celular a una red Wifi o señal de datos"
        );
        this.messageService.alertModal(this.messageAlert);
      }
    });

  }

  onLogin(f: FormGroup, deviceInfo: {}, deviceId: {}, conexion: boolean) {
    let login = "";
    //conexion = false; //descomentar para probar sin conexion
    if (f.value.login != undefined) {
      login = f.value.login.trim();
    }
    if (login == "" || f.value.password == "" || login == undefined || f.value.password == undefined) {
      this.message.hideLoading();
      this.messageAlert = new MessageAlert(
        "Denario Premium",
        "Usuario y/o password no pueden ser vacios"
      );
      /* this.message.hideLoading(); */
      this.messageService.alertModal(this.messageAlert);
    } else if (localStorage.getItem("login") != login && localStorage.getItem("login") != null) {
      this.message.hideLoading();
      this.messageAlert = new MessageAlert(
        "Denario Premium",
        "Está intentando sincronizar con un usuario que es diferente al previamente ingresado," +
        " de aceptar la sincronización todos los datos anteriores serán borrados. ¿Está de acuerdo?"
      );

      this.messageService.alertModalModule(this.messageAlert, "login");


    } else if (conexion) {
      this.subs = this.services.onLogin(f.value, deviceInfo, deviceId).subscribe({
        next: (result) => {
          if (result.errorCode == '000') {
            if (localStorage.getItem("recuerdame") == "true") {

              localStorage.setItem("password", f.value.password);
            } else {

              localStorage.removeItem("password");
            }

            localStorage.setItem("login", login);
            localStorage.setItem("token", result.jwtAuthResponse.tokenDeAcceso);
            localStorage.setItem("lastUpdate", result.lastUpdate);
            this.globalConfig.setVars(result.variablesConfiguracion)
            //localStorage.setItem("globalConfiguration", JSON.stringify(result.variablesConfiguracion));
            localStorage.setItem("idUser", result.idUser.toString());
            localStorage.setItem("coUser", result.coUser);

            this.user = result;
            localStorage.setItem("user", JSON.stringify(this.user));
            this.synchronization.initDb(this.user, conexion);


          } else if (result.errorCode == '104') {
            this.message.hideLoading();
            this.messageAlert = new MessageAlert(
              "Denario Premium",
              "Usuario y/o contraseña incorrectos."
            );
            this.messageService.alertModal(this.messageAlert);
          }

        },
        complete: () => {
          console.info('complete')
        },
        error: (e) => {
          this.message.hideLoading();

          this.messageAlert = new MessageAlert(
            "Denario Premium",
            "Ocurrió un error de comunicación con el servidor, verifique cobertura e intente nuevamente."
          );
          this.messageService.alertModal(this.messageAlert);
          /*           this.message.hideLoading();
           */
          console.error(e);
        },
      })
    } else {
      if (localStorage.getItem("recuerdame") == "true") {
        localStorage.setItem("login", login);
        localStorage.setItem("password", f.value.password);
      } else {

        localStorage.removeItem("password");
      }
      let user = {} as User;
      this.globalConfig.setVars([]);
      this.synchronization.initDb(user, conexion);
/*       this.message.hideLoading();
 */    }
  }

  exitApp() {
    /*  this.navController.navigateForward("login"); */
    App.exitApp();
  }

  openDb() {
    this.db = new SQLite();
    this.sqlite.create({
      name: 'denarioPremium',
      location: 'default'
    }).then((db: SQLiteObject) => {
      this.database = db;

    }).catch(e => console.log(e));
  }

  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
  }

  checked(event: any, f: FormGroup) {
    if (event) {
      /*  localStorage.setItem("login", login);
       localStorage.setItem("password", f.value.password); */
      localStorage.setItem("recuerdame", "true");
    } else {
      if (localStorage.getItem("recuerdame") == "true" && localStorage.getItem("recuerdame") != "null" && localStorage.getItem("recuerdame") != null) {

        /* localStorage.removeItem("login");
        localStorage.removeItem("password"); */
        localStorage.removeItem("recuerdame");
      }
    }
  }

}