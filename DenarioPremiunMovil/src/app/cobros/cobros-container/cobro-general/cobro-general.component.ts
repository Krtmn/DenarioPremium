//CAPACTIOR IONIC
import { Component, EventEmitter, OnInit, Output, inject, ViewChild, Input, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { ClienteSelectorComponent } from '../../../cliente-selector/cliente-selector.component';
import { Client } from 'src/app/modelos/tables/client';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { CollectionDetail, CollectionPayment } from 'src/app/modelos/tables/collection';
import { CollectionService } from 'src/app/services/collection/collection-logic.service';
import { Currencies } from 'src/app/modelos/tables/currencies';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { ConversionType } from 'src/app/modelos/tables/conversionType';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { MessageService } from 'src/app/services/messageService/message.service';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { COLOR_VERDE } from 'src/app/utils/appConstants';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { ClientesDatabaseServicesService } from 'src/app/services/clientes/clientes-database-services.service';
import { PagoEfectivo } from 'src/app/modelos/pago-efectivo';
import { PagoTransferencia } from 'src/app/modelos/pago-transferencia';
import { PagoDeposito } from 'src/app/modelos/pago-deposito';
import { PagoCheque } from 'src/app/modelos/pago-cheque';
import { PagoOtros } from 'src/app/modelos/pago-otros';
import { IonInput } from '@ionic/angular/directives/proxies';
import { ClienteSelectorService } from 'src/app/cliente-selector/cliente-selector.service';
import { BankAccount } from 'src/app/modelos/tables/bankAccount';
import { BancoReceptor } from 'src/app/modelos/bancoReceptor';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
  selector: 'app-cobro-general',
  templateUrl: './cobro-general.component.html',
  styleUrls: ['./cobro-general.component.scss'],
  standalone: false
})
export class CobrosGeneralComponent implements OnInit {

  @ViewChild('input') input!: IonInput;
  @ViewChild(ClienteSelectorComponent) selectorCliente!: ClienteSelectorComponent;

  private subscriptions: Subscription[] = [];

  // Servicios públicos solo si los usas en el template
  public collectService = inject(CollectionService);
  public dateServ = inject(DateServiceService);

  // Servicios privados
  private enterpriseServ = inject(EnterpriseService);
  private globalConfig = inject(GlobalConfigService);
  private geoServ = inject(GeolocationService);
  public currencyServices = inject(CurrencyService);
  private messageService = inject(MessageService);
  private clientService = inject(ClientesDatabaseServicesService);
  private adjuntoService = inject(AdjuntoService);
  public synchronizationServices = inject(SynchronizationDBService);

  // Variables públicas solo si las usas en el template
  public segment = 'default';
  public cobroValid: Boolean = false;
  public viewOnly: boolean = false;
  public changeRate: Boolean = false;
  public dateCollect: string = this.dateServ.hoyISOFullTime();
  public dateRate: string = this.dateServ.hoyISO();
  public multiCurrency: Boolean = false;
  public mensaje: string = '';
  public currencySelected!: Currencies;
  public showDateRateModal: boolean = false;

  // Variables privadas
  private mapFechas = new Map<string, ConversionType>([]);
  private messageAlert!: MessageAlert;
  private coordenadas: string = "";

  public alertButtons = [
    { text: '', role: 'confirm' },
  ];
  public alertButtonsSend = [
    { text: '', role: 'cancel' },
    { text: '', role: 'confirm' },
  ];

  constructor(private clientSelectorService: ClienteSelectorService) { }

  ngOnInit() {
    this.subscriptions.push(
      this.clientSelectorService.ClientChanged.subscribe(client => {
        this.collectService.client = client;
        this.collectService.initCollect = true;
        this.collectService.newClient = client;
        this.collectService.changeClient = true;
        this.collectService.onChangeClient = true;
        this.collectService.client = this.collectService.newClient;
        this.collectService.newClient = {} as Client;
        this.setClientfromSelector(this.collectService.client);
        this.collectService.cobroValid = false;
        this.reset(client);
      }),

    );

    this.initGeneralState();
  }

  private initGeneralState() {
    this.collectService.recentOpenCollect = false;
    this.messageService.hideLoading();
    this.collectService.alertMessageOpen = false;
    this.initializeCurrenciesAndRates();
    this.alertButtonsSend[0].text = this.collectService.collectionTagsDenario.get('DENARIO_BOTON_CANCELAR')!
    this.alertButtonsSend[1].text = this.collectService.collectionTagsDenario.get('DENARIO_BOTON_ACEPTAR')!
    this.collectService.requiredComment = this.globalConfig.get('requiredComment') === 'true';
    this.collectService.validComment = !this.collectService.requiredComment;

    if (this.collectService.isOpenCollect) {
      this.handleOpenCollect();
    } else if (this.collectService.initCollect) {
      this.handleInitCollect();
    } else {
      this.collectService.cobroValid = true;
    }
  }

