import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Location } from '@angular/common';
import { MessageService } from 'src/app/services/messageService/message.service';
import { MessageAlert } from '../modelos/tables/messageAlert';
import { MessageSaveOrExit } from '../modelos/tables/messageSaveOrExit';
import { LoginLogicService } from '../services/login/login-logic.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { IonAlert } from '@ionic/angular';


@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
  standalone: false
})
export class MessageComponent implements OnInit, OnDestroy {

  public isAlertOpen = false;
  public isAlertNBOpen = false;
  public alertMessageOpen = false;
  public alertMessageOpen2 = false;

  public alertCustomBtnOpen = false;

  public alertMessageModule = false;
  public alertButtons = ['OK'];
  public alertButtons11 = ['OK', 'CANCEL'];
  public mensaje!: string;
  public header!: string;

  public headerMsg = "";
  public exitMsg = "";
  //public subs: Subscription[] = [];
  public moduleActive: string = "";

  //subscripciones
  subTransaccionMsj: any;
  closeTransaction: any;
  subTransaccionMsjNB: any;
  closeTransactionNB: any;
  subAlertModalMsj: any;
  closeAlertModal: any
  subAlertModalMsj2: any;
  closeAlertModal2: any;
  subConfirmSend: any;
  closeConfirmSend: any;
  subSaveOrExitOpen: any;
  closeSaveOrExitOpen: any;
  subModalLoginModule: any;
  closeModalLogin: any;

  subModalBtnCustom: any;

  closeModalCustom: any;

  subDismissAll: any;
  private messageService = inject(MessageService)
  public loginLogic = inject(LoginLogicService)

  @ViewChild('alertCustomBtn') alertCustom!: IonAlert; //el campo mas maricon de toda la creacion.

  setResult(ev: any) {
    console.log(`Dismissed with role: ${ev.detail.role}`);
  }

  constructor(
    private location: Location,

  ) { }


  ngOnInit(): void {
    //this.messageService.getTags(); //esto tranca la pagina de login al instalar

    //console.log("[MessageComponent] Subscribing...")

    this.subTransaccionMsj = this.messageService.transaccionMsj.subscribe((data: string) => {
      console.log(data);
      this.mensaje = data;
      this.setOpen(true);
    })

    this.closeTransaction = this.messageService.closeTransactionSubject.subscribe(() => {
      this.isAlertOpen = false;
      //this.messageService.dismissAll();

    })


    this.subTransaccionMsjNB = this.messageService.transaccionMsjNB.subscribe((data: string) => {
      console.log(data);
      this.mensaje = data;
      this.setNBOpen(true);
    })

    this.closeTransactionNB = this.messageService.closeTransactionNBSubject.subscribe(() => {
      this.isAlertNBOpen = false;
      //this.messageService.dismissAll();
    })


    this.subAlertModalMsj = this.messageService.alertModalMsj.subscribe((data: MessageAlert) => {
      console.log(data);
      this.header = data.header;
      this.mensaje = data.message;
      this.setAlertMessage(true);
    })

    this.closeAlertModal = this.messageService.closeAlertModalSubject.subscribe((() => {     
      this.alertMessageOpen = false;
      //this.messageService.dismissAll();
    }))


    this.subAlertModalMsj2 = this.messageService.alertModalMsj2.subscribe((data: MessageAlert) => {
      console.log(data);
      this.header = data.header;
      this.mensaje = data.message;
      this.setAlertMessage2(true);
    })

    this.closeAlertModal2 = this.messageService.closeAlertModal2Subject.subscribe(() => {
      this.alertMessageOpen = false;

    })

    this.subDismissAll = this.messageService.dismissAllBtn.subscribe(() => {
      this.dismissAll();
    })



    this.subModalLoginModule = this.messageService.alertModalLoginModule.subscribe(([data, module]) => {
      console.log(data);
      this.header = data.header;
      this.mensaje = data.message;
      this.setAlertMessageModule(true, module);
    });

    this.closeModalLogin = this.messageService.closeModalLoginSubject.subscribe(() => {
      this.alertMessageModule = false;
      this.messageService.hideLoading();
      //this.messageService.dismissAll();
    });

    this.subModalBtnCustom = this.messageService.customBtn.subscribe(([data, buttons]) => {
      console.log(data);
      this.header = data.header;
      this.mensaje = data.message;
      this.buttonsCustom = buttons;
      this.setalertCustomBtnOpen(true);

    });

    this.closeModalCustom = this.messageService.closeModalCustomBtn.subscribe(() => {
      this.alertCustomBtnOpen = false;
      // dismiss de forma segura (si el ViewChild existe y la alerta está montada)
      this.safeDismiss(this.alertCustom);
    })
  }

