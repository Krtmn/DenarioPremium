import { Injectable, OnInit, inject } from '@angular/core';
import { Observable, Subject, map, finalize, concatMap, timer } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';


import { PendingTransaction } from 'src/app/modelos/tables/pendingTransactions';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { VisitasService } from 'src/app/visitas/visitas.service';
import { ServicesService } from '../services.service';
import { MessageService } from '../messageService/message.service';
import { Response } from 'src/app/modelos/response';
import { Visit } from 'src/app/modelos/tables/visit';
import { DELIVERY_STATUS_SENT, DELIVERY_STATUS_TO_SEND, VISIT_STATUS_TO_SEND, VISIT_STATUS_VISITED, CLIENT_POTENTIAL_STATUS_SENT } from 'src/app/utils/appConstants'
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { UserAddresClients } from 'src/app/modelos/tables/userAddresClients';
import { ClientLocationService } from '../clientes/locationClient/client-location.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { Return } from 'src/app/modelos/tables/return';
import { ReturnDatabaseService } from '../returns/return-database.service';
import { InventariosLogicService } from '../inventarios/inventarios-logic.service';
import { ClientStocks, ClientStocksDetailUnits } from 'src/app/modelos/tables/client-stocks';
import { PotentialClientDatabaseServicesService } from '../clientes/potentialClient/potential-client-database-services.service';
//import { PedidosService } from 'src/app/pedidos/pedidos.service';
import { Orders } from 'src/app/modelos/tables/orders';
import { OrderDetail } from 'src/app/modelos/tables/orderDetail';
import { OrderDetailUnit } from 'src/app/modelos/tables/orderDetailUnit';
import { OrderDetailDiscount } from 'src/app/modelos/orderDetailDiscount';
import { CollectionService } from '../collection/collection-logic.service';
import { Collection } from 'src/app/modelos/tables/collection';
import { Deposit } from 'src/app/modelos/tables/deposit';
import { DepositService } from '../deposit/deposit.service';
import { PedidosService } from 'src/app/pedidos/pedidos.service';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';
import { Request } from 'src/app/modelos/request';
import { PotentialClient } from 'src/app/modelos/tables/potentialClient';

@Injectable({
  providedIn: 'root'
})
export class AutoSendService implements OnInit {

  public obsQueue = new Subject<Observable<any>>();
  public obsQueueCount = 1;
  public funcObsQueue = new Subject<() => Observable<any>>();
  public funcObsQueueCount = 1;
  public pendingTransaction!: PendingTransaction[];
  public messageAlert!: MessageAlert;
  private potentialClientServices = inject(PotentialClientDatabaseServicesService)
  private locationServices = inject(ClientLocationService)
  private inventariosLogicService = inject(InventariosLogicService)
  private collectionService = inject(CollectionService);
  private depositService = inject(DepositService);
  private visitService = inject(VisitasService);
  private orderService = inject(PedidosService);

  public rolTransportista = false;

  constructor(
    private dbService: SynchronizationDBService,

    private services: ServicesService,
    private http: HttpClient,
    private messageService: MessageService,
    private router: Router,
    private adjuntoService: AdjuntoService,
    private returnDatabaseService: ReturnDatabaseService

  ) {
    //this.process();

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

    this.getPendingTransaction().then((result) => {
      this.pendingTransaction = result;
      if (this.pendingTransaction.length > 0) {
        this.funcObsQueueCount = this.pendingTransaction.length;
        /* this.process(this.pendingTransaction) */
        this.initTransaction(this.pendingTransaction);
      }
    })
  }

  ngOnInit(): void {
    this.getPendingTransaction().then((result) => {
      this.pendingTransaction = result;
      if (this.pendingTransaction.length > 0) {
        this.funcObsQueueCount = this.pendingTransaction.length;
        /* this.process(this.pendingTransaction) */
        this.initTransaction(this.pendingTransaction);
      }
    })
  }

  public addFuncObs() {
    const currentCount = this.funcObsQueueCount;
    console.log('[QUEUING]', currentCount)
    /* const subject = timer(1000).pipe(map(x => currentCount)); */
    const subject = timer(1000).pipe(map(x => currentCount));
    this.funcObsQueue.next(() => {
      console.log('executing func')
      return subject;
    });
    this.funcObsQueueCount++;
  }