  private handleOpenCollect() {
    this.collectService.isOpenCollect = false;
    this.collectService.recentOpenCollect = true;
    //this.collectService.disabledCurrency = true;
    this.collectService.cobroValid = true;

    if (Number(this.collectService.collection.stCollection) > 1) {
      this.adjuntoService.setup(this.synchronizationServices.getDatabase(), this.globalConfig.get("signatureCollection") == "true", true, COLOR_VERDE);
      this.adjuntoService.getSavedPhotos(this.synchronizationServices.getDatabase(), this.collectService.collection.coCollection, 'cobros');
      if (Number(this.collectService.collection.stCollection) === 3)
        this.collectService.onCollectionValid(true);
    }

    this.dateCollect = this.collectService.collection.daCollection;
    this.clientService.getClientById(this.collectService.collection.idClient).then(client => {
      this.collectService.client = client;
      this.selectorCliente.setup(this.collectService.enterpriseSelected.idEnterprise, "Cobros", 'fondoVerde', client, false);

      this.collectService.loadPaymentMethods();
      this.collectService.initLogicService();
      this.loadDataMaster();
      this.collectService.enterpriseEnabled = true;
      this.collectService.disabledClient = true;
      this.collectService.initCollect = false;
      this.collectService.unlockTabs().then((resp) => {
        this.collectService.onCollectionValid(resp);
      });
      this.collectService.changeEnterprise = false;
    });

    this.collectService.validateReferencePayment();
  }

  private handleInitCollect() {
    this.clientSelectorService.checkClient = true;
    this.alertButtons[0].text = this.collectService.collectionTagsDenario.get('DENARIO_BOTON_ACEPTAR')!;
    this.initCollection();
    this.adjuntoService.setup(this.synchronizationServices.getDatabase(), this.globalConfig.get("signatureCollection") == "true", this.viewOnly, COLOR_VERDE);
    this.collectService.loadPaymentMethods();
    this.collectService.initLogicService();
  }

  private initializeCurrenciesAndRates() {
    this.collectService.localCurrency = this.currencyServices.getLocalCurrency();
    this.collectService.hardCurrency = this.currencyServices.getHardCurrency();
  }

  private initializeCollectionData(client: Client) {
    this.collectService.collection = this.collectService.initCollection(this.collectService.collection);
    this.collectService.collection.coCollection = this.dateServ.generateCO(0);
    this.collectService.collection.idEnterprise = this.collectService.enterpriseSelected.idEnterprise;
    this.collectService.collection.coEnterprise = this.collectService.enterpriseSelected.coEnterprise;
    this.collectService.collection.coordenada = this.coordenadas;
    this.collectService.collection.daCollection = this.dateCollect;
    this.collectService.client = client;
    this.collectService.nameClient = client.lbClient;
    this.collectService.collection.idClient = client.idClient;
    this.collectService.collection.coClient = client.coClient;
    this.collectService.collection.lbClient = client.lbClient;
  }

  private updateSelectedEnterprise(idEnterprise: number) {
    const empresa = this.collectService.enterpriseList.find(e => e.idEnterprise === idEnterprise);
    if (empresa) {
      this.collectService.enterpriseSelected = empresa;
    }
  }

  private updateSelectedCurrency(idCurrency: number) {
    const moneda = this.collectService.currencyList.find(c => c.idCurrency === idCurrency);
    if (moneda) {
      this.collectService.currencySelected = moneda;
    }
  }

  private updateSelectedIgtf(price: number) {
    const igtf = this.collectService.igtfList.find(i => i.price == price);
    if (igtf) {
      this.collectService.igtfSelected = igtf;
    }
  }

  async reset(client: Client) {
    this.clientSelectorService.checkClient = true;
    this.collectService.initCollect = false;
    this.alertButtons[0].text = this.collectService.collectionTagsDenario.get('DENARIO_BOTON_ACEPTAR')!;
    await this.collectService.loadPaymentMethods();
    await this.collectService.initLogicService();
    this.collectService.enterpriseList = this.enterpriseServ.empresas;
    this.collectService.getCurrencies(this.synchronizationServices.getDatabase(),
      this.collectService.enterpriseSelected.idEnterprise);
    this.initializeCollectionData(client);
    this.selectorCliente.updateClientList(this.collectService.enterpriseSelected.idEnterprise);

    if (this.collectService.historicoTasa)
      this.collectService.getTasasHistorico(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise)
        .then(() => {

        });
    this.initializeCurrenciesAndRates();
    if (!this.collectService.igtfList?.length)
      this.collectService.getIgtfList(this.synchronizationServices.getDatabase(),);
    this.loadData();
  }

  print() {
    console.log(this.collectService.collection);
  }

