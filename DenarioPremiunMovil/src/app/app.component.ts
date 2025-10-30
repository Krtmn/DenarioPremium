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
  // Mostrar FAB sólo en rutas permitidas (por defecto, home)
  public showFab: boolean = false;
  // Inputs para el panel de calculadora/selector
  public inputsIdx: number[] = [0, 1, 2];
  public inputs: string[] = ['', '', ''];
  public companies: Enterprise[] = [];
  public selectedCompany: Enterprise | null = null;

  // Campos financieros solicitados
  public baseUsd: number = 0;
  public calcularIva: boolean = true; // checkbox default true
  public ivaUsd: number = 0;
  public descuentoUsd: number = 0;
  public totalIvaUsd: number = 0;
  // Tasas (configurables) para calcular totales en moneda local/alternativa
  public tasaBcvRate: number = 1;
  public tasaParaleloRate: number = 1;
  public totalTasaBcv: number = 0;
  public totalTasaParaleloUsd: number = 0;

  // Nuevo binding auxiliar (string) para el input formateado
  public baseUsdInput: string = '0,00'; // ahora con coma por defecto


  constructor(
    private platform: Platform,
    private router: Router
  ) {

  }

  onCompanyChange(event: any) {
    const id = event?.detail?.value ?? event;
    this.selectedCompany = event?.detail?.selectedOption || null;
  }

  // ...existing code...
  public async loadEnterprises(): Promise<void> {
    this.conversionService.getEnterprise().then(companies => {
      this.selectedCompany = companies[0];
      this.companies = companies;
    });
  }



  public recalcTotals(): void {
    try {
      const base = Number(this.baseUsd) || 0;
      const descuento = Number(this.descuentoUsd) || 0;
      let total = 0;

      if (this.calcularIva) {
        this.ivaUsd = Math.round((base * 0.16) * 100) / 100; // 16% IVA
      } else {
        this.ivaUsd = Number(this.ivaUsd) || 0;
      }

      this.descuentoUsd = base * 0.04; // 4% descuento
      this.totalIvaUsd = this.ivaUsd - this.descuentoUsd;
      total = base + this.totalIvaUsd;
      this.totalTasaBcv = total * this.tasaBcvRate;
      this.totalTasaParaleloUsd = total * this.tasaParaleloRate;
    } catch (e) {
      console.warn('[recalcTotals] error', e);
    }
  }

  async ngOnInit() {
    if (this.platform.is('ios'))
      StatusBar.hide();
    this.listenerNetwork()
    this.netWork = await Network.getStatus();

    // Inicializar visibilidad del FAB y suscribirse a cambios de ruta
    this.updateFabVisibility();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.updateFabVisibility());

    // Inicializar valores y formatear baseUsdInput
    this.baseUsd = Number(this.baseUsd) || 0;
    this.baseUsdInput = this.formatCurrencyLocale(this.baseUsd);

    // Inicializar cálculos de la calculadora
    this.recalcTotals();

    localStorage.setItem("connected", String(this.netWork.connected));
    localStorage.setItem("connectionType", String(this.netWork.connectionType));
    //this.loginService.imgHome = "../../../assets/images/logoPremium.svg"
    //this.loginService.imgHome = "../../../assets/images/ferrari.jpg"
  }

  // Añadir este helper a la clase (formatea n -> "1.234,56")
  private formatCurrencyLocale(value: number): string {
    if (value == null || Number.isNaN(value)) return '0,00';
    const negative = value < 0;
    const abs = Math.abs(value);
    const parts = abs.toFixed(2).split('.'); // ["1234","56"]
    let intPart = parts[0];
    const decPart = parts[1] ?? '00';
    // Insertar puntos cada 3 dígitos desde la derecha
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (negative ? '-' : '') + intPart + ',' + decPart;
  }
  // Reemplaza el onBaseInput por este (interpreta input como centavos, muestra con . y ,)
  public onBaseInput(ev: any): void {
    try {
      // obtener valor (Ionic usa ev.detail.value)
      const raw = ev?.detail?.value ?? ev?.target?.value ?? String(ev ?? '');
      // extraer sólo dígitos (ignoramos puntos/comas/espacios)
      const digits = String(raw).replace(/\D/g, '');

      // si no hay dígitos, tratamos como 0
      const normalized = digits === '' ? '0' : digits;

      // interpretar como centavos: '1' -> 0.01, '123' -> 1.23, '12345' -> 123.45
      const valueNumber = parseInt(normalized, 10) / 100;

      // actualizar modelo numérico usado por recalcTotals
      this.baseUsd = Number(valueNumber) || 0;

      // actualizar la cadena mostrada con formato "1.234,56"
      this.baseUsdInput = this.formatCurrencyLocale(this.baseUsd);

      // recalcular totales con el nuevo valor numérico
      this.recalcTotals();
    } catch (err) {
      console.warn('[onBaseInput] parse error', err);
      this.baseUsd = 0;
      this.baseUsdInput = '0,00';
      this.recalcTotals();
    }
  }

  private updateFabVisibility(): void {
    try {
      const url = (this.router && this.router.url) ? this.router.url.toLowerCase() : '';
      // Mostrar FAB en todas las rutas por defecto, excepto las rutas de login o sincronización.
      const denyTokens = ['login', 'synchronization'];
      const isDenied = denyTokens.some(t => url.includes(t));
      this.showFab = !isDenied;
    } catch (e) {
      this.showFab = false;
    }
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
    if (this.showCalculator) {

      this.loadEnterprises();
      this.conversionService.getTasaBCV(Number(this.selectedCompany?.idEnterprise)).then(rate => {
        this.tasaBcvRate = rate;
        this.conversionService.getTasaParalelo(Number(this.selectedCompany?.idEnterprise)).then(rate => {
          this.tasaParaleloRate = rate;
        });
      });
    } else {
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