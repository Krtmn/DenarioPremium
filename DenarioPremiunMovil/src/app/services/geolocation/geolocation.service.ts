import { inject, Injectable } from '@angular/core';
import { Geolocation, PositionOptions, Position } from '@capacitor/geolocation';
import { NativeSettings, AndroidSettings } from 'capacitor-native-settings';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ServicesService } from '../services.service';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private message = inject(MessageService);
  private service = inject(ServicesService);
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


  setMessage() {
    var tm = this.service.tags.get('DENARIO_HEADER_ALERTA');
    if (tm == undefined) {
      tm = '';
    }
    this.tituloMensaje = tm;
    var tc = this.service.tags.get('DENARIO_MSG_GPS');
    if (tc == undefined) {
      tc = '';
    }
    this.contenidoMensaje = tc;

    this.messageRecommend = new MessageAlert(
      this.tituloMensaje,
      this.contenidoMensaje
    )
  }
  async getGeoLocPermissions() {
    if (this.tituloMensaje.length == 0 || this.contenidoMensaje.length == 0) {
      this.setMessage();
    }
    return Geolocation.checkPermissions().then(permiso => {
      if (permiso?.location != 'granted') {
        return Geolocation.requestPermissions().then(permiso => {
          if (permiso?.location != 'granted') {
            this.message.alertCustomBtn(this.messageRecommend, this.buttonsAppDetails);
            this.permiso = false;
          } else {
            this.permiso = true;
          }
          return this.permiso;
        });
      } else {
        this.permiso = true;
        return this.permiso;
      }
    }).catch((error) => {
      if (error.message == 'Location services are not enabled') {
        this.message.alertCustomBtn(this.messageRecommend, this.buttonsOpenSettings);
      } else {
        this.message.alertCustomBtn(this.messageRecommend, this.buttonsAppDetails);
      }

      this.permiso = false;
      return this.permiso;
    });


  }

  /**
   * Safe wrapper around Geolocation.getCurrentPosition:
   * - solicita permisos si es necesario
   * - reintenta N veces en caso de 'location unavailable'
   * - devuelve null en fallos controlados
   */
  async getCurrentPositionSafe(options?: PositionOptions, retries = 2, delayMs = 800): Promise<Position | null> {
    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...(options || {}) };

    try {
      // Intentar solicitar permisos (no falla si ya están concedidos)
      try {
        await Geolocation.requestPermissions();
      } catch (permErr) {
        console.warn('[GeolocationService] requestPermissions failed or not supported:', permErr);
      }

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const pos = await Geolocation.getCurrentPosition(opts);
          return pos;
        } catch (err: any) {
          const msg = (err && (err.message || err))?.toString() || 'unknown';
          console.warn(`[GeolocationService] getCurrentPosition attempt ${attempt} error:`, msg);

          this.setMessage();
          // Si es error no recuperable, salir inmediatamente
          // Mensajes típicos: "location unavailable", "Permission denied", "Location services are disabled"
          if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('disabled')) {
            if( msg.toLowerCase().includes('disabled')){
              this.message.alertCustomBtn(this.messageRecommend, this.buttonsOpenSettings);
            }else{
              if( msg.toLowerCase().includes('denied')){
                this.message.alertCustomBtn(this.messageRecommend, this.buttonsAppDetails);
              }
            }
            // No intentar más, devolver null para que los llamantes manejen el caso
            return null;
          }

          // Si estamos en el último intento, devolver null
          if (attempt === retries) {
            return null;
          }

          // Esperar un poco antes de reintentar
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    } catch (outerErr) {
      console.error('[GeolocationService] unexpected error in getCurrentPositionSafe:', outerErr);
      return null;
    }

    return null;
  }

  async getCurrentPosition() {
    /// Delegamos a la versión segura que retorna Position | null
    const pos = await this.getCurrentPositionSafe();
    if (!pos) {
      // normalizar a cadena vacía si no hay posición
      return "";
    }

    // guardamos la posición y limpiamos luego
    this.posicion = pos;
    const coords = `${pos.coords.latitude.toString()},${pos.coords.longitude.toString()}`;

    // asíncronamente resetear cached position y permiso en 60s
    setTimeout(() => {
      this.posicion = null!;
      this.permiso = false;
    }, 60000);

    return coords;
  }


  getLatestPosition() {
    //solo para usar luego de que getCurrentPosition devuelva un string no vacio
    return this.posicion;
  }

  static openSettings() {
    return NativeSettings.openAndroid({
      option: AndroidSettings.Location
    });
  }

  static openAppDetails() {
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