  private getPendingTransaction() {
    let pendingTransaction: PendingTransaction[] = [];
    return this.dbService.getDatabase().executeSql(
      'SELECT * FROM pending_transactions', [
    ]).then(res => {
      for (var i = 0; i < res.rows.length; i++) {
        pendingTransaction.push({
          coTransaction: res.rows.item(i).co_transaction,
          idTransaction: res.rows.item(i).id_transaction,
          type: res.rows.item(i).type
        })
      }
      return pendingTransaction;
    }).catch(e => {
      console.log(e);
      return pendingTransaction;
    })
  }

  private process(transaction: PendingTransaction[]) {
    console.log('PROCESSING QUEUE...')
    this.funcObsQueue
      .pipe(
        finalize(() => console.log('stopped processing queue')),
        concatMap(x => x()))
      .subscribe(x => {
        console.log('[PROCESSED]', x)
      });
  }

  initTransaction(pendingTransactions: PendingTransaction[]) {
    if (pendingTransactions.length > 0) {
      for (var i = 0; i < pendingTransactions.length; i++) {
        this.setTransaction(pendingTransactions[i].type, pendingTransactions[i].coTransaction);
      }
    }
  }

  setTransaction(type: string, coTransaction: string) {
    switch (type) {
      case 'collect': {

        let request: Request = {
          collection: {} as Collection,
          document: {} as DocumentSale,
        };

        this.collectionService.getCollection(this.dbService.getDatabase(), coTransaction).then((collect) => {

          request.collection = collect!;
          request.collection.idUser = Number(localStorage.getItem("idUser"));
          request.collection.coUser = localStorage.getItem("coUser")!;
          /* request.collection.idCollection = null; */
          if ((collect.hasIGTF != null ? collect.hasIGTF.toString() : "false") == "true") {
            request.document = request.collection.document!;
            if (Object.keys(request.document).length <= 0)
              delete request.document;
          }
          else
            delete request.document;

          const coType = Number(request.collection.coType);
          const promesa = new Promise<string>(async (resolve, reject) => {
            if (coType === 1) {
              this.collectionService.getCollectionPayments(this.dbService.getDatabase(), coTransaction).then((collectionPayments) => {
                request.collection!.collectionPayments = collectionPayments;
                request.collection!.collectionDetails = [];
                resolve("ok");
              })

            } else if (coType === 2) {
              this.collectionService.getCollectionDetails(this.dbService.getDatabase(), coTransaction).then((collectionDetails) => {
                request.collection!.collectionDetails = collectionDetails;
                request.collection!.collectionPayments = [];
                resolve("ok");
              })
            } else {
              this.collectionService.getCollectionDetails(this.dbService.getDatabase(), coTransaction).then((collectionDetails) => {
                request.collection!.collectionDetails = collectionDetails;
                this.collectionService.getCollectionPayments(this.dbService.getDatabase(), coTransaction).then((collectionPayments) => {
                  request.collection!.collectionPayments = collectionPayments;
                  resolve("ok");
                })
              })
            }

          })
          promesa.then((res) => {
            // --- Recomendado: normalizar coType como number ---
            const coType = Number(request.collection?.coType);

            // Asegurar arrays no nulos
            const payments = request.collection?.collectionPayments ?? [];
            const details = request.collection?.collectionDetails ?? [];

            // Por defecto permitimos enviar, salvo que una de las reglas impida el envío
            let send = true;

            switch (coType) {
              // coType 0, 3, 4 => ambos arrays NO deben estar vacíos
              case 0:
              case 3:
              case 4:
                if (payments.length === 0 || details.length === 0) {
                  send = false;
                }
                break;

              // coType 1 => collectionPayments NO debe estar vacío
              case 1:
                if (payments.length === 0) {
                  send = false;
                }
                break;

              // coType 2 => collectionDetails NO debe estar vacío
              case 2:
                if (details.length === 0) {
                  send = false;
                }
                break;

              default:
                // Si aparece un coType desconocido, prevenir el envío por seguridad
                send = false;
                console.warn(`AutoSendService: coType desconocido (${coType}). Se cancela el envío por seguridad.`);
                break;
            }

            if (send) {
              this.sendTransaction(request, type, coTransaction);
            }
          });
        })
        break;
      }
      case 'potentialClient': {
        let request: Request = {
          potentialClient: {}
        }
        this.potentialClientServices.getPotentialClientById(coTransaction).then((pc) => {
          request.potentialClient = {
            "coClient": pc[0].coClient,
            "naClient": pc[0].naClient,
            "nuRif": pc[0].nuRif,
            "naResponsible": pc[0].naResponsible,
            "emClient": pc[0].emClient,
            "nuPhone": pc[0].nuPhone,
            "coUser": pc[0].coUser,
            "idUser": pc[0].idUser,
            "txAddress": pc[0].txAddress,
            "txAddressDispatch": pc[0].txAddressDispatch,
            "txClient": pc[0].txClient,
            "naWebSite": pc[0].naWebSite,
            "daClient": pc[0].daPotentialClient,
            "coEnterprise": pc[0].coEnterprise,
            "idEnterprise": pc[0].idEnterprise,
            "coordenada": pc[0].coordenada,
            "nuAttachments": pc[0].nuAttachments,
            "hasAttachments": (String)(pc[0].hasAttachments).toLowerCase() === 'true' ? true : false,
          };
          this.sendTransaction(request, type, pc[0].coClient);
        })
        break;
      }
      case 'visit': {
        let request: Request = {
          visit: {} as Visit,
        }
        this.visitService.getVisit(coTransaction).then(v => {

          request.visit = v;

          if (this.rolTransportista) {
            if (v.visitDetails && Array.isArray(v.visitDetails)) {
              for (let i = 0; i < v.visitDetails.length; i++) {
                if (request.visit.visitDetails[i].coCause === 0) {
                  request.visit.visitDetails[i].coCause = null;
                }
              }
            }
          }
          request.visit.coordenadaSaved = false; //esto siempre es falso
          if (v.stVisit == VISIT_STATUS_TO_SEND) {
            //si es la primera vez que se manda,
            //poner id en null para que se le asigne el id correcto en backend
            request.visit.idVisit = null;
          }

          this.sendTransaction(request, type, v.coVisit);
        })
        break;
      }
      case 'order': {
        let request: Request = {
          order: {} as Orders,
          //orderDetails: [] as OrderDetail[],
          //orderDetailUnits: [] as OrderDetailUnit[],
          //orderDetailDiscounts: [] as OrderDetailDiscount[],
        }
        this.orderService.getPedido(coTransaction).then(o => {
          if (o != null) {
            request = {
              order: o
            };
          }
          //request = o;
          if (request.order!.stOrder == DELIVERY_STATUS_TO_SEND) {

            request.order!.idOrder = null;
            for (var i = 0; i < request.order!.orderDetails.length; i++) {
              request.order!.orderDetails[i].idOrderDetail = null;
              for (var j = 0; j < request.order!.orderDetails[i].orderDetailUnit.length; j++) {
                request.order!.orderDetails[i].orderDetailUnit[j].idOrderDetailUnit = null;
              }
              if (request.order!.orderDetails[i].orderDetailDiscount != null) {
                for (var k = 0; k < request.order!.orderDetails[i].orderDetailDiscount.length; k++) {
                  request.order!.orderDetails[i].orderDetailDiscount[k].idOrderDetailDiscount = null;
                  request.order!.orderDetails[i].orderDetailDiscount[k].idOrderDetail = null;
                }
              }
            }
          }
          this.sendTransaction(request, type, coTransaction);
        });


        break;
      }

      case 'deposit': {
        let request: Request = {
          deposit: {} as Deposit,
          collectionIds: {}
        }
        this.depositService.getDeposit(this.dbService.getDatabase(), coTransaction).then((deposit) => {
          request.deposit = deposit!;
          request.deposit.idUser = Number(localStorage.getItem("idUser"));
          request.deposit.coUser = localStorage.getItem("coUser")!;
          request.deposit.idDeposit = null;
          /*
          request.deposit.daDeposit =
            request.deposit.daDeposit.split("/")[2] + "-" +
            request.deposit.daDeposit.split("/")[1] + "-" +
            request.deposit.daDeposit.split("/")[0];
          */

          this.depositService.getIdsDepositCollect(this.dbService.getDatabase(), coTransaction).then(collectionIds => {
            request.collectionIds = collectionIds;
            this.sendTransaction(request, type, coTransaction);
          })
        })


        break;
      }

      case 'updateaddress': {
        let request: Request = {
          userAddressClient: {} as UserAddresClients,
        }

        this.locationServices.getUserAddresLocation(this.dbService.getDatabase(), coTransaction).then(result => {
          request.userAddressClient = result;
          request.userAddressClient.idUserAddressClient = null;
          this.sendTransaction(request, type, result.coUserAddressClient);
        })
        break;
      }
      case 'return': {
        let request: Request = {
          returns: {} as Return,
        }
        this.returnDatabaseService.getReturn(this.dbService.getDatabase(), coTransaction).then(ret => {
          request.returns = ret;
          if (ret.stReturn == DELIVERY_STATUS_TO_SEND) {
            //si es la primera vez que se manda,
            //poner id en null para que se le asigne el id correcto en backend
            request.returns.idReturn = null;
            request.returns.daReturn = request.returns.daReturn.replace('T', ' ');
            for (var i = 0; i < request.returns.details.length; i++) {
              request.returns.details[i].idReturn = null;
            }
          }
          this.sendTransaction(request, type, ret.coReturn);
        }).catch(e => {
          console.log("[ReturnDatabaseService] Error al ejecutar getReturn.");
          console.log(e);
          return null;
        });
        break;
      }
      case 'clientStock': {
        let request: Request = {
          clientStock: {} as ClientStocks,
        }
        const promesa = new Promise<ClientStocks>((resolve, reject) => {
          this.inventariosLogicService.getClientStock(this.dbService.getDatabase(), coTransaction).then(clientStock => {
            console.log(clientStock);
            for (var i = 0; i < clientStock.clientStockDetails.length; i++) {
              this.inventariosLogicService.getClientStockDetailsUnits(this.dbService.getDatabase(), clientStock.clientStockDetails[i].coClientStockDetail, i).then(data => {
                console.log(data);
                let [index, object] = data

                for (var j = 0; j < object.length; j++) {
                  let arr = {} as ClientStocksDetailUnits;
                  arr = object[j]
                  clientStock.clientStockDetails[index].clientStockDetailUnits.push(arr);
                }
                console.log(clientStock.clientStockDetails[index]);
                if (index == clientStock.clientStockDetails.length - 1)
                  resolve(clientStock)
              })

            }

          }).catch(e => {
            console.log("Error al ejecutar getClientStock.");
            console.log(e);
            return null;
          });
        })

        promesa.then((clientStock) => {
          console.log("terime!", clientStock)
          request.clientStock = clientStock;
          request.clientStock.daClientStock = request.clientStock.daClientStock.replace('T', ' ');
          if (clientStock.stClientStock == DELIVERY_STATUS_TO_SEND) {
            //si es la primera vez que se manda,
            //poner id en null para que se le asigne el id correcto en backend
            request.clientStock.idClientStock = null;
            request.clientStock.daClientStock = request.clientStock.daClientStock.replace('T', ' ');
            for (var i = 0; i < request.clientStock.clientStockDetails.length; i++) {
              request.clientStock.clientStockDetails[i].idClientStockDetail = null;
            }
          }
          this.sendTransaction(request, type, clientStock.coClientStock);

        })

      }
    }
  }

