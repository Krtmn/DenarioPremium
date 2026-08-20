import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DepositService } from 'src/app/services/deposit/deposit.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { Subscription } from 'rxjs';
import { Platform } from '@ionic/angular';
import { MessageService } from 'src/app/services/messageService/message.service';
import { DEPOSITO_STATUS_NEW, DEPOSITO_STATUS_SAVED, DEPOSITO_STATUS_TO_SEND, DEPOSITO_STATUS_SENT } from 'src/app/utils/appConstants';


@Component({
  selector: 'app-depositos-header',
  templateUrl: './depositos-header.component.html',
  styleUrls: ['./depositos-header.component.scss'],
  standalone: false
})
export class DepositosHeaderComponent implements OnInit {


  @Output()
  backClicked: EventEmitter<string> = new EventEmitter<string>();


  public depositService = inject(DepositService);
  public adjuntoService = inject(AdjuntoService);
  public synchronizationServices = inject(SynchronizationDBService);
  public messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  public subscriberShow: any;
  public subscriberDisabled: any;
  public subscriberToSend: any;

  public subscriptionWeightLimit: Subscription | undefined;
  public subscriptionAttachmentChange: Subscription | undefined;

  public alertMessageOpenSend: Boolean = false;
  public alertMessageOpenSave: Boolean = false;
  /** Alerta local de validación (mensaje exacto). */
  public alertMessageOpenValidation = false;
  public validationFailureMessage = '';
  public alertButtonsValidation: any[] = [];

  public DEPOSITO_STATUS_NEW = DEPOSITO_STATUS_NEW;
  public DEPOSITO_STATUS_SAVED = DEPOSITO_STATUS_SAVED;
  public DEPOSITO_STATUS_TO_SEND = DEPOSITO_STATUS_TO_SEND;
  public DEPOSITO_STATUS_SENT = DEPOSITO_STATUS_SENT;

  public buttonsSalvar = [
    {
      text: '',
      role: 'save',
      handler: () => {
        console.log('save and exit');
        if (!this.validateDepositBeforeSave()) {
          return;
        }
        this.persistDepositSaved().then((ok) => {
          if (!ok) {
            return;
          }
          this.depositService.depositValid = false;
          this.messageService.hideLoading();
          this.messageService.alertModal({
            header: this.depositService.depositTags.get('DEP_HEADER_MESSAGE') ?? 'Depósitos',
            message: this.depositService.depositTags.get('DEP_SAVE_MSG')
              ?? 'El Depósito se ha guardado',
          });
          this.depositService.showBackRoute('depositos');
        });
      },
    },
    {
      text: '',
      role: 'exit',
      handler: () => {
        console.log('exit w/o save');
        this.depositService.depositValid = false;
        this.depositService.showBackRoute('depositos');


      },
    },
    {
      text: '',
      role: 'cancel',
      handler: () => {
        console.log('exit canceled');
      },
    },
  ];



  constructor(
    private router: Router,
    private platform: Platform,
  ) { }

  ngOnInit() {

    this.subscriberShow = this.depositService.showButtons.subscribe((showButtons: Boolean) => {
      this.depositService.showHeaderButtons = showButtons;
    });

    this.subscriberDisabled = this.depositService.depositValidToSave.subscribe((validToSave: Boolean) => {
      this.depositService.disabledSaveButton = !validToSave;
    });

    this.subscriberToSend = this.depositService.depositValidToSend.subscribe((validToSend: Boolean) => {
      this.depositService.disabledSendButton = !validToSend;
    });

    this.subscriptionAttachmentChange = this.adjuntoService.AttachmentChanged.subscribe(() => {
      this.depositService.notifyDepositEdited();
    });

    this.subscriptionWeightLimit = this.adjuntoService.AttachmentWeightExceeded.subscribe(() => {
      this.depositService.updateSaveButtonAvailability();
      this.depositService.updateSendButtonAvailability();
    });

    const confirmText = this.depositService.depositTagsDenario.get('DENARIO_BOTON_ACEPTAR')
      ?? 'Aceptar';
    this.alertButtonsValidation = [
      {
        text: confirmText,
        role: 'confirm',
      },
    ];

  }

  ngOnDestroy() {
    this.subscriberShow.unsubscribe();
    this.subscriberDisabled.unsubscribe();
    this.subscriberToSend.unsubscribe();
    this.backButtonSubscription.unsubscribe();
    this.subscriptionAttachmentChange?.unsubscribe();
    this.subscriptionWeightLimit?.unsubscribe();
  }

  private notifyDepositValidationFailure(options: {
    blockSend: boolean;
    message: string;
    focusTab?: 'default' | 'cobros' | 'total' | 'adjuntos';
  }): void {
    if (options.blockSend) {
      this.depositService.sendBlockedByFields = true;
      this.depositService.updateSendButtonAvailability();
    }
    // Primero saltar a la pestaña del error; luego mostrar el mensaje exacto.
    this.depositService.requestSendValidationTabFocus(options.focusTab);
    this.showDepositValidationAlert(options.message);
  }

  private showDepositValidationAlert(rawMessage: string): void {
    const message = (rawMessage ?? '').toString().trim()
      || 'Complete los campos obligatorios antes de continuar.';
    this.validationFailureMessage = message;
    this.alertMessageOpenValidation = true;
    this.cdr.detectChanges();
  }

  setResultValidation(): void {
    this.alertMessageOpenValidation = false;
  }

