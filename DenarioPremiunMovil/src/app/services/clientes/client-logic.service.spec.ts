import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ModalController } from '@ionic/angular';

import { ClientLogicService } from './client-logic.service';
import { CurrencyService } from '../currency/currency.service';
import { GlobalConfigService } from '../globalConfig/global-config.service';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { ClientesDatabaseServicesService } from './clientes-database-services.service';
import { PotentialClientDatabaseServicesService } from './potentialClient/potential-client-database-services.service';
import { MessageService } from '../messageService/message.service';
import { EnterpriseService } from '../enterprise/enterprise.service';
import { ServicesService } from '../services.service';

describe('ClientLogicService', () => {
  let service: ClientLogicService;
  let currencyService: CurrencyService;
  const rate = 737.88;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ClientLogicService,
        { provide: SynchronizationDBService, useValue: { getDatabase: () => ({}) } },
        { provide: ClientesDatabaseServicesService, useValue: {} },
        { provide: PotentialClientDatabaseServicesService, useValue: {} },
        { provide: MessageService, useValue: {} },
        { provide: EnterpriseService, useValue: {} },
        { provide: ServicesService, useValue: {} },
        { provide: ModalController, useValue: { create: () => Promise.resolve({}) } },
        {
          provide: GlobalConfigService,
          useValue: {
            get: (clave: string) => {
              if (clave === 'multiCurrency') return 'true';
              if (clave === 'transportRole') return 'false';
              return '';
            },
          },
        },
        {
          provide: CurrencyService,
          useValue: {
            multimoneda: true,
            hasValidExchangeRate: () => true,
            toLocalCurrency: (n: number) => n * rate,
            toHardCurrency: (n: number) => n / rate,
            toOppositeCurrency: (_co: string, n: number) => n,
            getLocalCurrency: () => ({ coCurrency: 'BS' }),
            getHardCurrency: () => ({ coCurrency: 'USD' }),
            getCurrencyModule: () => ({
              localCurrencyDefault: 'false',
              showConversion: 'true',
            }),
          },
        },
      ],
    });
    service = TestBed.inject(ClientLogicService);
    currencyService = TestBed.inject(CurrencyService);

    service.localCurrency = { coCurrency: 'BS' } as any;
    service.hardCurrency = { coCurrency: 'USD' } as any;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fixClientListSaldos / CLI-SALDOS-001', () => {
    it('A AS04: co_currency BS + buckets docs 0/2096 → USD 2096, no 2,84; no muta coCurrency', () => {
      currencyService.multimoneda = true;
      const clients = [{ coCurrency: 'BS', saldo1: 0, saldo2: 2096.23 }] as any[];
      service.fixClientListSaldos(clients);

      expect(clients[0].coCurrency).toBe('BS');
      expect(clients[0].saldo2).toBeCloseTo(2096.23, 2);
      expect(clients[0].saldo1).toBeCloseTo(2096.23 * rate, 0);
      expect(clients[0].saldo2).not.toBeCloseTo(2.84, 1);
    });

    it('B cliente correcto local: buckets L/0 → Saldo BS = L', () => {
      currencyService.multimoneda = true;
      const clients = [{ coCurrency: 'USD', saldo1: 1000, saldo2: 0 }] as any[];
      service.fixClientListSaldos(clients);

      expect(clients[0].coCurrency).toBe('USD');
      expect(clients[0].saldo1).toBeCloseTo(1000, 2);
      expect(clients[0].saldo2).toBeCloseTo(1000 / rate, 2);
    });
  });

  describe('resolveClientBalanceTotals', () => {
    it('local/hard combine (document buckets)', () => {
      const totals = service.resolveClientBalanceTotals(0, 2096.23, 'BS', true);
      expect(totals.saldoFuerte).toBeCloseTo(2096.23, 2);
      expect(totals.saldoLocal).toBeCloseTo(2096.23 * rate, 0);
    });

    it('sin tasa: opuesto en 0', () => {
      spyOn(currencyService, 'hasValidExchangeRate').and.returnValue(false);
      const pair = service.resolveClientCurrencyPairBalances(100, 50, 'USD');
      expect(pair.saldoCliente).toBe(100);
      expect(pair.saldoOpuesto).toBe(0);
    });
  });

  describe('DM-CLT-032 / canShowConversion', () => {
    it('DM-CLT-032: checkUserStatus marca esTransportista desde localStorage', () => {
      localStorage.setItem('user', JSON.stringify({ transportista: true }));
      service.checkUserStatus();
      expect(service.esTransportista).toBeTrue();

      localStorage.setItem('user', JSON.stringify({ transportista: false }));
      service.checkUserStatus();
      expect(service.esTransportista).toBeFalse();

      localStorage.removeItem('user');
      service.checkUserStatus();
      expect(service.esTransportista).toBeFalse();
    });

    it('canShowConversion exige showConversion + multiCurrency + tasa', () => {
      service.showConversion = true;
      service.multiCurrency = true;
      spyOn(currencyService, 'hasValidExchangeRate').and.returnValue(true);
      expect(service.canShowConversion()).toBeTrue();

      (currencyService.hasValidExchangeRate as jasmine.Spy).and.returnValue(false);
      expect(service.canShowConversion()).toBeFalse();
    });
  });

  describe('DM-CLT-002 / isDueSoon', () => {
    it('DM-CLT-002: vencido ayer → true; mañana → false; null → false', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(service.isDueSoon(yesterday)).toBeTrue();
      expect(service.isDueSoon(tomorrow)).toBeFalse();
      expect(service.isDueSoon(null)).toBeFalse();
    });
  });
});