  loadDataMaster() {
    this.initializeCurrenciesAndRates();
    this.enterpriseServ.setup(this.synchronizationServices.getDatabase()).then(() => {
      this.collectService.enterpriseList = this.enterpriseServ.empresas;
      this.updateSelectedEnterprise(this.collectService.collection.idEnterprise);
      this.collectService.getCurrencies(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise).then(() => {
        if (this.collectService.historicoTasa) {
          this.collectService.getTasasHistorico(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise)
            .then(() => {
              this.collectService.getDateRate(
                this.synchronizationServices.getDatabase(),
                this.collectService.collection.daRate
              );
            });
        }

        this.collectService.getDocumentsSales(
          this.synchronizationServices.getDatabase(),
          this.collectService.collection.idClient,
          this.collectService.currencySelectedDocument.coCurrency,
          this.collectService.collection.coCollection,
          this.collectService.collection.idEnterprise
        ).then(() => {
          if (this.collectService.historicPartialPayment) {
            this.collectService.findIsPaymentPartial(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient);
          }
        });
        this.updateSelectedCurrency(this.collectService.collection.idCurrency);
        //this.collectService.disabledCurrency = true;
        this.collectService.getIgtfList(this.synchronizationServices.getDatabase(),).then(() => {
          this.updateSelectedIgtf(this.collectService.collection.nuIgtf);
        });
        this.loadData();
      });
    });
  }