  sendTransaction(request: any, type: string, coTransaction: string) {
    if (localStorage.getItem("connected") == "true") {
      this.callService(request, type, coTransaction).subscribe({
        next: (result) => {
          console.log(result);
          if (result.errorCode == "000") {
            this.messageAlert = new MessageAlert(
              "Denario Premium",
              result.errorMessage
            );
            this.messageService.alertModal(this.messageAlert);
            //DEBO SACAR DE LA TABLA pending_transactions EL ROW COPN EL COTRANSACTION INDICADO Y ACTUALIZAR EN EL MODULO CORRESPONDIENTE
            //COMO ENVIADA LA TRANSACCION(ACTUALIZAR EL ST)
            switch (type) {
              case "potentialClient":
                this.updateTransaction(result.coTransaction, result.idClient, result.type);
                break;

              case "visit":
                this.updateTransaction(result.coTransaction, result.idVisit, result.type);
                break;

              case 'order':
                this.updateTransaction(result.coTransaction, result.orderId, result.type);
                break;

              case "updateaddress":
                this.updateTransaction(result.coTransaction, result.userAddressClientId, result.type);
                break;

              case "return":
                this.updateTransaction(result.coTransaction, result.returnId, result.type);
                break;

              case "clientStock":
                this.updateTransaction(result.coTransaction, result.clientStockId, result.type);
                break;

              case "collect":
                this.updateTransaction(result.coTransaction, result.collectionId, result.type);
                break;
              case "deposit":
                this.updateTransaction(result.coTransaction, result.depositId, result.type);
                break;

              default:
                break;
            }

            this.deletePendingTransaction(result.coTransaction, result.type)
          }
          if (result.errorCode == "066") {
            //que se baje de la mula, nojoda!
            this.messageAlert = new MessageAlert(
              "Denario Premium",
              result.errorMessage
            );
            this.messageService.alertModal(this.messageAlert);
          }
        },
        complete: () => {
          console.info('complete');
        },
        error: (e) => {
          console.error(e);
          /*
          this.messageAlert = new MessageAlert(
            "Denario Premium",
            "Ocurrio un error contacte a su proveedor de servicio"
          );
          this.messageService.alertModal(this.messageAlert);
          */
        },
      });
    }
  }