  /** Guardar / Guardar y salir: SOLO banco en General. Nunca cobros/plantilla/firma/GPS. */
  private validateDepositBeforeSave(): boolean {
    // No usar hasDepositFieldErrors() aquí (eso es solo Enviar).
    if (!this.depositService.hasDepositSaveErrors()) {
      return true;
    }
    this.notifyDepositValidationFailure({
      blockSend: false,
      message: this.depositService.getDepositSaveValidationMessage(),
      focusTab: 'default',
    });
    return false;
  }

  /** Enviar: validación completa (banco → cobros → plantilla → firma → GPS). */
  private validateDepositBeforeSend(): boolean {
    this.depositService.sendValidationAttempted = true;

    if (this.depositService.hasDepositFieldErrors()) {
      this.notifyDepositValidationFailure({
        blockSend: true,
        message: this.depositService.getDepositValidationMessage(),
      });
      return false;
    }

    this.depositService.sendBlockedByFields = false;
    this.depositService.updateSendButtonAvailability();
    return true;
  }

  setResultSend(ev: any) {
    console.log('Apretó:' + ev.detail.role);
    if (ev.detail.role === 'confirm') {
      this.alertMessageOpenSend = false;
      this.sendDeposit();
    } else {
      this.alertMessageOpenSend = false;
    }
  }

  setResultSave(ev: any) {
    console.log('Apretó:' + ev.detail.role);
    if (ev.detail.role === 'confirm') {
      // Cerrar confirmación; el éxito NO reusa este alert (evita loop al Aceptar).
      this.alertMessageOpenSave = false;
      void this.persistDepositSaved().then((ok) => {
        if (!ok) {
          this.messageService.hideLoading();
          return;
        }
        this.messageService.hideLoading();
        this.messageService.alertModal({
          header: this.depositService.depositTags.get('DEP_HEADER_MESSAGE') ?? 'Depósitos',
          message: this.depositService.depositTags.get('DEP_SAVE_MSG')
            ?? 'El Depósito se ha guardado',
        });
      });
    } else {
      this.alertMessageOpenSave = false;
    }
  }



  goBack() {
    if (!this.depositService.depositValid) {
      this.depositService.saveOrExitOpen = false;
      this.depositService.showBackRoute('depositos');
      return;
    }

    const shouldPromptExitSaveOrDiscard =
      !this.depositService.depositPersistedBaseline || this.depositService.depositDirtySincePersist;

    if (shouldPromptExitSaveOrDiscard) {
      this.buttonsSalvar[0].text = this.depositService.depositTagsDenario.get('DENARIO_BOTON_SALIR_GUARDAR')!
      this.buttonsSalvar[1].text = this.depositService.depositTagsDenario.get('DENARIO_BOTON_SALIR')!
      this.buttonsSalvar[2].text = this.depositService.depositTagsDenario.get('DENARIO_BOTON_CANCELAR')!
      this.depositService.saveOrExitOpen = true;
    } else {
      this.depositService.showBackRoute('depositos');
    }

  }

  backButtonSubscription: Subscription = this.platform.backButton.subscribeWithPriority(10, () => {
    //console.log('backButton was called!');
    this.goBack();
  });

  buttonSave() {
    // Borrador: no exigir cobros ni firma (DEP-SAVE-001).
    if (!this.validateDepositBeforeSave()) {
      return;
    }
    this.depositService.message =
      this.depositService.depositTags.get('DEP_MSJ_SAVE_QUESTION')
      ?? '¿Desea guardar el Depósito?';
    this.alertMessageOpenSave = true;
  }

  buttonSend() {
    // Enviar: validación estricta (cobros, plantilla, firma, GPS).
    if (!this.validateDepositBeforeSend()) {
      return;
    }
    this.depositService.message =
      this.depositService.depositTags.get('DEP_MSJ_SEND_QUESTION')
      ?? this.depositService.depositTags.get('DEP_SEND_MSG')
      ?? '¿Desea enviar el Depósito?';
    this.alertMessageOpenSend = true;
  }

  persistDepositSaved(): Promise<boolean> {
    return this.messageService.showLoading().then(() => {
      this.depositService.deposit.stDeposit = this.DEPOSITO_STATUS_SAVED;
      this.depositService.deposit.stDelivery = this.DEPOSITO_STATUS_SAVED;
      return this.depositService.saveDeposit(this.synchronizationServices.getDatabase(), this.depositService.deposit).then(resp => {
        console.log("DEPOSIT SAVE");
        this.adjuntoService.savePhotos(this.synchronizationServices.getDatabase(), this.depositService.deposit.coDeposit, "depositos");
        this.depositService.applyPersistSucceededBaseline();
        this.depositService.resetSendValidationUx();
        return true;
      });
    });

  }

  sendDeposit() {
    this.messageService.showLoading().then(() => {
      this.depositService.deposit.stDeposit = this.DEPOSITO_STATUS_TO_SEND;
      this.depositService.deposit.stDelivery = this.DEPOSITO_STATUS_TO_SEND;
      this.depositService.saveDeposit(this.synchronizationServices.getDatabase(), this.depositService.deposit).then(resp => {
        console.log("DEPOSIT SAVE READY TO SEND");
        this.depositService.applyPersistSucceededBaseline();
        this.depositService.resetSendValidationUx();
        this.messageService.alertModal(
          {
            header: this.depositService.depositTags.get('DENARIO_NOMBRE_APP')!,
            message: this.depositService.depositTags.get('DEP_SEND_MSG')!,
          }
        );
        this.adjuntoService.savePhotos(this.synchronizationServices.getDatabase(), this.depositService.deposit.coDeposit, "depositos");
        this.depositService.sendDeposit.next(this.depositService.deposit.coDeposit);
        this.messageService.hideLoading();
      });
    });

  }


  setsaveOrExitOpen(isOpen: boolean) {
    this.depositService.saveOrExitOpen = isOpen;
  }
}
