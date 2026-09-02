import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

import { NewPotentialClientComponent } from './client-new-potential-client.component';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { ServicesService } from 'src/app/services/services.service';
import { AutoSendService } from 'src/app/services/autoSend/auto-send.service';
import { PotentialClientDatabaseServicesService } from 'src/app/services/clientes/potentialClient/potential-client-database-services.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';

describe('NewPotentialClientComponent', () => {
  let component: NewPotentialClientComponent;
  let fixture: ComponentFixture<NewPotentialClientComponent>;
  let clientLogicMock: any;
  let saveSend$: Subject<boolean>;

  function fillValidRequiredFields(overrides: Record<string, string> = {}): void {
    const values: Record<string, string | number> = {
      idEnterprise: 1,
      naClient: 'Test-CLT-021',
      nuRif: 'J-00000021-1',
      txAddress: 'Calle Test 21',
      txAddressDispatch: 'Calle Test 21',
      txClient: 'Obs Test 021',
      naResponsible: 'Prueba QA',
      emClient: 'test021@qa.com',
      nuPhone: '04121234021',
      ...overrides,
    };
    Object.entries(values).forEach(([key, value]) => {
      component.newPotentialClient.get(key)?.enable();
      component.newPotentialClient.get(key)?.setValue(value);
    });
  }

  beforeEach(waitForAsync(() => {
    saveSend$ = new Subject<boolean>();
    clientLogicMock = {
      setNombreModulo: jasmine.createSpy('setNombreModulo'),
      getEnterprisePotentialClient: jasmine.createSpy('getEnterprisePotentialClient').and.resolveTo(true),
      potentialClient: { stPotentialClient: undefined },
      saveOrExitOpen: false,
      saveSendPotentialClient: false,
      cannotSavePotentialClient: true,
      cannotSendPotentialClient: true,
      validPotentialClient: false,
      newPotentialClientChanged: false,
      empresaSeleccionada: { idEnterprise: 1, coEnterprise: 'E1' },
      enterprises: [{ idEnterprise: 1 }],
      listaEmpresa: [{ idEnterprise: 1 }],
    };

    TestBed.configureTestingModule({
      declarations: [NewPotentialClientComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ClientLogicService, useValue: clientLogicMock },
        { provide: MessageService, useValue: { showLoading: () => Promise.resolve(), hideLoading: () => undefined, alertModal: () => undefined } },
        { provide: SynchronizationDBService, useValue: { getDatabase: () => ({}) } },
        { provide: ServicesService, useValue: {} },
        { provide: AutoSendService, useValue: { runPendingQueue: () => undefined } },
        { provide: PotentialClientDatabaseServicesService, useValue: { saveSend: saveSend$ } },
        { provide: DateServiceService, useValue: { generateCO: () => 'CO-1' } },
        { provide: EnterpriseService, useValue: { esMultiempresa: () => false } },
        { provide: GeolocationService, useValue: { getCurrentPosition: () => Promise.resolve('0,0') } },
        {
          provide: AdjuntoService,
          useValue: {
            setup: jasmine.createSpy('setup'),
            getSavedPhotos: jasmine.createSpy('getSavedPhotos'),
            hasItems: () => false,
            getNuAttachment: () => 0,
            savePhotos: () => Promise.resolve(),
          },
        },
        { provide: GlobalConfigService, useValue: { get: () => 'false' } },
      ],
    })
      .overrideComponent(NewPotentialClientComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(NewPotentialClientComponent);
    component = fixture.componentInstance;
    // No detectChanges: evita rama async de ngOnInit sobre BD.
  }));

  afterEach(() => {
    saveSend$.complete();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('DM-CLT-019: form inicializa controles requeridos', () => {
    expect(component.newPotentialClient.contains('naClient')).toBeTrue();
    expect(component.newPotentialClient.contains('nuRif')).toBeTrue();
    expect(component.newPotentialClient.contains('emClient')).toBeTrue();
    expect(component.newPotentialClient.contains('nuPhone')).toBeTrue();
  });

  it('should clean string correctly', () => {
    expect(component.cleanString(`test;"'string"`)).toBe('teststring');
  });

  it('DM-CLT-020: checkForm vacío deja botones deshabilitados', async () => {
    await component.checkForm();
    expect(clientLogicMock.cannotSavePotentialClient).toBeTrue();
    expect(clientLogicMock.cannotSendPotentialClient).toBeTrue();
    expect(clientLogicMock.validPotentialClient).toBeFalse();
  });

  it('DM-CLT-021: campos obligatorios válidos habilitan guardar/enviar', async () => {
    fillValidRequiredFields();
    const ok = await component.checkForm();

    expect(ok).toBeTrue();
    expect(clientLogicMock.cannotSavePotentialClient).toBeFalse();
    expect(clientLogicMock.cannotSendPotentialClient).toBeFalse();
    expect(clientLogicMock.validPotentialClient).toBeTrue();
  });

  it('DM-CLT-022: email inválido mantiene botones deshabilitados', async () => {
    fillValidRequiredFields({ emClient: 'notenemail' });
    const ok = await component.checkForm();

    expect(component.newPotentialClient.get('emClient')?.valid).toBeFalse();
    expect(ok).toBeFalse();
    expect(clientLogicMock.cannotSavePotentialClient).toBeTrue();
  });

  it('DM-CLT-023: teléfono inválido mantiene botones deshabilitados', async () => {
    fillValidRequiredFields({ nuPhone: '123' });
    const ok = await component.checkForm();

    expect(component.newPotentialClient.get('nuPhone')?.valid).toBeFalse();
    expect(ok).toBeFalse();
    expect(clientLogicMock.cannotSavePotentialClient).toBeTrue();
  });

  it('laguna #4: naResponsible vacío no bloquea checkForm (no está en su if)', async () => {
    fillValidRequiredFields({ naResponsible: '' });
    const ok = await component.checkForm();
    expect(ok).toBeTrue();
    expect(clientLogicMock.cannotSavePotentialClient).toBeFalse();
  });

  it('should update potentialClient.naClient on onNaClientChange', () => {
    component.newPotentialClient.get('naClient')?.setValue('test;string');
    component.onNaClientChange();
    expect(clientLogicMock.potentialClient.naClient).toBe('teststring');
  });
});
