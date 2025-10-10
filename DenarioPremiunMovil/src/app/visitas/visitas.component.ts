import { Component, inject, OnInit } from '@angular/core';
import { VisitasService } from './visitas.service';
import { Router } from '@angular/router';
import { MessageService } from 'src/app/services/messageService/message.service';
import { MessageComponent } from 'src/app/message/message.component';
import { GeolocationService } from '../services/geolocation/geolocation.service';
import { Subscription } from 'rxjs';
import { Platform } from '@ionic/angular';


@Component({
  selector: 'app-visitas',
  templateUrl: './visitas.component.html',
  styleUrls: ['./visitas.component.scss'],
  standalone: false
})
export class VisitasComponent implements OnInit {
  private service = inject(VisitasService);
  private router = inject(Router);  
  private geoLoc = inject(GeolocationService);
  private message = inject(MessageService);

  public rolTransportista: boolean = false;

  backButtonSubscription: Subscription = this.platform.backButton.subscribeWithPriority(10, () => {
    //console.log('backButton was called!');
    this.router.navigate(['home']);
  });


  constructor(
    private platform: Platform,
  ) {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        let userTransportista = JSON.parse(userStr);
        if (userTransportista.transportista) {
          this.rolTransportista = true;
        }
      } catch (e) {
        this.rolTransportista = false;
      }
    }
    this.service.coordenadas = "";
    if (this.service.userMustActivateGPS) {
      this.geoLoc.getCurrentPosition().then(xy => {
        if (xy.length > 0) {
          this.service.coordenadas = xy;
        }
      })
    }
  }

  ngOnInit() {
    this.service.getTags();
    this.service.getLists();
    this.service.getConfiguration();


  }

  ngOnDestroy() {
    this.backButtonSubscription.unsubscribe();
  }

  getTag(tagName: string) {
    return this.service.getTag(tagName);
  }

  nuevaVisita() {
    //console.log("Nueva visita!");
    this.message.showLoading().then(() => {
      if (this.service.userMustActivateGPS ) {
        if(this.service.coordenadas &&this.service.coordenadas.length > 0){
            this.navigateToNuevaVisita();
        }else{
            this.geoLoc.getCurrentPosition().then(xy => {
          if (xy.length > 0) {
            this.service.coordenadas = xy;
            this.navigateToNuevaVisita();
          }else{
            this.message.hideLoading();
          }
        })
        }   
      } else {
          this.navigateToNuevaVisita();
      }
    });
    

  }

  navigateToNuevaVisita(){
    this.service.editVisit = false;
    this.router.navigate(['visita']);
  }

  verVisita() {
    //console.log("Vieja visita!");
    this.router.navigate(['listaVisitas']);
  }

}