  private async safeDismiss(alert?: IonAlert | null) {
    if (!alert) return;
    try {
      const dismissFn = (alert as any)?.dismiss;
      if (typeof dismissFn === 'function') {
        // small delay para dejar que Angular/Ionic complete cambios de estado
        await new Promise(res => setTimeout(res, 40));
        await dismissFn.call(alert).catch((e: any) => {
          console.warn('[MessageComponent] alert.dismiss() rejected:', e);
        });
      }
    } catch (e) {
      console.warn('[MessageComponent] safeDismiss error:', e);
    }
  }

  dismissAll() {
    //cierra todos los mensajes
    this.isAlertOpen = false;
    this.isAlertNBOpen = false;
    this.alertMessageOpen = false;
    this.alertMessageOpen2 = false;
    this.alertMessageModule = false;
    this.alertCustomBtnOpen = false;
  }

  ngOnDestroy() {
    console.log("[MessageComponent] Unsubscribing...")

    this.subTransaccionMsj.unsubscribe();
    this.subTransaccionMsjNB.unsubscribe();
    this.subAlertModalMsj.unsubscribe();
    this.subAlertModalMsj2.unsubscribe();

    this.subModalLoginModule.unsubscribe();

    this.closeAlertModal.unsubscribe();
    this.closeAlertModal2.unsubscribe();

    this.closeModalLogin.unsubscribe();

    this.closeTransaction.unsubscribe();
    this.closeTransactionNB.unsubscribe();

    this.closeModalCustom.unsubscribe();
    this.subModalBtnCustom.unsubscribe();

    this.subDismissAll.unsubscribe();

  }

  goBack(): void {
    this.location.back();
  }


  setOpen(isOpen: boolean) {
    this.isAlertOpen = isOpen;
    if (!isOpen) { this.messageService.closeTransaction(); }

  }

  setNBOpen(isOpen: boolean) {
    this.isAlertNBOpen = isOpen;
    if (!isOpen) { this.messageService.closeTransactionNB(); }
  }

  setAlertMessage(isOpen: boolean) {
    this.alertMessageOpen = isOpen;
    
    if (!isOpen) {
      console.log("AutoCerrando alerta modal"); 
      this.messageService.closeAlertModal() 
    }
    
  }
  setAlertMessage2(isOpen: boolean) {
    this.alertMessageOpen2 = isOpen;
    if (!isOpen) { this.messageService.closeAlertModal2() }

  }
  setAlertMessageModule(isOpen: boolean, module: string) {
    this.alertMessageModule = isOpen;
    this.moduleActive = module;
    console.log(module);
    if (!isOpen) { this.messageService.closeModalLogin() }
  }

  setalertCustomBtnOpen(value: boolean) {
    this.alertCustomBtnOpen = value;
    if (!value) {
      // notificar servicio para procesar cola, pero no forzar dismiss aquí
      this.messageService.closeCustomBtn();
      // intentar dismiss seguro por si quedó montada
      this.safeDismiss(this.alertCustom);
    }
  }
  public buttonsNuevos = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        console.log('Alert canceled');
      },
    },
    {
      text: 'Aceptar',
      role: 'confirm',
      handler: () => {
        console.log('Alert confirmed');
        if (this.moduleActive == "login") {
          this.loginLogic.changeUser.next(true);

        }
      },
    },
  ];
  public buttonsNuevosModules = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        console.log('Alert canceled');
      },
    },
    {
      text: 'Aceptar',
      role: 'confirm',
      handler: () => {
        console.log('Alert confirmed');
        if (this.moduleActive == "login") {
          this.loginLogic.changeUser.next(true);

        }
      },
    },
  ];

  public buttonsCustom = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => {
        console.log('Alert canceled');
      },
    },
    {
      text: 'Aceptar',
      role: 'confirm',
      handler: () => {
        console.log('Alert confirmed');

      },
    },
  ];
}