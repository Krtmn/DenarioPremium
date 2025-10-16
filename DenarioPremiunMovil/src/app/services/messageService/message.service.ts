import { Injectable, OnInit } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { LoadingController } from '@ionic/angular';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { ServicesService } from '../services.service';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { MessageSaveOrExit } from 'src/app/modelos/tables/messageSaveOrExit';
import { MessageButton } from 'src/app/modelos/message-button';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  //transaccionMsj = new EventEmitter<string>;
  transaccionMsj = new Subject<string>;
  transaccionMsjNB = new Subject<string>; //para mensajes que el boton no va atras
  alertModalMsj = new Subject<MessageAlert>; //para mensajes que el boton no va atras
  alertModalMsj2 = new Subject<MessageAlert>; //para mensajes que el boton no va atras
  saveOrExitOpen = new Subject<MessageSaveOrExit>; //para mensajes de salvar o salir
  confirmSend = new Subject<MessageAlert>; // para mensajes de confirmar envio

  customBtn = new Subject<[MessageAlert, MessageButton[]]>; //para mensajes con acciones personalizadas en los botones

  alertModalLoginModule = new Subject<[MessageAlert, string]>; //para mensajes que el boton no va atras


  //para cerrar los modales
  closeTransactionSubject = new Subject;
  closeTransactionNBSubject = new Subject;
  closeAlertModalSubject = new Subject;
  closeAlertModal2Subject = new Subject;
  closeModalLoginSubject = new Subject;

  closeModalCustomBtn = new Subject;

  dismissAllBtn = new Subject;

  private messageQueue: Array<{ type: string, payload: any }> = [];
  private showingMessage = false;


  constructor(
    private loadingCtrl: LoadingController,
    private dbServ: SynchronizationDBService,
    private services: ServicesService,
  ) { }

  public tags = new Map<string, string>([]);



  async showLoading() {
    /*
    Muestra una pantalla de carga. 
  
    Para usar esta pantalla se debe usar la promesa devuelta por esta funcion.
    y realizar todo el proceso que requiere esta ventana de carga dentro del .then() de esta promesa.
  
    Al terminar, usar hideLoading() de este servicio para cerrar el pop-up.
  
    Si no es usado de esta forma, es posible que se intente ocultar 
    un loading screen que aun no existe.
    */
    const loading = await this.loadingCtrl.create({
      message: 'Cargando...',
    });
    return loading.present();
  }

  async hideLoading() {
    let topLoader = await this.loadingCtrl.getTop();
    while (topLoader) {
      await this.loadingCtrl.dismiss();
      topLoader = await this.loadingCtrl.getTop();
    }
    /*
    this.loadingCtrl.getTop().then(v => {
      if (v) {
        this.loadingCtrl.dismiss();
        //this.hideLoading();
      } else {
        return;
      }
    }
    );
    */

  }
  //saveOrExit: MessageSaveOrExit = {} as MessageSaveOrExit;

  transaccionMsjModal(msj: string) {
    this.transaccionMsj.next(msj);
    //this.transaccionMsj.emit(msj);
  }

  transaccionMsjModalNB(msj: string) {
    this.transaccionMsjNB.next(msj);

  }
  alertModal(msj: MessageAlert) {
    this.alertModalMsj.next(msj);

  }
  alertModal2(msj: MessageAlert) {
    this.alertModalMsj2.next(msj);
  }

  alertModalModule(msj: MessageAlert, module: string) {
    this.alertModalLoginModule.next([msj, module]);
  }
  alertCustomBtn(msj: MessageAlert, btns: MessageButton[]) {
    this.customBtn.next([msj, btns]);
  }

  closeTransaction() {
    this.closeTransactionSubject.next(null);
  }
  closeTransactionNB() {
    this.closeTransactionNBSubject.next(null);
  }
  closeAlertModal() {
    this.closeAlertModalSubject.next(null);
  }
  closeAlertModal2() {
    this.closeAlertModal2Subject.next(null);
  }
  /*   closeConfirmSend() {
      this.closeConfirmSendSubject.next(null);
    }
    closeSaveOrExit() {
      this.closeSaveOrExitSubject.next(null);
    } */
  closeModalLogin() {
    this.closeModalLoginSubject.next(null);
  }

  closeCustomBtn() {
    this.closeModalCustomBtn.next(null);
  }

  dismissAll() {
    //cierra todos los mensajes que esten abiertos
    //para cuando quedan mensajes abiertos ladilla
    this.dismissAllBtn.next(null);
  }

}