  callService(request: any, type: string, coTransaction: string) {
    var url: string = this.services.getURLService();
    switch (type) {
      case "potentialClient":
        url = url + 'potentialclientservice/potentialclient'
        break;

      case "visit":
        url = url + "visitservice/visit"
        break;

      case "updateaddress":
        url = url + "addressclientservice/updateaddress";
        break;

      case "return":
        url = url + "returnservice/return"
        break;

      case "clientStock":
        url = url + "clientstockservice/clientstock"
        break;

      case 'order':
        url = url + 'orderservice/order';
        break

      case 'collect':
        url = url + 'collectionservice/collection';
        break

      case 'deposit':
        url = url + 'depositservice/deposit';
        break


      default:
        break;
    }
    return this.http.post<Response>(url, request,
      this.services.getHttpOptionsAuthorization())
      .pipe(
        map(resp => {
          resp.coTransaction = coTransaction;
          resp.type = type;
          return resp;
        })
      );
  }

  updateTransaction(coTransaction: string, idTransaction: number, type: string) {
    switch (type) {
      case 'potentialClient': {
        this.dbService.getDatabase()!.executeSql(
          'UPDATE potential_clients SET id_client = ?, st_potential_client = ? WHERE co_client = ?',
          [idTransaction, CLIENT_POTENTIAL_STATUS_SENT, coTransaction]
        ).then(res => {
          console.log("UPDATE EXITOSO ", res);

          this.adjuntoService.sendPhotos(this.dbService.getDatabase(), idTransaction, "clientes", coTransaction);

        }).catch(e => {
          console.log("UPDATE NO EXITOSO ", e);
        })
        break;
      }

      case 'visit': {

        this.dbService.getDatabase().executeSql("UPDATE incidences SET id_visit = ?  WHERE co_visit = ?", [idTransaction, coTransaction]).then(res => {

          console.log("UPDATE EXITOSO ", res);
          this.adjuntoService.sendPhotos(this.dbService.getDatabase(), idTransaction, "visitas", coTransaction);
        }).catch(e => {
          console.log("UPDATE NO EXITOSO ", e);
        });

        this.dbService.getDatabase().executeSql(
          'UPDATE visits SET id_visit = ? , st_visit = ? WHERE co_visit = ?', [idTransaction, VISIT_STATUS_VISITED, coTransaction]
        )
        break;
      }

      case 'order':
        this.dbService.getDatabase().executeSql(
          'UPDATE orders SET id_order = ? , st_delivery = ? WHERE co_order = ?', [idTransaction, DELIVERY_STATUS_SENT, coTransaction]
        ).then(res => {
          this.adjuntoService.sendPhotos(this.dbService.getDatabase(), idTransaction, "pedidos", coTransaction);
        })
        break;

      case 'updateaddress': {
        this.dbService.getDatabase().executeSql(
          'UPDATE user_address_clients SET id_user_address_client = ?, status = ? WHERE co_user_address_client = ?',
          [idTransaction, DELIVERY_STATUS_SENT, coTransaction]
        ).then(res => {
          console.log("UPDATE EXITOSO ", res);
        }).catch(e => {
          console.log("UPDATE NO EXITOSO ", e);
        })
        break;
      }

      case 'return': {
        this.dbService.getDatabase().executeSql(
          'UPDATE returns SET id_return = ?, st_return = ? WHERE co_return = ?',
          [idTransaction, DELIVERY_STATUS_SENT, coTransaction]
        ).then(res => {
          console.log("UPDATE EXITOSO ", res);

          this.adjuntoService.sendPhotos(this.dbService.getDatabase(), idTransaction, "devoluciones", coTransaction);

        }).catch(e => {
          console.log("UPDATE NO EXITOSO ", e);
        })
        break;
      }

      case 'clientStock': {
        this.dbService.getDatabase().executeSql(
          'UPDATE client_stocks SET id_client_stock = ?, st_client_stock = ? WHERE co_client_stock = ?',
          [idTransaction, DELIVERY_STATUS_SENT, coTransaction]
        ).then(res => {
          console.log("UPDATE EXITOSO ", res);
          this.adjuntoService.sendPhotos(this.dbService.getDatabase(), idTransaction, "inventarios", coTransaction);
        }).catch(e => {
          console.log("UPDATE NO EXITOSO ", e);
        })
        break;
      }

      case 'collect': {
        this.dbService.getDatabase().executeSql(
          'UPDATE collections SET id_collection= ?, st_collection= ? WHERE co_collection = ?',
          [idTransaction, DELIVERY_STATUS_SENT, coTransaction]
        ).then(res => {
          console.log("UPDATE EXITOSO ", res);
          this.adjuntoService.sendPhotos(this.dbService.getDatabase(), idTransaction, "cobros", coTransaction);
        }).catch(e => {
          console.log("UPDATE NO EXITOSO ", e);
        })
        break;
      }
      case 'deposit': {
        this.dbService.getDatabase().executeSql(
          'UPDATE deposits SET id_deposit= ?, st_deposit= ? WHERE co_deposit= ?',
          [idTransaction, DELIVERY_STATUS_SENT, coTransaction]
        ).then(res => {
          console.log("UPDATE EXITOSO ", res);
          //this.adjuntoService.sendPhotos(idTransaction, "deposit", coTransaction);
        }).catch(e => {
          console.log("UPDATE NO EXITOSO ", e);
        })
        break;
      }
    }
  }

