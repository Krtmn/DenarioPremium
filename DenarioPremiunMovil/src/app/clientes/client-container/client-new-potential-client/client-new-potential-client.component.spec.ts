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
      sendValidationAttempted: false,
      empresaSeleccionada: { idEnterprise: 1, coEnterprise: 'E1' },
      enterprises: [{ idEnterprise: 1 }],
      listaEmpresa: [{ idEnterprise: 1 }],
      clientTags: new Map<string, string>(),
      registerPotentialClientForm: jasmine.createSpy('registerPotentialClientForm'),
      clearPotentialClientForm: jasmine.createSpy('clearPotentialClientForm'),
      resetPotentialClientValidationUxFlags: jasmine.createSpy('resetPotentialClientValidationUxFlags'),
      resetPotentialClientExitBaseline: jasmine.createSpy('resetPotentialClientExitBaseline'),
      markPotentialClientOpenedFromPersistedCopy: jasmine.createSpy('markPotentialClientOpenedFromPersistedCopy'),
      onPotentialClientGeneralValid: jasmine.createSpy('onPotentialClientGeneralValid'),
      syncPotentialClientFormValidity: jasmine.createSpy('syncPotentialClientFormValidity').and.returnValue(false),
      updatePotentialClientSaveButtonAvailability: jasmine.createSpy('updatePotentialClientSaveButtonAvailability'),
      updatePotentialClientSendButtonAvailability: jasmine.createSpy('updatePotentialClientSendButtonAvailability'),
      notifyPotentialClientEdited: jasmine.createSpy('notifyPotentialClientEdited'),
      isPotentialClientEnterpriseMissing: jasmine.createSpy('isPotentialClientEnterpriseMissing').and.returnValue(false),
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

  it('DM-CLT-020: checkForm vacío deja formulario inválido', async () => {
    await component.checkForm();
    expect(clientLogicMock.syncPotentialClientFormValidity).toHaveBeenCalled();
    expect(clientLogicMock.updatePotentialClientSaveButtonAvailability).toHaveBeenCalled();
    expect(clientLogicMock.updatePotentialClientSendButtonAvailability).toHaveBeenCalled();
  });

  it('DM-CLT-021: campos obligatorios válidos sincronizan formulario', async () => {
    fillValidRequiredFields();
    clientLogicMock.syncPotentialClientFormValidity.and.returnValue(true);
    const ok = await component.checkForm();

    expect(ok).toBeTrue();
    expect(clientLogicMock.syncPotentialClientFormValidity).toHaveBeenCalled();
  });

  it('DM-CLT-022: email inválido mantiene formulario inválido', async () => {
    fillValidRequiredFields({ emClient: 'notenemail' });
    const ok = await component.checkForm();

    expect(component.newPotentialClient.get('emClient')?.valid).toBeFalse();
    expect(ok).toBeFalse();
  });

  it('DM-CLT-023: teléfono inválido mantiene formulario inválido', async () => {
    fillValidRequiredFields({ nuPhone: '123' });
    const ok = await component.checkForm();

    expect(component.newPotentialClient.get('nuPhone')?.valid).toBeFalse();
    expect(ok).toBeFalse();
  });

  it('naResponsible vacío deja syncPotentialClientFormValidity en false', async () => {
    fillValidRequiredFields({ naResponsible: '' });
    clientLogicMock.syncPotentialClientFormValidity.and.returnValue(false);
    const ok = await component.checkForm();
    expect(ok).toBeFalse();
    expect(component.newPotentialClient.get('naResponsible')?.valid).toBeFalse();
  });

  it('should update potentialClient.naClient on onNaClientChange', () => {
    component.newPotentialClient.get('naClient')?.setValue('test;string');
    component.onNaClientChange();
    expect(clientLogicMock.potentialClient.naClient).toBe('teststring');
  });
});
