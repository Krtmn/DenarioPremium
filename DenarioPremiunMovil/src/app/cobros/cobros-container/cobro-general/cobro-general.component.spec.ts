import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';

import { CobrosGeneralComponent } from './cobro-general.component';
import { CollectionService } from 'src/app/services/collection/collection-logic.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ClientesDatabaseServicesService } from 'src/app/services/clientes/clientes-database-services.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { ClienteSelectorService } from 'src/app/cliente-selector/cliente-selector.service';
import { CollectionPayment } from 'src/app/modelos/tables/collection';

describe('CobrosGeneralComponent', () => {
  let component: CobrosGeneralComponent;
  let fixture: ComponentFixture<CobrosGeneralComponent>;
  let collectServiceMock: any;

  beforeEach(waitForAsync(() => {
    collectServiceMock = {
      clientBankAccount: true,
      listBankAccounts: [],
      bankAccountSelected: [],
      clientBankAccounts: [],
      clientBankAccountSelected: [],
      collectionTags: new Map(),
      collectionTagsDenario: new Map([['DENARIO_BOTON_ACEPTAR', 'Aceptar']]),
      collection: {
        stCollection: 0,
        stDelivery: 0,
        coCollection: '',
        nuValueLocal: 0,
      },
      COLLECT_STATUS_NEW: 0,
      COLLECT_STATUS_TO_SEND: 2,
      COLLECT_STATUS_SENT: 3,
      enabledManualRate: false,
      rateSelected: 0,
      loadTypeDocumentList: jasmine.createSpy('loadTypeDocumentList').and.resolveTo(undefined),
      loadCodePhoneNumberList: jasmine.createSpy('loadCodePhoneNumberList').and.resolveTo(undefined),
    };

    TestBed.configureTestingModule({
      declarations: [CobrosGeneralComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: CollectionService, useValue: collectServiceMock },
        {
          provide: DateServiceService,
          useValue: {
            hoyISO: () => '2026-08-04',
            hoyISOFullTime: () => '2026-08-04 12:00:00',
          },
        },
        { provide: EnterpriseService, useValue: {} },
        { provide: GlobalConfigService, useValue: { get: () => undefined } },
        { provide: GeolocationService, useValue: {} },
        { provide: CurrencyService, useValue: {} },
        { provide: MessageService, useValue: {} },
        { provide: ClientesDatabaseServicesService, useValue: {} },
        {
          provide: AdjuntoService,
          useValue: { AttachmentChanged: new Subject<void>() },
        },
        {
          provide: SynchronizationDBService,
          useValue: { getDatabase: () => ({}) },
        },
        {
          provide: ClienteSelectorService,
          useValue: {
            ClientChanged: new Subject<any>(),
            checkClient: false,
          },
        },
      ],
    })
      .overrideComponent(CobrosGeneralComponent, { set: { template: '' } })
      .compileComponents();

    // Evita ngOnInit (initGeneralState / SQLite); estos casos solo ejercitan hidratación TR.
    spyOn(CobrosGeneralComponent.prototype, 'ngOnInit').and.resolveTo();
    fixture = TestBed.createComponent(CobrosGeneralComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('COB-TR-003: buildHydratedTransferenciaPayment maps receptor and client accounts without inversion', () => {
    const payment = {
      idBank: 11,
      naBank: 'Banco Receptor',
      nuBankAccount: '0102-RECEPTOR',
      nuClientBankAccount: '0102-CLIENTE',
      coClientBankAccount: 'CLI-ACC',
      newNuClientBankAccount: '',
      nuPaymentDoc: 'TR-REF-1',
      nuAmountPartial: 120,
      nuAmountPartialConversion: 120,
      daValue: '2026-08-04',
      isAnticipoPrepaid: false,
    } as CollectionPayment;

    const hydrated = (component as any).buildHydratedTransferenciaPayment(payment, 0, []);

    expect(hydrated.numeroCuenta).toBe('0102-RECEPTOR');
    expect(hydrated.numeroCuentaCliente).toBe('0102-CLIENTE');
    expect(hydrated.numeroTransferencia).toBe('TR-REF-1');
    expect(hydrated.showNuevaCuenta).toBeFalse();
    expect(hydrated.nuevaCuenta).toBe('');
    expect(hydrated.monto).toBe(120);
  });

  it('COB-TR-003: buildHydratedTransferenciaPayment restores nueva cuenta text', () => {
    const payment = {
      idBank: 11,
      naBank: 'Banco Receptor',
      nuBankAccount: '0102-RECEPTOR',
      nuClientBankAccount: 'Nueva Cuenta',
      coClientBankAccount: 'Nueva Cuenta',
      newNuClientBankAccount: '0123-NUEVA',
      nuPaymentDoc: 'TR-REF-2',
      nuAmountPartial: 80,
      nuAmountPartialConversion: 80,
      daValue: '2026-08-04',
      isAnticipoPrepaid: false,
    } as CollectionPayment;

    const hydrated = (component as any).buildHydratedTransferenciaPayment(payment, 1, []);

    expect(hydrated.showNuevaCuenta).toBeTrue();
    expect(hydrated.numeroCuentaCliente).toBe('Nueva Cuenta');
    expect(hydrated.nuevaCuenta).toBe('0123-NUEVA');
    expect(hydrated.numeroCuenta).toBe('0102-RECEPTOR');
  });
});
