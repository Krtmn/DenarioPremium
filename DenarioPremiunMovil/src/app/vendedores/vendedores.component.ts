import { Component, OnInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { ServicesService } from '../services/services.service';
import { UserInfoView } from '../modelos/tables/userInfoView';
import { MessageService } from 'src/app/services/messageService/message.service';
import { GlobalConfigService } from '../services/globalConfig/global-config.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { UserInformation } from '../modelos/tables/userInformation';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Enterprise } from '../modelos/tables/enterprise';
import { EnterpriseService } from '../services/enterprise/enterprise.service';
import { IonAccordionGroup, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';


@Component({
    selector: 'app-vendedores',
    templateUrl: './vendedores.component.html',
    styleUrls: ['./vendedores.component.scss'],
    standalone: false
})
export class VendedoresComponent  implements OnInit {
  router = inject(Router);
  observador!: any;
  userInfo!: UserInfoView[];
  infoVendedores: boolean = false;
  bdUserInfo?: UserInformation;

  //multiempresa = false;
  empresas: Enterprise[] = [];
  //empresaSeleccionada!: Enterprise;

  
  public tags = new Map<string, string>([]);
  constructor(
    private services: ServicesService,
    private db: SynchronizationDBService,
    private message: MessageService,
    private globalConfig: GlobalConfigService,    
    private enterpriseServ: EnterpriseService,
    private cdr: ChangeDetectorRef,
    private platform: Platform,
    ) {    
  }

  backButtonSubscription: Subscription = this.platform.backButton.subscribeWithPriority(10, () => {
      //console.log('backButton was called!');
      this.router.navigate(['home']);
    });

  ngOnInit() {
    this.message.showLoading().then(()=>{
      this.getTags();  //buscamos los tags
      this.infoVendedores = this.globalConfig.get("infoVendedores") === "true"; //chequeamos variable global infoVendedores   
      this.getEnterpriseInfo(); //buscamos info de empresas / multiempresas      

      if(this.infoVendedores){
          this.getUserInfoBD();
          this.message.hideLoading();       
      }else{
        // metodo por defecto        
        this.getUserInfo();
      }
      
    });
    
    
        

  }
  
  getTags(){
    this.services.getTags(this.db.getDatabase(), "VND", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.tags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      if(this.tags){
        console.log(this.tags);
      }      
      
    })
  }

  getUserInfo(){
    //obtiene la info del vendedor por el servicio      
      this.services.getUserInformation().subscribe({
      next: (obs : Response) => {
        this.observador = obs;
        this.userInfo = this.observador.userInfo;
        //console.log("!!! USER INFO: ");
        console.log(this.userInfo);
      }, 
      error: (e) => console.error(e),
      complete: () => { this.message.hideLoading(); }
    });
  }

   async getEnterpriseInfo(){
      this.enterpriseServ.setup(this.db.getDatabase()).then(() =>{
      this.empresas = this.enterpriseServ.empresas;

    });
  }

  onEnterpriseSelect(){
    this.getUserInfoBD();
  }

  async userInformationQuery(database: SQLiteObject){
    var selectStatement = "SELECT * FROM user_informations" ;
    console.log(selectStatement);
    return database.executeSql(selectStatement, [])
    .catch(
      err => console.log(err)
    );
  }

  getUserInfoBD(){
    //obtiene la info del vendedor por la BD de la app.
    console.log("en userInfoBD");
    this.userInformationQuery(this.db.getDatabase()).then(
      (result) => {
        console.log("bdUserInfo: ");
        if(result.rows.length > 0){
          var ui = result.rows.item(0);
          this.bdUserInfo = new UserInformation(
            ui.id_user_information, 
            ui.co_user,
            ui.id_user,
            ui.title,
            ui.content,
            ui.co_enterprise,
            ui.id_enterprise
          );
          console.log(this.bdUserInfo);
          this.cdr.detectChanges();
        }
        
      }
    );
  }

  showInfo(empresa: Enterprise, info: UserInfoView){
    return info.coEnterprise === empresa.coEnterprise;
}

  ngOnDestroy() {
    this.backButtonSubscription.unsubscribe();
  }

}
