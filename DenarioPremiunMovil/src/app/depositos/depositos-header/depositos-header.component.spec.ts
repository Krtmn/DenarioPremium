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

  beforeEach(waitForAsync(() => {
    const depositValidToSave = new Subject<boolean>();
    const depositValidToSend = new Subject<boolean>();
    const showButtons = new Subject<boolean>();

    TestBed.configureTestingModule({
      declarations: [DepositosHeaderComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: DepositService,
          useValue: {
            depositValidToSave,
            depositValidToSend,
            showButtons,
            depositTags: new Map<string, string>(),
            depositTagsDenario: new Map<string, string>(),
            disabledSaveButton: true,
            disabledSendButton: true,
            deposit: { stDelivery: '' },
            getDepositValidationMessage: () => '',
            resetSendValidationUx: () => undefined,
            applyPersistSucceededBaseline: () => undefined,
            notifyDepositEdited: () => undefined,
            updateSaveButtonAvailability: () => undefined,
            updateSendButtonAvailability: () => undefined,
            saveDeposit: jasmine.createSpy('saveDeposit').and.resolveTo(true),
            sendDeposit: jasmine.createSpy('sendDeposit'),
          },
        },
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
});
