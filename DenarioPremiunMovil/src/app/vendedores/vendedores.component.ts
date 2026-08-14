import { Component, OnInit, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { ServicesService } from '../services/services.service';
import { UserInfoView } from '../modelos/tables/userInfoView';
import { MessageService } from 'src/app/services/messageService/message.service';
import { GlobalConfigService } from '../services/globalConfig/global-config.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { UserInformation } from '../modelos/tables/userInformation';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Enterprise } from '../modelos/tables/enterprise';
import { EnterpriseService } from '../services/enterprise/enterprise.service';
import { Platform } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';


@Component({
  selector: 'app-vendedores',
  templateUrl: './vendedores.component.html',
  styleUrls: ['./vendedores.component.scss'],
  standalone: false
})
export class VendedoresComponent implements OnInit, OnDestroy {
  router = inject(Router);
  observador!: any;
  userInfo: UserInfoView[] = [];
  infoVendedores: boolean = false;
  bdUserInfo?: UserInformation;
  /** VND-LOAD-001: métricas remotas en background; no bloquear listado de empresas. */
  loadingUserInfo = false;
  userInfoLoadFailed = false;

  empresas: Enterprise[] = [];

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
    this.router.navigate(['home']);
  });

  ngOnInit() {
    this.infoVendedores = this.globalConfig.get('infoVendedores') === 'true';
    this.getTags();
    // Empresas desde SQLite: pintar YA, sin modal global (VND-LOAD-001).
    void this.getEnterpriseInfo().then(() => {
      if (this.infoVendedores) {
        this.getUserInfoBD();
      } else {
        this.loadUserInfoInBackground();
      }
    });
  }

  getTags() {
    this.services.getTags(this.db.getDatabase(), 'VND', 'ESP').then(result => {
      for (let i = 0; i < result.length; i++) {
        this.tags.set(
          result[i].coApplicationTag, result[i].tag
        );
      }
      this.cdr.detectChanges();
    });
  }

  /**
   * HTTP userservice/userinformation puede tardar 20s+.
   * No usa MessageService.showLoading para no bloquear el acordeón de distribuidoras.
   */
  loadUserInfoInBackground(): Promise<void> {
    this.loadingUserInfo = true;
    this.userInfoLoadFailed = false;
    this.cdr.detectChanges();

    return this.services.getUserInformation().then(obs => {
      if (obs instanceof Observable) {
        console.error('Error al obtener la info del vendedor: el servicio devolvio un Observable.');
        this.userInfoLoadFailed = true;
        return;
      }

      this.observador = obs.data;
      this.userInfo = Array.isArray(this.observador?.userInfo)
        ? this.observador.userInfo
        : [];
    }).catch(e => {
      console.error('Error al obtener la info del vendedor: ', e);
      this.userInfoLoadFailed = true;
    }).finally(() => {
      this.loadingUserInfo = false;
      this.cdr.detectChanges();
    });
  }

  /** @deprecated usar loadUserInfoInBackground — se mantiene por compatibilidad de llamadas. */
  getUserInfo() {
    this.loadUserInfoInBackground();
  }

  async getEnterpriseInfo() {
    await this.enterpriseServ.setup(this.db.getDatabase());
    this.empresas = this.enterpriseServ.empresas;
    this.cdr.detectChanges();
  }

  onEnterpriseSelect() {
    this.getUserInfoBD();
  }

  async userInformationQuery(database: SQLiteObject) {
    const selectStatement = 'SELECT * FROM user_informations';
    return database.executeSql(selectStatement, [])
      .catch(
        err => console.log(err)
      );
  }

  getUserInfoBD() {
    this.userInformationQuery(this.db.getDatabase()).then(
      (result) => {
        if (result?.rows?.length > 0) {
          const ui = result.rows.item(0);
          this.bdUserInfo = new UserInformation(
            ui.id_user_information,
            ui.co_user,
            ui.id_user,
            ui.title,
            ui.content,
            ui.co_enterprise,
            ui.id_enterprise
          );
          this.cdr.detectChanges();
        }
      }
    );
  }

  showInfo(empresa: Enterprise, info: UserInfoView) {
    return info.coEnterprise === empresa.coEnterprise;
  }

  hasMetricsForEnterprise(empresa: Enterprise): boolean {
    return (this.userInfo || []).some(info => this.showInfo(empresa, info));
  }

  ngOnDestroy() {
    this.backButtonSubscription.unsubscribe();
    // Por si quedó un loading global de una versión anterior / carrera.
    void this.message.hideLoading();
  }

}
