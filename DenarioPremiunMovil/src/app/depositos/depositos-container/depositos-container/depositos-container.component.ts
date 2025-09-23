import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BankAccount } from 'src/app/modelos/tables/bankAccount';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { DepositService } from 'src/app/services/deposit/deposit.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
    selector: 'app-depositos-container',
    templateUrl: './depositos-container.component.html',
    styleUrls: ['./depositos-container.component.scss'],
    standalone: false
})
export class DepositosContainerComponent implements OnInit {

  public depositService = inject(DepositService);
  public router = inject(Router);
  public dateServ = inject(DateServiceService);
  geoLoc = inject(GeolocationService);
synchronizationServices = inject(SynchronizationDBService);
  public subs: any;

  constructor() { }

  ngOnInit() {

    this.backRoute();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  backRoute() {
    this.subs = this.depositService.backRoute.subscribe((data: string) => {
      console.log('Back-Container: ' + data);
      if (this.depositService.depositComponent) {
        //this.depositService.depositComponent = false;
        this.router.navigate(['home']);
      } else if (this.depositService.depositNewComponent) {
        this.depositService.showHeaderButtonsFunction(false);
        this.depositService.depositNewComponent = false;
        this.depositService.depositComponent = true;
      } else if (this.depositService.depositListComponent) {
        this.depositService.hideDeposit = false;
        this.depositService.showHeaderButtonsFunction(false);
        this.depositService.depositListComponent = false;
        this.depositService.depositComponent = true;
      }

    });
  }

  nuevoDeposito(){
  if(this.depositService.userMustActivateGPS){
    //TRUE: si no hay coordenada no entra
    this.geoLoc.getCurrentPosition().then(xy => { 
      this.depositService.coordenadas = xy;
      this.goToNuevoDeposito();
    })
  }else{
    //FALSE:  se permite entrar asi coordenadas esten vacias
    this.geoLoc.getCurrentPosition().then(xy => { 
      this.depositService.coordenadas = xy;      
    })
    this.goToNuevoDeposito();
  }
  }



  goToNuevoDeposito() {
    this.depositService.showHeaderButtonsFunction(true);
    //this.depositService.showHeaderButtons = false;     
    //let date = this.dateServ.now();
    this.depositService.nuDocument = "";
    this.depositService.txComment = "";
    this.depositService.bankSelected = {} as BankAccount;
    this.depositService.dateDeposit = this.dateServ.hoyISOFullTime();
    this.depositService.depositComponent = false;
    this.depositService.depositNewComponent = true;
    this.depositService.initServices(this.synchronizationServices.getDatabase(),);
  }

  buscarDeposito() {
    this.depositService.getAllDeposits(this.synchronizationServices.getDatabase(),).then(r => {
      this.depositService.depositComponent = false;      
      this.depositService.depositListComponent = true;
    })
  }

}