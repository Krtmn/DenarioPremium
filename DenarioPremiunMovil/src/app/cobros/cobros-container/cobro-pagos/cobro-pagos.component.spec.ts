import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CobroPagosComponent } from './cobro-pagos.component';
import { CollectionService } from 'src/app/services/collection/collection-logic.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';

describe('CobroPagosComponent', () => {
  let component: CobroPagosComponent;
  let fixture: ComponentFixture<CobroPagosComponent>;
  let collectionServiceMock: any;

  beforeEach(waitForAsync(() => {
    collectionServiceMock = {
      montoTotalPagar: 0,
      disableSendButton: false,
      pagoEfectivo: [],
      pagoCheque: [],
      pagoDeposito: [],
      pagoTransferencia: [],
      pagoMovil: [],
      pagoOtros: [],
      collectionTagsDenario: new Map([['DENARIO_BOTON_ACEPTAR', 'Aceptar']]),
      collection: {
        coCurrency: 'USD',
        collectionPayments: [],
      },
      syncExchangeRateToCollectionHeader: jasmine.createSpy('syncExchangeRateToCollectionHeader').and.returnValue(1),
      convertirMonto: jasmine.createSpy('convertirMonto').and.callFake((amount: number) => amount),
      validateToSend: jasmine.createSpy('validateToSend'),
      cleanString: (value: string) => value,
    };

    TestBed.configureTestingModule({
      declarations: [CobroPagosComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: CollectionService, useValue: collectionServiceMock },
        { provide: CurrencyService, useValue: {} },
        {
          provide: DateServiceService,
          useValue: {
            hoyISO: () => '2026-08-04',
            hoyISOFullTime: () => '2026-08-04 12:00:00',
            toDbDateTime: (value: string) => value,
            normalizeDateRateToDbDateTime: (value: string) => value,
          },
        },
        { provide: GlobalConfigService, useValue: { get: () => undefined } },
      ],
    })
      .overrideComponent(CobroPagosComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(CobroPagosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter banks by normalized name', () => {
    const banks = [
      { naBank: 'Banco Mercantil', coBank: '0105' },
      { naBank: 'Banco Provincial', coBank: '0108' },
    ];
    const searchKey = component.getBankSearchKey('pm', 0, 'banks');

    component.setBankSearchTerm(searchKey, 'mercantil');

    expect(component.getFilteredBanks(banks, searchKey)).toEqual([banks[0]]);
  });

  it('should filter bank accounts by account number or code', () => {
    const bankAccounts = [
      { naBank: 'Banco Nacional', nuAccount: '010200000001', coBank: 'BNC' },
      { naBank: 'Banco Plaza', nuAccount: '013800000002', coBank: 'PLZ' },
    ];
    const searchKey = component.getBankSearchKey('de', 1, 'accounts');

    component.setBankSearchTerm(searchKey, '0138');

    expect(component.getFilteredBanks(bankAccounts, searchKey)).toEqual([bankAccounts[1]]);
  });

  it('should restore the full bank list when the search is cleared', () => {
    const banks = [
      { naBank: 'Banco Mercantil' },
      { naBank: 'Banco Provincial' },
    ];
    const searchKey = component.getBankSearchKey('ch', 0, 'banks');

    component.setBankSearchTerm(searchKey, 'provincial');
    component.clearBankSearch(searchKey);

    expect(component.getFilteredBanks(banks, searchKey)).toEqual(banks);
  });

  it('COB-TR-002: setMonto forces Enviar OFF before revalidation when lowering amount', () => {
    collectionServiceMock.disableSendButton = false;
    collectionServiceMock.pagoEfectivo = [{
      monto: 100,
      posCollectionPayment: 0,
      fecha: '',
    }];
    collectionServiceMock.collection.collectionPayments = [{
      coType: 'ef',
      coPaymentMethod: 'ef',
      nuAmountPartial: 100,
      daValue: '',
      daCollectionPayment: '',
    }];
    spyOn(component, 'validatePayment');

    component.setMonto(50, 0, 'ef');

    expect(collectionServiceMock.disableSendButton).toBeTrue();
    expect(collectionServiceMock.pagoEfectivo[0].monto).toBe(50);
    expect(collectionServiceMock.collection.collectionPayments[0].nuAmountPartial).toBe(50);
    expect(component.validatePayment).toHaveBeenCalledWith('ef', 0);
  });
});
