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
  public conversionService = inject(ConversionService);
  public globalConfig = inject(GlobalConfigService);

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
  public baseUSD: number = 0;
  public calcularIVA: boolean = true; // checkbox default true
  public ivaUSDInput: string = '16,00'; // mostrado (porcentaje con coma)
  public ivaPercent: number = 16;       // valor numérico 0..100 (porcentaje)
  public descuentoUSD: number = 0;
  public totalUSD: number = 0;
  public totalIVAUSD: number = 0;
  public descuentoUSDInput: string = '0,00'; // input mostrado (porcentaje, con coma decimal)
  public descuentoPercent: number = 0;       // valor numérico (0..100)
  // Tasas (configurables) para calcular totales en moneda local/alternativa
  public tasaBcvRate: number = 1;
  public tasaParaleloRate: number = 1;
  public totalTasaBCV: number = 0;
  public totalTasaParaleloUSD: number = 0;

  // Nuevo binding auxiliar (string) para el input formateado
  public baseUSDInput: string = '0,00'; // ahora con coma por defecto


  constructor(
    private platform: Platform,
    private router: Router
  ) {

  }

  async ngOnInit() {
    //conversionCalculator
    if (this.platform.is('ios'))
      StatusBar.hide();
    this.listenerNetwork()
    this.netWork = await Network.getStatus();

    this.showFab = this.globalConfig.get('conversionCalculator') == 'true' ? true : false;
    // Inicializar visibilidad del FAB y suscribirse a cambios de ruta
    this.updateFabVisibility();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.updateFabVisibility());

    // Inicializar valores y formatear baseUSDInput
    this.baseUSD = Number(this.baseUSD) || 0;
    this.baseUSDInput = this.formatCurrencyLocale(this.baseUSD);

    // Inicializa el descuento por defecto (0) y mostrar con mismo formateo que baseUSDInput
    this.descuentoPercent = Number(this.descuentoPercent) || 0;
    this.descuentoUSDInput = this.formatCurrencyLocale(this.descuentoPercent);

    // Inicializa IVA por defecto (16%) y mostrar con mismo formateo
    this.ivaPercent = Number(this.ivaPercent) || 16;
    this.ivaUSDInput = this.formatCurrencyLocale(this.ivaPercent);

    // Inicializar cálculos de la calculadora
    this.recalcTotals();

    localStorage.setItem("connected", String(this.netWork.connected));
    localStorage.setItem("connectionType", String(this.netWork.connectionType));
    //this.loginService.imgHome = "../../../assets/images/logoPremium.svg"
    //this.loginService.imgHome = "../../../assets/images/ferrari.jpg"
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
      const base = Number(this.baseUSD) || 0;

      const ivaPct = Number(this.ivaPercent) || 0; // usa ivaPercent numérico

      if (this.calcularIVA) {
        // IVA en USD = base * (ivaPct / 100)
        this.totalIVAUSD = Math.round((base * ivaPct / 100) * 100) / 100;
      } else {
        this.totalIVAUSD = 0;
      }

      const descuentoPct = Number(this.descuentoPercent) || 0; // 0..100
      // descuento en USD = base * (descuentoPct / 100)
      this.descuentoUSD = Math.round(base * (descuentoPct / 100));

      // Si el descuento iguala la base, anular IVA (mantener consistencia numérica)
      if (Number(this.descuentoUSDInput) === base && base != 0) {
        this.ivaPercent = 0;
        this.ivaUSDInput = this.formatCurrencyLocale(0);
        this.totalIVAUSD = 0;
      }

      // total USD con valores calculados (usar totalIVAUSD numérico)
      this.totalUSD = Math.round((base + this.totalIVAUSD - this.descuentoUSD) * 100) / 100;

      const total = base + this.totalIVAUSD - this.descuentoUSD;
      // redondeos para presentar
      this.totalTasaBCV = Math.round((total * this.tasaBcvRate) * 100) / 100;
      this.totalTasaParaleloUSD = Math.round((total * this.tasaParaleloRate) * 100) / 100;
    } catch (e) {
      console.warn('[recalcTotals] error', e);
    }
  }

  // Formatea porcentaje para mostrar (coma decimal, 2 decimales), ej. 4 -> "4,00"
  private formatPercentLocale(value: number): string {
    if (value == null || Number.isNaN(value)) return '0,00';
    const negative = value < 0;
    const abs = Math.abs(value);
    const dec = (Math.round(abs * 100) / 100).toFixed(2); // "4.00"
    // Reemplazar punto decimal por coma
    return (negative ? '-' : '') + dec.replace('.', ',');
  }

  /**
   * Formatea un número para mostrarlo con punto miles y coma decimales.
   * Ejemplos: 0 -> "0,00", 1234.5 -> "1.234,50"
   */
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

  /**
   * Maneja la entrada del porcentaje de descuento en modo "centavos persistentes".
   * Comportamiento: cada dígito que ingresas se añade como centavo:
   *  - escribe "1"  => 0,01  (descuentoPercent = 0.01)
   *  - sigue con "2" => 0,12  (descuentoPercent = 0.12)
   *  - sigue con "3" => 1,23  (descuentoPercent = 1.23)
   * El valor se clampa en 0..100 (si se pasan más dígitos y supera 100 se ajusta a 100).
   */
  public onDescuentoInput(ev: any): void {
    try {
      // obtener raw value del input (Ionic: ev.detail.value)
      const raw = ev?.detail?.value ?? ev?.target?.value ?? String(ev ?? '');
      // extraer sólo dígitos (quitamos cualquier punto/coma/espacio)
      const digits = String(raw).replace(/\D/g, '');

      // si no hay dígitos, tratamos como 0
      const normalized = digits === '' ? '0' : digits;

      // interpretar como centavos: '1' -> 0.01, '123' -> 1.23
      let valueNumber = parseInt(normalized, 10) / 100;

      // clamp entre 0 y 100 (porcentaje máximo)
      if (!Number.isFinite(valueNumber) || Number.isNaN(valueNumber)) valueNumber = 0;
      valueNumber = Math.max(0, Math.min(100.00, valueNumber));

      // Actualizamos el porcentaje numérico y la cadena mostrada (mismo formateo que baseUSD)
      this.descuentoPercent = valueNumber;
      this.descuentoUSDInput = this.formatCurrencyLocale(this.descuentoPercent);

      // Recalcular totales usando el nuevo porcentaje
      this.recalcTotals();
    } catch (err) {
      console.warn('[onDescuentoInput] parse error', err);
      this.descuentoPercent = 0;
      this.descuentoUSDInput = this.formatCurrencyLocale(0);
      this.recalcTotals();
    }
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
      this.baseUSD = Number(valueNumber) || 0;

      // actualizar la cadena mostrada con formato "1.234,56"
      this.baseUSDInput = this.formatCurrencyLocale(this.baseUSD);

      // recalcular totales con el nuevo valor numérico
      this.recalcTotals();
    } catch (err) {
      console.warn('[onBaseInput] parse error', err);
      this.baseUSD = 0;
      this.baseUSDInput = '0,00';
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

  /**
 * Maneja la entrada del IVA en modo "centavos persistentes".
 * Igual comportamiento que onDescuentoInput:
 * - cada dígito se añade como centavo (1 -> 0,01 ; next 2 -> 0,12 ; next 3 -> 1,23 ...)
 * - clamp 0..100
 * - actualiza ivaPercent y muestra ivaUSDInput con formatCurrencyLocale
 */
  public onIVAInput(ev: any): void {
    try {
      const raw = ev?.detail?.value ?? ev?.target?.value ?? String(ev ?? '');
      // extraer sólo dígitos (quitamos cualquier punto/coma/espacio)
      const digits = String(raw).replace(/\D/g, '');
      const normalized = digits === '' ? '0' : digits;

      // interpretar como centavos: '1' -> 0.01, '123' -> 1.23
      let valueNumber = parseInt(normalized, 10) / 100;

      // clamp entre 0 y 100 (porcentaje máximo)
      if (!Number.isFinite(valueNumber) || Number.isNaN(valueNumber)) valueNumber = 0;
      valueNumber = Math.max(0, Math.min(100.00, valueNumber));

      // actualizar porcentaje numérico y cadena mostrada (formato con puntos y coma)
      this.ivaPercent = valueNumber;
      this.ivaUSDInput = this.formatCurrencyLocale(this.ivaPercent);

      // recalcular totales
      this.recalcTotals();
    } catch (err) {
      console.warn('[onIVAInput] parse error', err);
      this.ivaPercent = 0;
      this.ivaUSDInput = this.formatCurrencyLocale(0);
      this.recalcTotals();
    }
  }
}