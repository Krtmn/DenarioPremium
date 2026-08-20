import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, Platform } from '@ionic/angular';
import { Subject } from 'rxjs';

import { CobrosHeaderComponent } from './cobros-header.component';
import { CollectionService } from 'src/app/services/collection/collection-logic.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { AutoSendService } from 'src/app/services/autoSend/auto-send.service';
import { ServicesService } from 'src/app/services/services.service';

describe('CobrosHeaderComponent', () => {
  let component: CobrosHeaderComponent;
  let fixture: ComponentFixture<CobrosHeaderComponent>;
  let collectServiceMock: any;
  let messageServiceMock: jasmine.SpyObj<MessageService>;

  beforeEach(waitForAsync(() => {
    messageServiceMock = jasmine.createSpyObj('MessageService', ['transaccionMsjModalNB', 'alertModal']);
    collectServiceMock = {
      sendValidationAttempted: false,
      sendBlockedByFields: false,
      disableSendButton: false,
      lastValidToSend: false,
      showHeaderButtons: true,
      collection: { coType: '0' },
      collectionTags: new Map<string, string>([
        ['COB_SEND_COLLECT_MSG', '¿Enviar cobro?'],
        ['COB_HEADER_MESSAGE', 'Cobros'],
        ['COB_NOMBRE_MODULO', 'Cobros'],
      ]),
      collectionTagsDenario: new Map<string, string>([
        ['DENARIO_BOTON_CANCELAR', 'Cancelar'],
        ['DENARIO_BOTON_ACEPTAR', 'Aceptar'],
      ]),
      hasSendFieldErrors: jasmine.createSpy('hasSendFieldErrors').and.returnValue(false),
      hasSendPrerequisites: jasmine.createSpy('hasSendPrerequisites').and.returnValue(true),
      findFirstIncompleteRetentionDocumentIndex: jasmine.createSpy('findFirstIncompleteRetentionDocumentIndex').and.returnValue(0),
      getRetentionSendValidationMessage: jasmine.createSpy('getRetentionSendValidationMessage').and.returnValue('Retención incompleta.'),
      getCollectionSendValidationMessage: jasmine.createSpy('getCollectionSendValidationMessage').and.returnValue('Complete los campos obligatorios.'),
      requestSendValidationTabFocus: jasmine.createSpy('requestSendValidationTabFocus'),
      retentionSendFocusDocIndex: null as number | null,
      updateSendButtonAvailability: jasmine.createSpy('updateSendButtonAvailability').and.callFake(function (this: typeof collectServiceMock) {
        if (this.sendBlockedByFields) {
          this.disableSendButton = true;
        }
      }),
      validateToSend: jasmine.createSpy('validateToSend').and.returnValue(Promise.resolve()),
      resetSendValidationUx: jasmine.createSpy('resetSendValidationUx'),
      isCollectionReadOnlyForEdit: jasmine.createSpy('isCollectionReadOnlyForEdit').and.returnValue(false),
      getTagsDenario: jasmine.createSpy('getTagsDenario').and.returnValue(Promise.resolve(false)),
      showButtons: new Subject<boolean>(),
      collectValidToSave: new Subject<boolean>(),
      cobrosComponent: true,
      cobroComponent: false,
      cobroListComponent: false,
    };

    TestBed.configureTestingModule({
      declarations: [CobrosHeaderComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: CollectionService, useValue: collectServiceMock },
        { provide: AdjuntoService, useValue: { AttachmentChanged: new Subject<void>(), AttachmentWeightExceeded: new Subject<void>() } },
        { provide: MessageService, useValue: messageServiceMock },
        { provide: SynchronizationDBService, useValue: { getDatabase: () => ({}) } },
        { provide: AutoSendService, useValue: {} },
        { provide: ServicesService, useValue: { getTags: () => Promise.resolve(true) } },
        { provide: Platform, useValue: { backButton: { subscribeWithPriority: () => ({ unsubscribe: () => {} }) } } },
      ],
    })
      .overrideComponent(CobrosHeaderComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(CobrosHeaderComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('COB-SEND-UX-001: sendCollect shows modal for cobro when required fields are missing', async () => {
    collectServiceMock.hasSendFieldErrors.and.returnValue(true);

    component.sendCollect();
    await Promise.resolve();

    expect(collectServiceMock.sendValidationAttempted).toBeTrue();
    expect(collectServiceMock.sendBlockedByFields).toBeTrue();
    expect(collectServiceMock.updateSendButtonAvailability).toHaveBeenCalled();
    expect(collectServiceMock.validateToSend).not.toHaveBeenCalled();
    expect(component.alertMessageOpenValidation).toBeTrue();
    expect(component.validationFailureMessage).toBe('Complete los campos obligatorios.');
    expect(collectServiceMock.requestSendValidationTabFocus).toHaveBeenCalled();
    expect(component.alertMessageOpenSend).toBeFalse();
  });

  it('COB-SEND-UX-001: sendCollect shows modal when prerequisites missing', () => {
    collectServiceMock.hasSendPrerequisites.and.returnValue(false);

    component.sendCollect();

    expect(collectServiceMock.sendValidationAttempted).toBeTrue();
    expect(collectServiceMock.hasSendFieldErrors).not.toHaveBeenCalled();
    expect(collectServiceMock.validateToSend).not.toHaveBeenCalled();
    expect(component.alertMessageOpenValidation).toBeTrue();
    expect(collectServiceMock.requestSendValidationTabFocus).toHaveBeenCalled();
  });

  it('COB-UX-SEND-001: sendCollect opens confirmation when fields and business validation pass', async () => {
    collectServiceMock.hasSendFieldErrors.and.returnValue(false);
    collectServiceMock.lastValidToSend = true;

    component.sendCollect();
    await collectServiceMock.validateToSend.calls.mostRecent().returnValue;
    await Promise.resolve();

    expect(collectServiceMock.validateToSend).toHaveBeenCalled();
    expect(component.alertMessageOpenSend).toBeTrue();
    expect(component.alertMessageOpenValidation).toBeFalse();
  });

  it('COB-SEND-UX-001: sendCollect shows modal when validateToSend fails for cobro', async () => {
    collectServiceMock.hasSendFieldErrors.and.returnValue(false);
    collectServiceMock.lastValidToSend = false;

    component.sendCollect();
    await collectServiceMock.validateToSend.calls.mostRecent().returnValue;
    await Promise.resolve();

    expect(component.alertMessageOpenValidation).toBeTrue();
    expect(collectServiceMock.requestSendValidationTabFocus).toHaveBeenCalled();
    expect(component.alertMessageOpenSend).toBeFalse();
  });

  it('COB-SEND-UX-001: sendCollect shows modal when prepaid forces valid but fields incomplete', async () => {
    collectServiceMock.hasSendFieldErrors.and.returnValues(false, true);
    collectServiceMock.lastValidToSend = true;

    component.sendCollect();
    await collectServiceMock.validateToSend.calls.mostRecent().returnValue;
    await Promise.resolve();

    expect(component.alertMessageOpenValidation).toBeTrue();
    expect(collectServiceMock.requestSendValidationTabFocus).toHaveBeenCalled();
    expect(component.alertMessageOpenSend).toBeFalse();
  });

  it('COB-RET-SEND-001: sendCollect shows modal when retention fields are incomplete', () => {
    collectServiceMock.collection.coType = '2';
    collectServiceMock.hasSendFieldErrors.and.returnValue(true);

    component.sendCollect();

    expect(collectServiceMock.sendValidationAttempted).toBeTrue();
    expect(collectServiceMock.sendBlockedByFields).toBeTrue();
    expect(component.alertMessageOpenValidation).toBeTrue();
    expect(component.validationFailureMessage).toBe('Retención incompleta.');
    expect(collectServiceMock.retentionSendFocusDocIndex).toBe(0);
    expect(collectServiceMock.requestSendValidationTabFocus).toHaveBeenCalledWith('documentos');
    expect(component.alertMessageOpenSend).toBeFalse();
  });
});
