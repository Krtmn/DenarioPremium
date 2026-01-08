import { Component, inject } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { LoginLogicService } from './services/login/login-logic.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { ConversionService } from './services/conversion/conversion.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Enterprise } from './modelos/tables/enterprise';
import { GlobalConfigService } from './services/globalConfig/global-config.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  public networkStatus!: any;
  public netWork!: any;

  public loginService = inject(LoginLogicService);

  constructor(
    private platform: Platform,
    private router: Router
  ) {}

  async ngOnInit() {
    // ocultar StatusBar en iOS si aplica
    if (this.platform.is('ios')) {
      StatusBar.hide();
    }

    // registrar listener de red
    this.listenerNetwork();
    this.netWork = await Network.getStatus();
    localStorage.setItem("connected", String(this.netWork.connected));
    localStorage.setItem("connectionType", String(this.netWork.connectionType));

    // Bloquear el botón físico "back" a nivel global:
    // usamos alta prioridad para sobreescribir comportamientos por defecto.
    try {
      // subscribeWithPriority está disponible en Ionic Platform
      // pasamos un callback vacío para evitar la acción por defecto.
      (this.platform as any).backButton.subscribeWithPriority(9999, () => {
        // Intencionalmente vacío — bloquea el back físico en toda la app.
      });
    } catch (e) {
      // Fallback si la plataforma no expone subscribeWithPriority
      this.platform.backButton.subscribe(() => {
        // Intencionalmente vacío
      });
    }

    // Nota: si quieres permitir "back" en rutas concretas, revisa la sección "Alternativas"
  }

  listenerNetwork() {
    Network.addListener('networkStatusChange', status => {
      this.networkStatus = status;
      localStorage.setItem("connected", String(status.connected));
      localStorage.setItem("connectionType", String(status.connectionType));
    });
  }
}
