import { inject, Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { NativeSettings, AndroidSettings } from 'capacitor-native-settings';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ServicesService } from '../services.service';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private message = inject(MessageService);
  private service =  inject(ServicesService);
  private permiso: boolean = false;
  private posicion!: Position //la ultima posicion tomada
  tituloMensaje = '';
  contenidoMensaje = '';
 

  messageRecommend: MessageAlert = new MessageAlert(
    this.tituloMensaje,
    this.contenidoMensaje
  )

  constructor(


    ) {
      
     }


  setMessage(){
    var tm = this.service.tags.get('DENARIO_HEADER_ALERTA');
      if(tm == undefined){
        tm = '';
      }
      this.tituloMensaje = tm;
      var tc = this.service.tags.get('DENARIO_MSG_GPS');
      if(tc == undefined){
        tc = '';
      }
      this.contenidoMensaje = tc;

      this.messageRecommend = new MessageAlert(
        this.tituloMensaje,
        this.contenidoMensaje
      )
  }
  async getGeoLocPermissions(){
    if(this.tituloMensaje.length == 0 || this.contenidoMensaje.length == 0){
      this.setMessage();
    }
      return Geolocation.checkPermissions().then(permiso => {
        if(permiso?.location != 'granted'){
          return Geolocation.requestPermissions().then(permiso => {
            if (permiso?.location != 'granted'){
              this.message.alertCustomBtn(this.messageRecommend, this.buttonsAppDetails);
              this.permiso =  false;
            }else{
              this.permiso =  true;
            }
            return this.permiso;
          });
        }else{
          this.permiso = true;
          return this.permiso;
        }
      }).catch((error) => {
        if(error.message == 'Location services are not enabled'){
          this.message.alertCustomBtn(this.messageRecommend, this.buttonsOpenSettings);
        }else{
          this.message.alertCustomBtn(this.messageRecommend, this.buttonsAppDetails);
        }
              
        this.permiso = false;
        return this.permiso;
      });


  }

  private cachedCoords: string = "";
  private lastFetchTime: number = 0;
  private CACHE_DURATION_MS = 60000; // 1 minuto

  async getCurrentPosition(): Promise<string> {
    // Si la última ubicación es reciente, la devolvemos
    const now = Date.now();
    if (this.cachedCoords && (now - this.lastFetchTime < this.CACHE_DURATION_MS)) {
      return this.cachedCoords;
    }

    // Verificamos permisos solo si no los tenemos
    if (this.permiso === undefined || this.permiso === false) {
      this.permiso = await this.getGeoLocPermissions();
    }

    if (this.permiso) {
      try {
        // Usamos Promise.race para limitar el tiempo de espera
        const position = await Promise.race([
          Geolocation.getCurrentPosition(),
          new Promise((_, reject) => setTimeout(() => reject("timeout"), 5000)) // 5 segundos
        ]);
        const pos = position as Position;
        const coords = pos.coords.latitude.toString() + "," + pos.coords.longitude.toString();
        this.cachedCoords = coords;
        this.lastFetchTime = now;
        return coords;
      } catch (e) {
        // Si hay error o timeout, devolvemos la última ubicación si existe
        return this.cachedCoords || "";
      }
    } else {
      return "";
    }
  }


   getLatestPosition(){
    //solo para usar luego de que getCurrentPosition devuelva un string no vacio
    return this.posicion;
  }

  static openSettings(){
    return NativeSettings.openAndroid({
      option: AndroidSettings.Location
    });
  }

  static openAppDetails(){
    return NativeSettings.openAndroid({
      option: AndroidSettings.ApplicationDetails
    });
  }

    
   
 

  public buttonsOpenSettings = [
    {
      text: 'Aceptar',
      role: 'confirm',
      handler: () => {
        //console.log('Alert confirmed');
        GeolocationService.openSettings();
        
      },
    },
  ];

  public buttonsAppDetails = [
    {
      text: 'Aceptar',
      role: 'confirm',
      handler: () => {
        //console.log('Alert confirmed');
        GeolocationService.openAppDetails();
        
      },
    },
  ];
}
