import { Component, inject, OnInit } from '@angular/core';
import { InfiniteScrollCustomEvent } from '@ionic/angular';
import { Deposit } from 'src/app/modelos/tables/deposit';
import { DepositService } from 'src/app/services/deposit/deposit.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { DELIVERY_STATUS_SAVED, DELIVERY_STATUS_SENT, DELIVERY_STATUS_TO_SEND } from 'src/app/utils/appConstants';
import { ItemListaDepositos } from '../../item-lista-depositos';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';


@Component({
  selector: 'app-deposito-list',
  templateUrl: './deposito-list.component.html',
  styleUrls: ['./deposito-list.component.scss'],
  standalone: false
})
export class DepositoListComponent implements OnInit {

  public depositService = inject(DepositService)
  geoLoc = inject(GeolocationService);
  db = inject(SynchronizationDBService);

  public indice = 0;

  public valid: Boolean = false;
  public alertDelete: boolean = false;
  public searchText: string = '';
  public selectedDeposit!: Deposit;
  public selectedDepositIndex: number = 0;
  public headerDelete = "";
  public mensajeDelete = "";
  public buttonsDelete = [
    {
      text: this.depositService.depositTagsDenario.get('DENARIO_BOTON_CANCELAR') ? this.depositService.depositTagsDenario.get('DENARIO_BOTON_CANCELAR') : "Cancelar",
      role: 'cancel',
      handler: () => {
        //console.log('Alert canceled');
      },
    },
    {
      text: this.depositService.depositTagsDenario.get('DENARIO_BOTON_ACEPTAR') ? this.depositService.depositTagsDenario.get('DENARIO_BOTON_ACEPTAR') : "Eliminar",
      role: 'confirm',
      handler: () => {
        this.deleteDeposit();
      },
    }
  ];

  constructor() { }

  ngOnInit() {
    this.headerDelete = this.depositService.depositTags.get('DEP_HEADER_MESSAGE')!;
    this.mensajeDelete = "¿Desea eliminar el depósito seleccionado?";
  }

  toOpenDeposit(coDeposit: string, index: number) {
    let stDeposit = this.depositService.listDeposits[index].stDeposit;
    if (this.depositService.userMustActivateGPS && stDeposit < 2) {
      //solo puede abrir depositos editables con gps activo
      this.geoLoc.getCurrentPosition().then(xy => {
        if (xy.length > 0) {
          this.depositService.coordenadas = xy;
          this.openDeposit(coDeposit, index);
        }
      })
    } else {
      //se actualiza coordenadas si no estan vacias. 
      this.geoLoc.getCurrentPosition().then(xy => {
        if (xy.length > 0) {
          this.depositService.coordenadas = xy;
        }
        this.openDeposit(coDeposit, index);
      })
    }
  }


  openDeposit(coDeposit: string, index: number) {
    console.log("OPEN", coDeposit, index);
    if (this.depositService.listDeposits[index].stDeposit >= 2) {
      //por enviar o enviado entones ocultamos la pestaña de cobros     
      this.depositService.hideDeposit = true;
      this.depositService.deposit = this.depositService.listDeposits[index];
      this.depositService.getDepositCollect(this.db.getDatabase(), this.depositService.deposit.coDeposit).then(resp => {
        this.depositService.initOpenDeposit(this.db.getDatabase(),).then(r => {
          this.depositService.depositListComponent = false;
          this.depositService.depositNewComponent = true;

          this.depositService.dateDeposit = this.depositService.deposit.daDeposit;
        })
      })

    } else {
      //nuevo o guardado mostramos la pestaña cobros
      this.depositService.hideDeposit = false;
      this.depositService.deposit = this.depositService.listDeposits[index];
      if (this.depositService.coordenadas.length > 0) {
        this.depositService.deposit.coordenada = this.depositService.coordenadas;
      }
      this.depositService.getDepositCollect(this.db.getDatabase(), this.depositService.deposit.coDeposit).then(resp => {
        this.depositService.initOpenDeposit(this.db.getDatabase(),).then(r => {
          this.depositService.depositListComponent = false;
          this.depositService.depositNewComponent = true;
          this.depositService.showHeaderButtons = true;
        })
      })
    }


  }


  showAlertDelete(deleteDeposit: ItemListaDepositos, index: number) {
    this.selectedDeposit = this.depositService.listDeposits[index];
    this.selectedDepositIndex = index;
    this.setAlertDelete(true);
  }

  setAlertDelete(value: boolean) {
    this.alertDelete = value;
  }

  deleteDeposit() {
    this.depositService.deleteDeposit(this.db.getDatabase(), this.selectedDeposit.coDeposit).then(r => {
      this.depositService.listDeposits.splice(this.selectedDepositIndex, 1);
      this.depositService.itemListaDepositos.splice(this.selectedDepositIndex, 1);
      console.log(r, "BORRADO CON EXITO");
    })
  }
  onIonInfinite(ev: any) {
    this.indice++;
    setTimeout(() => {
      (ev as InfiniteScrollCustomEvent).target.complete();
    }, 800);
  }
  handleInput(event: any) {
    this.searchText = event.target.value.toLowerCase();
  }
  getStatusOrderName(status: number, naStatus: string) {
    switch (status) {
      case DELIVERY_STATUS_SAVED: return this.depositService.depositTagsDenario.get("DENARIO_DEV_SAVED")!;
      case DELIVERY_STATUS_TO_SEND: return this.depositService.depositTagsDenario.get("DENARIO_DEV_TO_BE_SENDED")!;
      case DELIVERY_STATUS_SENT: return this.depositService.depositTagsDenario.get("DENARIO_DEV_STATUS")!;
      case 6: return naStatus!;
      default: return '';
    }
  }
}