  loadPayments() {
    const payments = this.collectService.collection.collectionPayments;
    const bankAccounts = this.collectService.listBankAccounts;
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      switch (payment.coType) {
        case 'ef': {
          const newPagoEfectivo: PagoEfectivo = {
            monto: payment.nuAmountPartial,
            montoConversion: payment.nuAmountPartialConversion,
            nuRecibo: payment.nuPaymentDoc,
            fecha: payment.daValue!,
            posCollectionPayment: i,
            type: "ef",
            anticipoPrepaid: payment.isAnticipoPrepaid,
            disabled: false,
          };
          this.collectService.pagoEfectivo.push(newPagoEfectivo);
          break;
        }
        case 'tr': {
          const newPagoTransferencia: PagoTransferencia = {
            idBanco: payment.idBank,
            nombreBanco: payment.naBank,
            numeroTransferencia: payment.nuPaymentDoc,
            numeroCuenta: payment.nuClientBankAccount,
            monto: payment.nuAmountPartial,
            montoConversion: payment.nuAmountPartialConversion,
            fecha: payment.daValue!,
            nuevaCuenta: payment.newNuClientBankAccount,
            posCollectionPayment: i,
            type: "tr",
            anticipoPrepaid: payment.isAnticipoPrepaid,
            disabled: false,
            bancoReceptor: this.getBancoReceptor(payment.nuClientBankAccount),
            showDateModal: false,
          };
          const cuenta = bankAccounts.find(b => b.idBank == newPagoTransferencia.idBanco);
          if (cuenta) {
            this.collectService.bankAccountSelected[newPagoTransferencia.posCollectionPayment] = cuenta;
            newPagoTransferencia.disabled = false;
          }
          this.collectService.pagoTransferencia.push(newPagoTransferencia);
          break;
        }
        case 'de': {
          const newPagoDeposito: PagoDeposito = {
            idBanco: payment.idBank,
            nombreBanco: payment.naBank,
            numeroCuenta: payment.nuClientBankAccount,
            numeroDeposito: payment.nuPaymentDoc,
            fecha: payment.daValue!,
            monto: payment.nuAmountPartial,
            montoConversion: payment.nuAmountPartialConversion,
            posCollectionPayment: i,
            type: "de",
            anticipoPrepaid: payment.isAnticipoPrepaid,
            disabled: false,
            showDateModal: false,
          };
          const cuenta = bankAccounts.find(b => b.idBank == newPagoDeposito.idBanco);
          if (cuenta) {
            this.collectService.bankAccountSelected[newPagoDeposito.posCollectionPayment] = cuenta;
            newPagoDeposito.disabled = false;
          }
          this.collectService.pagoDeposito.push(newPagoDeposito);
          break;
        }
        case 'ch': {
          const newPagoCheque: PagoCheque = {
            idBank: payment.idBank,
            nombreBanco: payment.naBank,
            fecha: payment.daValue!,
            monto: payment.nuAmountPartial,
            montoConversion: payment.nuAmountPartialConversion,
            fechaValor: payment.daCollectionPayment!,
            numeroCheque: payment.nuPaymentDoc,
            nuevaCuenta: payment.newNuClientBankAccount,
            posCollectionPayment: i,
            type: "ch",
            anticipoPrepaid: payment.isAnticipoPrepaid,
            disabled: false,
            bancoReceptor: new BancoReceptor(),
            showDateVenceModal: false,
            showDateValorModal: false,
          };
          this.collectService.pagoCheque.push(newPagoCheque);
          break;
        }
        case 'ot': {
          const newPagoOtros: PagoOtros = {
            nombre: payment.nuPaymentDoc,
            monto: payment.nuAmountPartial,
            montoConversion: payment.nuAmountPartialConversion,
            posCollectionPayment: i,
            type: "ot",
            anticipoPrepaid: payment.isAnticipoPrepaid,
            disabled: false,
          };
          this.collectService.pagoOtros.push(newPagoOtros);
          break;
        }
      }
    }
    this.collectService.calcularMontos("", 0);
    this.collectService.checkTiposPago();
    this.collectService.validateToSend();
  }

  initCollection() {

    this.collectService.initCollect = false;
    this.collectService.fechaMenor = this.dateServ.hoyISO();
    //this.collectService.fechaMayor = this.dateServ.hoyISO();
    this.collectService.client = {} as Client;
    this.collectService.cobroValid = false;

    this.messageService.showLoading().then(() => {
      this.geoServ.getCurrentPosition().then(coords => {
        if (this.collectService.userMustActivateGPS) {
          //prevenimos que sobreescriba coordenadas con string vacio
          if (coords.length > 0) {
            this.collectService.collection.coordenada = coords
          }
        } else {
          this.collectService.collection.coordenada = coords
        }


      });
      this.enterpriseServ.setup(this.synchronizationServices.getDatabase()).then(() => {

        this.collectService.enterpriseList = this.enterpriseServ.empresas;
        this.messageService.hideLoading();

        //ESTO ES PARA CUANDO CAMBIE DE PESTANAS, RECUPERAR LA INFORMACION YA COLOCADA
        if (this.collectService.newCollect) {
          //ESTOY REALIZANDO UN COBRO DESDE 0
          this.collectService.collection = this.collectService.initCollection(this.collectService.collection);

          if (this.collectService.changeEnterprise) {
            this.collectService.changeEnterprise = false;
          } else {
            this.collectService.enterpriseSelected = this.collectService.enterpriseList[0];
          }
          this.collectService.getCurrencies(this.synchronizationServices.getDatabase(), this.collectService.enterpriseSelected.idEnterprise);


          let nameModule = "Cobros"
          switch (this.collectService.coTypeModule) {
            case "0": {
              console.log("NUEVO COBRO");
              nameModule = "Cobros"
              break
            }
            case "1": {
              console.log("ANTICIPO")
              nameModule = "Anticipo"
              break
            }
            case "2": {
              console.log("RETENCION");
              nameModule = "Retención"

              break
            }
            case "3": {
              console.log("IGTF")
              nameModule = "Igtf"
              break;
            }
          }
          this.selectorCliente.setup(this.collectService.enterpriseSelected.idEnterprise, nameModule, 'fondoVerde', null, true);
          this.selectorCliente.updateClientList(this.collectService.enterpriseSelected.idEnterprise);

          this.collectService.collection.coCollection = this.dateServ.generateCO(0);
          this.collectService.collection.idEnterprise = this.collectService.enterpriseSelected.idEnterprise;
          this.collectService.collection.coEnterprise = this.collectService.enterpriseList[0].coEnterprise;
          this.collectService.collection.coordenada = this.coordenadas;

          if (this.collectService.historicoTasa)
            this.collectService.getTasasHistorico(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise)
              .then(() => {

              });
          else
            this.collectService.getDocumentsSales(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient, this.collectService.currencySelectedDocument.coCurrency,
              this.collectService.collection.coCollection, this.collectService.collection.idEnterprise).then(() => {
                if (this.collectService.historicPartialPayment) {
                  this.collectService.findIsPaymentPartial(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient);
                }
              });
          // }

          if (this.collectService.igtfList == null || this.collectService.igtfList.length == 0)
            this.collectService.getIgtfList(this.synchronizationServices.getDatabase(),);



        }

        this.collectService.getCurrencies(this.synchronizationServices.getDatabase(), this.collectService.enterpriseSelected.idEnterprise);
        if (this.collectService.changeClient) {
          this.collectService.alertMessageOpen = false;
          this.collectService.alertMessageChangeCurrency = false;

          this.collectService.client = this.collectService.newClient;
          this.collectService.newClient = {} as Client;
          this.setClientfromSelector(this.collectService.client);
        }

      });
    }).catch(e => {
      console.log(e);
      this.messageService.hideLoading();
    })
  }


  setChangesMade(value: boolean) {
    //ESTA FUNCION SE USARA PARA CONTROLAR SI PUEDO ENVIAR O GUARDAR, CVER QUE HAGO ACA
    this.collectService.onCollectionValidToSave(true);
    this.collectService.onCollectionValidToSend(true);
  }



  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onEnterpriseSelect() {

    //AL CAMBIAR DE EMPRESA RESETEO TODO
    this.collectService.initCollect = true;

    this.messageService.showLoading().then(() => {
      this.selectorCliente.updateClientList(this.collectService.enterpriseSelected.idEnterprise);
      //this.collectService.resetCollection(this.collectService.collection).then(resp => {
      //this.collectService.collection.idEnterprise = this.collectService.enterpriseSelected.idEnterprise;
      //this.collectService.collection.coEnterprise = this.collectService.enterpriseSelected.coEnterprise;
      this.ngOnInit();
      this.collectService.client = {} as Client;
      this.collectService.nameClient = "";
      //luego de seleccionar empresa, buscamos las tasas    
      if (this.collectService.historicoTasa)
        this.collectService.getTasasHistorico(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise)
          .then(() => {
            this.collectService.getDateRate(
              this.synchronizationServices.getDatabase(),
              this.collectService.collection.daRate
            );
          });

      if (this.globalConfig.get("requiredComment") === 'false' ? true : false) {
        /* this.collectService.onCollectionValid(true); */
        this.collectService.unlockTabs().then((resp) => {
          this.collectService.onCollectionValid(resp);
        })
      }
      /*   } else {
          this.collectService.cobroValid = false;
          this.collectService.unlockTabs().then((resp) => {
            this.collectService.onCollectionValid(resp);
          })
        } */
      //})

      /* this.collectService.changeEnterprise = false; */
    })


  }

  loadData() {
    //SE BUSCA LA MONEDA 
    this.collectService.getCurrencies(this.synchronizationServices.getDatabase(), this.collectService.enterpriseSelected.idEnterprise).then(r => {

      if (this.collectService.collection.stCollection === 3) {
        this.collectService.rateSelected = this.collectService.collection.nuValueLocal;
        this.collectService.historicoTasa = true;
      } else if (this.collectService.historicoTasa) {
        this.collectService.getTasasHistorico(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise)
          .then(() => {
            this.collectService.getDateRate(
              this.synchronizationServices.getDatabase(),
              this.collectService.dateRateVisual.split("T")[0]
            );
          });
      }


      //BUSCAMOS LAS CUENTAS DE BANCOS DEL CLIENTE
      this.collectService.getAllClientBankAccountByEnterprise(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise, this.collectService.collection.coClient).then((result: any[]) => {
        this.collectService.clientBankAccounts = result;

        //BUSCAMOS LOS CUENTAS BANCOS DE LA EMPRESA
        this.collectService.bankAccountSelected = [] as BankAccount[];
        this.collectService.getAllBankAccountsByEnterprise(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise, this.collectService.collection.coCurrency).then(result => {
          this.collectService.listBankAccounts = result;
          this.loadPayments();

          this.collectService.getAllBanks(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise);

          this.collectService.unlockTabs().then((resp) => {
            this.collectService.onCollectionValid(resp);
            if (this.collectService.onChangeClient)
              this.collectService.onChangeClient = false;

            if (this.collectService.collection.stCollection >= 2) {
              this.collectService.disabledInputClient = true;
              this.collectService.enterpriseEnabled = false;
              //this.collectService.collection.nuValueLocal = 80;
            }

            this.collectService.getDocumentsSales(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient,
              this.collectService.currencySelectedDocument.coCurrency, this.collectService.collection.coCollection, this.collectService.collection.idEnterprise).then(() => {
                if (this.collectService.historicPartialPayment) {
                  this.collectService.findIsPaymentPartial(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient);
                }
              });
          })

          if (this.collectService.requiredComment) {
            if (this.collectService.collection.txComment && this.collectService.collection.txComment.trim().length > 0) {
              this.collectService.validComment = true;
            } else {
              this.collectService.validComment = false;
              this.setFocus()
            }
          }
        })

      })

    })
  }

  setClientfromSelector(client: Client) {
    if (client != undefined) {
      //SI ES LA PRIMERA VEZ
      if (this.collectService.collection.idClient == 0 && client.idClient != this.collectService.collection.idClient) {
        this.clientSelectorService.checkClient = true;
        this.collectService.client = client;
        this.collectService.cobroValid = true;
        this.collectService.nameClient = client.lbClient;
        this.collectService.collection.idClient = client.idClient;
        this.collectService.collection.coClient = client.coClient;
        this.collectService.collection.lbClient = client.lbClient;
        this.collectService.collection.idEnterprise = this.collectService.enterpriseSelected.idEnterprise;
        this.collectService.collection.coEnterprise = this.collectService.enterpriseSelected.coEnterprise;
        this.collectService.collection.daCollection = this.dateCollect;
        //this.collectService.currencySelected = client.coCurrency;

        this.loadData();
      } else {
        //SE CAMBIO CLIENTE

      }
    } else {
      console.log("client vacio");
      this.collectService.nameClient = "";
    }
  }

  getCurrency() {
    if (this.globalConfig.get('multiCurrency') === 'true')
      if (this.collectService.client.multimoneda == ("true")) {
        //el client tiene varias monedas
      } else {

      }
  }

  setChangeCurrency(event: any) {
    this.collectService.alertMessageChangeCurrency = false;
    if (event.detail.role === 'confirm') {
      console.log("CAMBIAR MONEDA");
      this.onChangeCurrency(this.currencySelected);
    }

  }


  onChangeDateRate(event: any) {
    /* if (this.collectService.collection.collectionDetails.length > 0 || this.collectService.collection.collectionPayments.length > 0) {
      this.collectService.mensaje = "¿Seguro desea cambiar la fecha de la tasa? El cobro sera reiniciado!"
      this.collectService.alertMessageChangeDateRate = true
    } else {
      
      //this.collectService.collection.daRate = event.target.value;
      this.onChangeCurrency(this.collectService.currencySelected);
    } */
    this.collectService.getDocumentsSales(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient,
      this.collectService.currencySelectedDocument.coCurrency, this.collectService.collection.coCollection, this.collectService.collection.idEnterprise).then(() => {
        this.collectService.getDateRate(this.synchronizationServices.getDatabase(), this.collectService.dateRateVisual);
        if (this.collectService.historicPartialPayment) {
          this.collectService.findIsPaymentPartial(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient);
        }

        this.collectService.setCurrencyConversion();
        this.collectService.calculatePayment("", 0);

      });






  }

  setChangeDateRate(event: any) {
    this.collectService.alertMessageChangeDateRate = false;
    if (event.detail.role === 'confirm') {
      console.log("CAMBIAR DATERATE");
      this.onChangeCurrency(this.collectService.currencySelected);
    }
  }


  onChangeCurrencyMsj(event: any) {
    if (this.collectService.collection.collectionDetails.length > 0 || this.collectService.collection.collectionPayments.length > 0) {
      this.currencySelected = event.target.value;
      switch (this.collectService.collection.coType) {
        case "0": {
          this.collectService.mensaje = this.collectService.collectionTags.get('COB_COB_CHANGE_CURRENCY')!;
          break;
        }
        case "1": {
          this.collectService.mensaje = this.collectService.collectionTags.get('COB_ANT_CHANGE_CURRENCY')!;
          break;
        }
        case "2": {
          this.collectService.mensaje = this.collectService.collectionTags.get('COB_RET_CHANGE_CURRENCY')!;
          break;
        }
        case "3": {
          this.collectService.mensaje = this.collectService.collectionTags.get('COB_IGTF_CHANGE_CURRENCY')!;
          break;
        }
        default: {
          this.collectService.mensaje = this.collectService.collectionTags.get('COB_COB_CHANGE_CURRENCY')!;
          break;
        }
      }

      this.collectService.alertMessageChangeCurrency = true
    } else {
      this.currencySelected = event.target.value
      this.collectService.collection.coCurrency = this.currencySelected.coCurrency;
      this.collectService.collection.idCurrency = this.currencySelected.idCurrency;

      if (this.currencySelected.localCurrency.toString() == 'true') {
        this.collectService.currencyLocal = true;
        this.collectService.currencyHard = false;
      }


      if (this.currencySelected.hardCurrency.toString() == 'true') {
        this.collectService.currencyHard = true;
        this.collectService.currencyLocal = false;
      }


      //this.collectService.currencySelectedDocument = event.target.value;
      this.collectService.setCurrencyConversion();
      this.collectService.getAllBankAccountsByEnterprise(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise, this.collectService.collection.coCurrency).then(result => {
        this.collectService.listBankAccounts = result;
        this.collectService.documentCurrency = event.target.value.coCurrency;

        this.collectService.getDocumentsSales(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient, this.collectService.currencySelectedDocument.coCurrency,
          this.collectService.collection.coCollection, this.collectService.collection.idEnterprise).then(response => {


            if (this.collectService.historicPartialPayment) {
              this.collectService.findIsPaymentPartial(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient);
            }

            if (this.collectService.documentSales.length > 0)
              this.collectService.documentsSaleComponent = true;
            else
              this.collectService.documentsSaleComponent = false;

            this.loadPayments();
          })

      })
    }

  }


  onChangeCurrency(currency: Currencies) {

    if (this.collectService.collection.collectionDetails.length > 0) {
      //DEBO ELIMINAR 
      this.collectService.collection.collectionDetails = [] as CollectionDetail[];
    }
    if (this.collectService.collection.collectionPayments.length > 0) {
      this.collectService.collection.collectionPayments = [] as CollectionPayment[];
    }

    this.collectService.documentSales = [] as DocumentSale[];
    this.collectService.documentSalesBackup = [] as DocumentSale[];
    this.collectService.documentSaleOpen = {} as DocumentSale;
    this.collectService.mapDocumentsSales.clear()
    this.collectService.documentSaleOpen = {} as DocumentSale;

    if (this.collectService.collection.coType != "1")
      this.collectService.disabledSelectCollectMethodDisabled = true;

    this.collectService.currencySelected = currency;
    this.collectService.currencySelectedDocument = currency;

    this.collectService.collection.idCurrency = currency.idCurrency;
    this.collectService.collection.coCurrency = currency.coCurrency;
    this.collectService.setCurrencyDocument();
    this.collectService.getDocumentsSales(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient,
      this.collectService.currencySelectedDocument.coCurrency, this.collectService.collection.coCollection, this.collectService.collection.idEnterprise).then(() => {
        this.collectService.getDateRate(this.synchronizationServices.getDatabase(), this.collectService.dateRateVisual);
        if (this.collectService.historicPartialPayment) {
          this.collectService.findIsPaymentPartial(this.synchronizationServices.getDatabase(), this.collectService.collection.idClient);
        }


      });

    this.collectService.loadPaymentMethods();

    this.collectService.collection.nuAmountFinal = 0;
    this.collectService.collection.nuAmountFinalConversion = 0;
    this.collectService.collection.nuAmountTotal = 0;
    this.collectService.collection.nuAmountTotalConversion = 0;
    this.collectService.collection.nuDifference = 0;
    this.collectService.collection.nuDifferenceConversion = 0;

    this.collectService.setCurrencyConversion();
    this.collectService.calculatePayment("", 0);


    this.collectService.getAllBankAccountsByEnterprise(this.synchronizationServices.getDatabase(), this.collectService.collection.idEnterprise, this.collectService.collection.coCurrency).then(result => {
      this.collectService.listBankAccounts = result;
      this.loadPayments();

    })
  }

  isWeekday = (dateString: string) => {
    const date = new Date(dateString);
    const utcDay = date.getUTCDay();

    /**
     * Date will be enabled if it is not
     * Sunday or Saturday
     */
    return utcDay /* !== 0 && utcDay !== 6 */;
  };

  // Ejemplo: cobro-general.component.ts
  // Reemplaza/adapta tu onChangeRate para normalizar la fecha como "date-only" local.

  onChangeRate(ev: any) {
    // ev puede venir como evento (ev.detail.value) o directamente como el objeto seleccionado.
    const selected = ev?.detail?.value ?? ev;
    if (!selected) return;

    // EJEMPLO: supondremos que el objeto 'rate' tiene una propiedad con la fecha,
    // ajusta 'dateField' al nombre real (p.e. rate.dateRate, rate.nuDate, rate.dtRate, etc.)
    const dateFieldCandidates = ['date', 'dateRate', 'dtRate', 'nuDate', 'rateDate'];
    let raw = null;
    for (const f of dateFieldCandidates) {
      if (selected[f] != null) { raw = selected[f]; break; }
    }
    // si no encontrás en candidate fields, podrías usar selected directamente si es string/Date:
    if (!raw) raw = selected;

    let finalDate: Date | null = null;

    if (typeof raw === 'string') {
      // Si la cadena tiene formato YYYY-MM-DD o YYYY-MM-DDTHH:mm..., extraemos la parte de fecha
      const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
        finalDate = new Date(y, mo, d); // crea fecha en zona local, sin desplazamiento
      } else {
        // Fallback: si no es YYYY-MM-DD, intentar Date y luego forzar date-only
        const tmp = new Date(raw);
        if (!isNaN(tmp.getTime())) {
          finalDate = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate());
        }
      }
    } else if (raw instanceof Date) {
      finalDate = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
    } else if (typeof raw === 'number') {
      // timestamp (ms)
      const tmp = new Date(raw);
      finalDate = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate());
    }

    if (finalDate) {
      // Asignar a la variable que usa la vista / formato (ajusta nombres según tu componente)
      // Convertir Date a string ISO antes de asignar (las propiedades esperan string)
      this.dateCollect = finalDate.toISOString();
      // Si usás el servicio:
      this.collectService.dateRateVisual = finalDate.toISOString();
      // Actualizar cualquier campo derivado (por ejemplo, obtener la tasa de esa fecha)
      // this.collectService.getDateRate(..., finalDate) <-- si tu servicio espera fecha
    } else {
      console.warn('onChangeRate: no pude parsear la fecha del rate seleccionado', selected, raw);
    }

    // Mantener la lógica que necesites luego de cambiar la tasa...
  }

  onOpenCalendar() {
    if (this.collectService.collection.stCollection != 2 && this.collectService.collection.stCollection != 3) {
      this.collectService.getDateRate(this.synchronizationServices.getDatabase(), this.collectService.dateRateVisual.split("T")[0]);
      this.collectService.calculatePayment("", 0);
    }
  }

  onChangeTxConversion(event: any) {
    if (event.target.value.trim() != "") {
      this.collectService.collection.txConversion = this.collectService.cleanString(event.target.value.trim());
      this.collectService.unlockTabs().then((resp) => {
        this.collectService.onCollectionValid(resp);
      })
    } else {
      this.collectService.collection.txConversion = event.target.value.trim();
      this.messageAlert = new MessageAlert(
        this.collectService.collectionTags.get('COB_HEADER_MESSAGE')!,
        this.collectService.collectionTags.get('COB_EMPTY_TXCONVERSION')!,
      );
      this.messageService.alertModal(this.messageAlert);
    }
  }

  setResponsible() {
    this.collectService.collection.naResponsible = this.collectService.cleanString(this.collectService.collection.naResponsible.trim());
  }

  setComment() {
    if (this.collectService.changeClient)
      this.collectService.changeClient = false;
    else if (this.collectService.collection.txComment.trim() == "") {
      this.collectService.validComment = false;
      this.mensaje = this.collectService.collectionTags.get('COB_EMPTY_TXCOMMENT')!,
        this.collectService.alertMessageOpen = true;
    } else
      this.collectService.validComment = true;

    this.collectService.collection.txComment = this.collectService.cleanString(this.collectService.collection.txComment.trim());

    this.collectService.unlockTabs().then((resp) => {
      this.collectService.onCollectionValid(resp);
    })
  }

  setResult(ev: any) {
    console.log('Apretó:' + ev.detail.role);
    this.collectService.alertMessageOpen = false;
    this.collectService.mensaje = '';

  }
  setResultEnterprise(ev: any) {

    console.log('Apretó:' + ev.detail.role);
    if (ev.detail.role === 'confirm') {
      this.collectService.alertMessageChangeEnterprise = false;
      this.collectService.cobroValid = false;
      this.collectService.changeClient = false;
      this.collectService.newCollect = true;
      this.onEnterpriseSelect();
    } else {
      const empresa = this.collectService.enterpriseList.find(e => e.idEnterprise == this.collectService.collection.idEnterprise);
      if (empresa) {
        this.collectService.enterpriseSelected = empresa;
      }

      this.collectService.alertMessageChangeEnterprise = false;
    }
  }

  setFocus() {
    if (this.input == undefined) {
      setTimeout(() => {
        this.setFocus();
      }, 500);
    } else
      this.input.setFocus();
  }

  tagFecha() {
    if (this.collectService.isAnticipo) {
      return this.collectService.collectionTags.get('COB_FECHA_ANTICIPO');
    }
    if (this.collectService.isRetention) {
      return this.collectService.collectionTags.get('COB_FECHA_RETENCION');
    }
    return this.collectService.collectionTags.get('COB_FECHA_COBRO');
  }

  onChangeEnterprise() {
    console.log("asd");
    this.collectService.alertMessageChangeEnterprise = true;
    this.collectService.changeEnterprise = true;
    this.collectService.mensaje = "Se ha detectado cambio de Empresa por lo que debera iniciar nuevamente la transacción.";
  }

  setShowDateRateModal(show: boolean) {
    this.showDateRateModal = show;
    if (!show) return;

    const raw = this.collectService?.collection?.daRate ?? this.collectService?.dateRateVisual;
    if (raw) {
      const s = raw.toString();
      const m = s.match(/^(\d{4}-\d{2}-\d{2})/); // extrae YYYY-MM-DD si está al inicio
      if (m) {
        this.collectService.dateRateVisual = m[1]; // "2025-10-24"
      } else {
        // fallback seguro: crea Date y toma YYYY-MM-DD (solo si no había formato reconocible)
        const d = new Date(s.replace(' ', 'T'));
        d.setHours(0, 0, 0, 0);
        this.collectService.dateRateVisual = d.toISOString().substring(0, 10);
      }
    } else {
      this.collectService.dateRateVisual = this.dateServ.onlyDateHoyISO();
    }
  }

  bottonDateRateLabel() {
    if (this.collectService.collection.stCollection == 2 || this.collectService.collection.stCollection == 3) {
      // normalizar a formato con espacio en vez de 'T'
      if (this.collectService.collection.daRate) {
        this.collectService.dateRateVisual = this.collectService.collection.daRate.replace('T', ' ');
      }
      return this.dateServ.formatShort(this.collectService.dateRateVisual);
    } else if (this.collectService.collection.stCollection == 1) {
      if (this.collectService.collection.daRate) {
        this.collectService.dateRateVisual = this.collectService.collection.daRate.replace('T', ' ');
      }
      return this.dateServ.formatShort(this.collectService.dateRateVisual);
    } else if (this.collectService.collection.stCollection == 6) {
      const raw = this.collectService.collection.daCollection || '';
      this.collectService.dateRate = raw.substring(0, 19).replace('T', ' ');
      this.collectService.dateRateVisual = raw.replace('T', ' ');
      return this.dateServ.formatShort(this.collectService.dateRateVisual);
    } else {
      // si dateRateVisual contiene 'T' lo reemplazamos por espacio
      if (this.collectService.dateRateVisual && this.collectService.dateRateVisual.indexOf('T') !== -1) {
        this.collectService.dateRateVisual = this.collectService.dateRateVisual.replace('T', ' ');
      }
      this.collectService.dateRate = (this.collectService.dateRate || '').split("T")[0];
      return this.dateServ.formatShort(this.collectService.dateRateVisual);
    }
  }


  printAllTransactionStatuses() {
    this.collectService.printAllTransactionStatuses(this.synchronizationServices.getDatabase())
  }

  getBancoReceptor(nuClientBankAccount: string): BancoReceptor {
    const bancoReceptor = this.collectService.listBankAccounts.find(b => b.nuAccount == nuClientBankAccount);
    if (bancoReceptor) {
      return {
        coAccount: bancoReceptor.coAccount,
        coBank: bancoReceptor.coBank,
        coCurrency: bancoReceptor.coCurrency,
        coEnterprise: bancoReceptor.coEnterprise,
        coType: bancoReceptor.coType,
        idBank: bancoReceptor.idBank,
        idBankAccount: bancoReceptor.idBankAccount,
        idCurrency: bancoReceptor.idCurrency,
        idEnterprise: bancoReceptor.idEnterprise,
        nameBank: bancoReceptor.nameBank,
        nuAccount: bancoReceptor.nuAccount,
      }
    } else {
      return new BancoReceptor();
    }
  }
}