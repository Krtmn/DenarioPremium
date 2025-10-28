import { Component, inject } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { LoginLogicService } from './services/login/login-logic.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { ConversionService } from './services/conversion/conversion.service';



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
  public conversionService = inject(ConversionService);

  // Calculadora global
  public showCalculator: boolean = false;
  public expression: string = '';
  public lastResult: string | number | null = null;


  constructor(
    private platform: Platform
  ) {

  }

  async ngOnInit() {
    if (this.platform.is('ios'))
      StatusBar.hide();
    this.listenerNetwork()
    this.netWork = await Network.getStatus();

    localStorage.setItem("connected", String(this.netWork.connected));
    localStorage.setItem("connectionType", String(this.netWork.connectionType));
    //this.loginService.imgHome = "../../../assets/images/logoPremium.svg"
    //this.loginService.imgHome = "../../../assets/images/ferrari.jpg"
  }

  listenerNetwork() {
    Network.addListener('networkStatusChange', status => {
      //console.log('Network status changed', status);
      this.networkStatus = status;
      localStorage.setItem("connected", String(status.connected));
      localStorage.setItem("connectionType", String(status.connectionType));
    })
  }

  // Toggle visible/invisible
  toggleCalculator() {
    this.showCalculator = !this.showCalculator;
    if (!this.showCalculator) {
      // Opcional: limpiar expresión al cerrar o conservarla
      // this.expression = '';
      // this.lastResult = null;
    }
  }

  append(char: string) {
    // Evitar múltiples puntos consecutivos en el mismo número (simple guard)
    if (char === '.') {
      // encontrar el último token numérico
      const tokens = this.expression.split(/[\+\-\*\/]/);
      const last = tokens[tokens.length - 1] || '';
      if (last.includes('.')) {
        return; // ya hay un punto en el número actual
      }
    }
    this.expression = (this.expression || '') + char;
  }

  clear() {
    this.expression = '';
    this.lastResult = null;
  }

  backspace() {
    if (!this.expression) return;
    this.expression = this.expression.slice(0, -1);
  }

  calculate() {
    if (!this.expression) return;
    try {
      // Evaluación simple: usar Function en vez de eval por control un poco mayor
      // Nota: sólo para uso local / app controlada; evita usar con input no confiable.
      const safeExpr = this.expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/[^0-9+\-*/().]/g, '');
      // evitar expresiones vacías después del clean
      if (!safeExpr) return;
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${safeExpr});`)();
      // Formatear resultado si es número
      if (typeof result === 'number' && !Number.isNaN(result) && Number.isFinite(result)) {
        // limitar decimales a 8 para evitar longitudes enormes
        const rounded = Math.round((result + Number.EPSILON) * 1e8) / 1e8;
        this.lastResult = rounded;
        this.expression = String(rounded);
      } else {
        this.lastResult = String(result);
        this.expression = String(result);
      }
    } catch (e) {
      console.warn('Error calculando expresión', e);
      this.lastResult = 'Err';
    }
  }
}