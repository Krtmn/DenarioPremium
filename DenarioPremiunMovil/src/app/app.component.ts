import { Component, inject } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { LoginLogicService } from './services/login/login-logic.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';



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
    private platform: Platform
  ) {

  }

  async ngOnInit() {
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