  deletePendingTransaction(coTransaction: string, type: string) {
    this.dbService.getDatabase().executeSql(
      'DELETE FROM pending_transactions WHERE co_transaction = ? AND type = ?',
      [coTransaction, type]
    ).then(res => {
      console.log("BORRADO EXITOSO ", res);
    }).catch(e => {
      console.log("BORRADO NO EXITOSO ", e);
    })
  }
  /*
    getOrderRequest(coOrder: string) {
      //busca todos los documentos relacionados con el coOrder y los devuelve en un request.
      //para mandarlo a backend.
  
      let order: Orders;
      let orderDetails: OrderDetail[] = [];
      let orderUnits: OrderDetailUnit[] = [];
      let orderDetailDiscounts: OrderDetailDiscount[] = [];
  
      let queryOrder = "SELECT co_order as coOrder, co_client as coClient , id_client as idClient , da_order as daOrder, " +
        "da_created as daCreated , na_responsible as naResponsible, id_user as idUser, id_order_creator as idOrderCreator, " +
        "in_order_review as inOrderReview, nu_amount_total as nuAmountTotal, nu_amount_final as nuAmountFinal, co_currency as coCurrency, " +
        "da_dispatch as daDispatch, tx_comment as txComment, nu_purchase as nuPurchase , co_enterprise as coEnterprise, co_user as coUser , " +
        "co_payment_condition as coPaymentCondition, id_payment_condition as idPaymentCondition, id_enterprise as idEnterprise, " +
        "co_address_client as coAddress, id_address_client as idAddress, nu_amount_discount as nuAmountDiscount, " +
        "nu_amount_total_base as nuAmountTotalBase, st_order as stOrder, coordenada , nu_discount as nuDiscount, " +
        "id_currency as idCurrency, id_currency_conversion as idCurrencyConversion, nu_value_local as nuValueLocal, " +
        "nu_amount_total_conversion as nuAmountTotalConversion, nu_amount_final_conversion as nuAmountFinalConversion, " +
        "procedencia , nu_amount_total_base_conversion as nuAmountTotalBaseConversion, " +
        "nu_amount_discount_conversion nuAmountDiscountConversion, id_order_type as idOrderType, nu_attachments as nuAttachments, has_attachments as hasAttachments " +
        "FROM orders WHERE co_order = ?";
  
      let queryDetails = "SELECT co_order_detail as coOrderDetail , co_order as coOrder , co_product as coProduct, " +
        "na_product as naProduct, id_product as idProduct, nu_price_base as nuPriceBase, nu_amount_total as nuAmountTotal, " +
        "co_warehouse as coWarehouse, id_warehouse as idWarehouse, qu_suggested as quSuggested, co_enterprise as coEnterprise, " +
        "id_enterprise as idEnterprise, iva , nu_discount_total as nuDiscountTotal, co_discount as coDiscount, id_discount as idDiscount, " +
        "co_price_list as coPriceList, id_price_list as idPriceList, posicion , nu_price_base_conversion as nuPriceConversion, " +
        "nu_discount_total_conversion  nuDiscountTotalConversion, nu_amount_total_conversion as nuAmountTotalConversion " +
        "FROM order_details WHERE co_order = ? ";
  
      // para estos 2 debo usar un hack asqueroso donde agrego los coOrderDetail directo al query como strings.
      let queryUnits = "SELECT co_order_detail_unit  as coOrderDetailUnit, co_order_detail as coOrderDetail, " +
        "co_product_unit as coProductUnit, id_product_unit as idProductUnit, qu_order as quOrder, co_enterprise as coEnterprise, " +
        "id_enterprise as idEnterprise, co_unit as coUnit, qu_suggested as quSuggested " +
        "FROM order_detail_units WHERE co_order_detail in (";
  
      let queryDiscounts = "SELECT co_order_detail_discount as coOrderDetailDiscount, " +
        "co_order_detail as coOrderDetail, id_order_detail as idOrderDetail, id_discount as idDiscount, qu_discount as quDiscount, " +
        "nu_price_final as nuPriceFinal, co_enterprise as coEnterprise, id_enterprise as idEnterprise " +
        "FROM order_detail_discount WHERE co_order_detail in (";
  
  
      return this.dbService.getDatabase().executeSql(queryOrder, [coOrder]).then(data1 => {
        order = data1.rows.item(0);
        return this.dbService.getDatabase().executeSql(queryDetails, [coOrder]).then(data2 => {
          let coOrderDetails: string[] = [];
          for (let i = 0; i < data2.rows.length; i++) {
            let item = data2.rows.item(i);
  
            orderDetails.push(item);
            coOrderDetails.push(item.coOrderDetail);
          }
          order.orderDetails = orderDetails;
  
          return this.dbService.getDatabase().executeSql(queryUnits + coOrderDetails.toString() + ")", []).then(data3 => {
            for (let i = 0; i < data3.rows.length; i++) {
              let item = data3.rows.item(i)
              orderUnits.push(item);
              let detail = orderDetails.find(x => x.coOrderDetail == item.coOrderDetail);
              if (detail) {
                if (detail.orderDetailUnit) { }
                else { detail.orderDetailUnit = [] }
                detail.orderDetailUnit.push(item);
              }
            }
  
            return this.dbService.getDatabase().executeSql(queryDiscounts + coOrderDetails.toString() + ")", []).then(data4 => {
              for (let i = 0; i < data4.rows.length; i++) {
                let item = data4.rows.item(i);
                orderDetailDiscounts.push(item);
                let detail = orderDetails.find(x => x.coOrderDetail == item.coOrderDetail);
                if (detail) {
                  if (detail.orderDetailDiscount) { }
                  else { detail.orderDetailDiscount = [] }
                  detail.orderDetailDiscount.push(item);
                }
              }
              order.nuDetails = orderDetails.length;
  
              let request = {
                order: order,
                //orderDetails: orderDetails,
                //orderDetailUnits: orderUnits,
                //orderDetailDiscounts: orderDetailDiscounts
  
              }
  
              console.log(request);
              return request;
  
            });
          });
        })
  
  
      });
  
  
    }
      */

}