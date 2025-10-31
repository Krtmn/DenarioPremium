import { Component, inject } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { LoginLogicService } from './services/login/login-logic.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { ConversionService } from './services/conversion/conversion.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Enterprise } from './modelos/tables/enterprise';
import { GlobalConfigService } from './services/globalConfig/global-config.service';



@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  public networkStatus!: any;
  public netWork!: any;

  public loginService = inject(LoginLogicService);




  constructor(
    private platform: Platform,
    private router: Router
  ) {

  }

  async ngOnInit() {
    //conversionCalculator
    if (this.platform.is('ios'))
      StatusBar.hide();
    this.listenerNetwork()
    this.netWork = await Network.getStatus();



    localStorage.setItem("connected", String(this.netWork.connected));
    localStorage.setItem("connectionType", String(this.netWork.connectionType));
    //this.loginService.imgHome = "../../../assets/images/logoPremium.svg"
    //this.loginService.imgHome = "../../../assets/images/ferrari.jpg"
  }

  listenerNetwork() {
    Network.addListener('networkStatusChange', status => {
      //console.log('Network status changed', status);
      this.networkStatus = status;
      localStorage.setItem("connected", String(status.connected));
      localStorage.setItem("connectionType", String(status.connectionType));
    })
  }
}
