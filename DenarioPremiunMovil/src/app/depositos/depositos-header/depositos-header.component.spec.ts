import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';

import { DepositosHeaderComponent } from './depositos-header.component';
import { DepositService } from 'src/app/services/deposit/deposit.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { MessageService } from 'src/app/services/messageService/message.service';

describe('DepositosHeaderComponent', () => {
  let component: DepositosHeaderComponent;
  let fixture: ComponentFixture<DepositosHeaderComponent>;
  let depositServiceMock: any;

  beforeEach(waitForAsync(() => {
    const depositValidToSave = new Subject<boolean>();
    const depositValidToSend = new Subject<boolean>();
    const showButtons = new Subject<boolean>();
    const focusSendValidationTab = new Subject<string>();

    depositServiceMock = {
      depositValidToSave,
      depositValidToSend,
      showButtons,
      focusSendValidationTab,
      depositTags: new Map<string, string>([
        ['DEP_MSJ_SAVE_QUESTION', '¿Desea guardar el Depósito?'],
        ['DEP_MSJ_SEND_QUESTION', '¿Desea enviar el Depósito?'],
      ]),
      depositTagsDenario: new Map<string, string>([
        ['DENARIO_BOTON_ACEPTAR', 'Aceptar'],
      ]),
      disabledSaveButton: false,
      disabledSendButton: false,
      deposit: { stDelivery: '', depositCollect: [] },
      hasDepositSaveErrors: jasmine.createSpy('hasDepositSaveErrors').and.returnValue(false),
      hasDepositFieldErrors: jasmine.createSpy('hasDepositFieldErrors').and.returnValue(true),
      getDepositSaveValidationMessage: jasmine.createSpy('getDepositSaveValidationMessage')
        .and.returnValue('Seleccione un banco'),
      getDepositValidationMessage: jasmine.createSpy('getDepositValidationMessage')
        .and.returnValue('Seleccione un cobro'),
      requestSendValidationTabFocus: jasmine.createSpy('requestSendValidationTabFocus'),
      resetSendValidationUx: () => undefined,
      applyPersistSucceededBaseline: () => undefined,
      notifyDepositEdited: () => undefined,
      updateSaveButtonAvailability: () => undefined,
      updateSendButtonAvailability: jasmine.createSpy('updateSendButtonAvailability'),
      saveDeposit: jasmine.createSpy('saveDeposit').and.resolveTo(true),
      sendDeposit: new Subject<string>(),
      sendBlockedByFields: false,
      sendValidationAttempted: false,
    };

    TestBed.configureTestingModule({
      declarations: [DepositosHeaderComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DepositService, useValue: depositServiceMock },
        {
          provide: AdjuntoService,
          useValue: {
            weightLimitExceeded: false,
            AttachmentChanged: new Subject<void>(),
            AttachmentWeightExceeded: new Subject<void>(),
            savePhotos: jasmine.createSpy('savePhotos'),
          },
        },
        {
          provide: SynchronizationDBService,
          useValue: {
            getDatabase: jasmine.createSpy('getDatabase').and.returnValue({}),
          },
        },
        {
          provide: MessageService,
          useValue: {
            transaccionMsjModalNB: jasmine.createSpy('transaccionMsjModalNB'),
            showLoading: jasmine.createSpy('showLoading').and.resolveTo(undefined),
            hideLoading: jasmine.createSpy('hideLoading'),
            alertModal: jasmine.createSpy('alertModal'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DepositosHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('DEP-SAVE-001: Guardar con General OK no exige cobros ni firma', () => {
    depositServiceMock.hasDepositSaveErrors.and.returnValue(false);
    depositServiceMock.hasDepositFieldErrors.and.returnValue(true);

    component.buttonSave();

    expect(depositServiceMock.hasDepositSaveErrors).toHaveBeenCalled();
    expect(depositServiceMock.hasDepositFieldErrors).not.toHaveBeenCalled();
    expect(depositServiceMock.getDepositValidationMessage).not.toHaveBeenCalled();
    expect(component.alertMessageOpenSave).toBeTrue();
    expect(component.alertMessageOpenValidation).toBeFalse();
  });

  it('DEP-SAVE-001: éxito de Guardar no reabre alertMessageOpenSave', async () => {
    depositServiceMock.hasDepositSaveErrors.and.returnValue(false);
    depositServiceMock.depositTags.set('DEP_SAVE_MSG', 'El Depósito se ha guardado');
    depositServiceMock.depositTags.set('DEP_HEADER_MESSAGE', 'Depósitos');
    const messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
    spyOn(component as any, 'persistDepositSaved').and.resolveTo(true);

    component.alertMessageOpenSave = true;
    await component.setResultSave({ detail: { role: 'confirm' } });
    await Promise.resolve();

    expect(component.alertMessageOpenSave).toBeFalse();
    expect(messageService.alertModal).toHaveBeenCalled();
  });
});
