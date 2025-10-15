import { Injectable, inject } from '@angular/core';
import { SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';

import { GlobalConfigService } from '../globalConfig/global-config.service';
import { DocumentSale } from '../../modelos/tables/documentSale';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';

@Injectable({
  providedIn: 'root'
})
export class ClientesDatabaseServicesService {
  private globalConfig = inject(GlobalConfigService);
  public dbServ = inject(SynchronizationDBService)

  constructor() { }

  getClients(idEnterprise: number) {
    let selectStatement = "";
    if (this.globalConfig.get("multiCurrency") == 'true') {
      if (this.globalConfig.get("conversionDocument") == 'true') {
        selectStatement = 'SELECT c.*, (SELECT p.na_list FROM lists p WHERE p.id_list = c.id_list LIMIT 1 ) na_price_list, ' +
          '(SELECT na_channel FROM distribution_channels WHERE id_channel = c.id_channel LIMIT 1 ) channel, ' +
          '(SELECT SUM(ds.nu_balance) FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client AND ds.co_currency =  "' + localStorage.getItem("localCurrency") + '") saldo1,' +
          '(SELECT SUM(ds.nu_balance / ds.nu_value_local) FROM document_sales ds WHERE  ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client AND  ds.co_currency =  "' + localStorage.getItem("localCurrency") + '") saldo1Conver,' +
          '(SELECT SUM(ds.nu_balance) FROM document_sales ds WHERE  ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client AND ds.co_currency =  "' + localStorage.getItem("hardCurrency") + '") saldo2,' +
          '(SELECT SUM(ds.nu_balance * ds.nu_value_local) FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client AND  ds.co_currency =  "' + localStorage.getItem("hardCurrency") + '") saldo2Conver,' +
          '(SELECT SUM(ds.nu_amount_total) FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client AND ds.co_currency = c.co_currency) nuAmountTotal1, ' +
          '(SELECT SUM(ds.nu_amount_total) FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client  AND ds.co_currency != c.co_currency) nuAmountTotal2, ' +
          '(SELECT co_currency FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client) coCurrency, ' +
          '(SELECT coordenada FROM address_clients ac WHERE ac.id_client=c.id_client) coordenada, ' +
          '(SELECT editable FROM address_clients ac WHERE ac.id_client=c.id_client) editable, ' +
          '(SELECT e.lb_enterprise FROM enterprises e WHERE e.id_enterprise = c.id_enterprise LIMIT 1 ) lbl_enterprise ' +
          'FROM clients c ' +
          'LEFT JOIN lists p ON p.id_list = c.id_list ' +
          'LEFT JOIN distribution_channels dc ON dc.id_channel = c.id_channel ' +
          'WHERE c.id_enterprise = ?'
      } else {
        selectStatement = 'SELECT c.*, (SELECT p.na_list FROM lists p WHERE p.id_list = c.id_list LIMIT 1 ) na_price_list, ' +
          '(SELECT na_channel FROM distribution_channels WHERE id_channel = c.id_channel LIMIT 1 ) channel, ' +
          '(SELECT SUM(ds.nu_balance) FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client AND ds.co_currency = c.co_currency) saldo1 ,' +
          '(SELECT SUM(ds.nu_balance) FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client AND  ds.co_currency != c.co_currency) saldo2 ,' +
          '(SELECT SUM(ds.nu_amount_total) FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client AND ds.co_currency = c.co_currency) nuAmountTotal1, ' +
          '(SELECT SUM(ds.nu_amount_total) FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client  AND ds.co_currency != c.co_currency) nuAmountTotal2, ' +
          '(SELECT co_currency FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client) coCurrency, ' +
          '(SELECT coordenada FROM address_clients ac WHERE ac.id_client=c.id_client) coordenada, ' +
          '(SELECT editable FROM address_clients ac WHERE ac.id_client=c.id_client) editable, ' +
          '(SELECT e.lb_enterprise FROM enterprises e WHERE e.id_enterprise = c.id_enterprise LIMIT 1 ) lbl_enterprise ' +
          'FROM clients c ' +
          'LEFT JOIN lists p ON p.id_list = c.id_list ' +
          'LEFT JOIN distribution_channels dc ON dc.id_channel = c.id_channel ' +
          'WHERE c.id_enterprise = ?'
      }
    } else {
      selectStatement = 'SELECT c.*, (SELECT p.na_list FROM lists p WHERE p.id_list = c.id_list LIMIT 1 ) na_price_list, ' +
        '(SELECT na_channel FROM distribution_channels WHERE id_channel = c.id_channel LIMIT 1 ) channel, ' +
        '(SELECT SUM(ds.nu_balance) FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client) saldo1, ' +
        '(SELECT SUM(ds.nu_amount_total) FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client) nuAmountTotal, ' +
        '(SELECT co_currency FROM document_sales ds WHERE ds.id_enterprise = ' + idEnterprise + ' AND ds.id_client=c.id_client) coCurrency, ' +
        '(SELECT coordenada FROM address_clients ac WHERE ac.id_client=c.id_client) coordenada, ' +
        '(SELECT editable FROM address_clients ac WHERE ac.id_client=c.id_client) editable, ' +
        '(SELECT e.lb_enterprise FROM enterprises e WHERE e.id_enterprise = c.id_enterprise LIMIT 1 ) lbl_enterprise ' +
        'FROM clients c ' +
        'LEFT JOIN lists p ON p.id_list = c.id_list ' +
        'LEFT JOIN distribution_channels dc ON dc.id_channel = c.id_channel ' +
        'WHERE c.id_enterprise = ?'
    }

    /* selectStatement = "SELECT * FROM clients" */
    if (this.globalConfig.get("clientsOrderBy") != '') {
      if (this.globalConfig.get("clientsOrderBy") == "na_client") {
        selectStatement += ' ORDER BY c.' + "lb_client";
      } else
        selectStatement += ' ORDER BY c.' + this.globalConfig.get("clientsOrderBy");
    }

    return this.dbServ.getDatabase().executeSql(selectStatement, [idEnterprise]).then(data => {
      let lists = [];
      for (let i = 0; i < data.rows.length; i++) {
        lists.push({
          idClient: data.rows.item(i).id_client,
          coClient: data.rows.item(i).co_client,
          lbClient: data.rows.item(i).lb_client,
          naClient: data.rows.item(i).na_client,
          nuRif: data.rows.item(i).nu_rif,
          idChannel: data.rows.item(i).id_channel,
          idWarehouse: data.rows.item(i).id_warehouse,
          idHeadQuarter: 0,
          idList: data.rows.item(i).id_list,
          idPaymentCondition: data.rows.item(i).id_payment_condition,
          coPaymentCondition: data.rows.item(i).co_payment_condition,
          inSuspension: data.rows.item(i).in_suspension,
          quDiscount: data.rows.item(i).qu_discount,
          naEmail: data.rows.item(i).na_email,
          nuCreditLimit: data.rows.item(i).nu_credit_limit,
          naWebSite: data.rows.item(i).na_web_site,
          idCurrency: data.rows.item(i).id_currency,
          coCurrency: data.rows.item(i).co_currency,
          multimoneda: data.rows.item(i).multimoneda,
          coEnterprise: data.rows.item(i).co_enterprise,
          idEnterprise: data.rows.item(i).id_enterprise,
          channel: data.rows.item(i).channel,
          lblEnterprise: data.rows.item(i).lbl_enterprise,
          naPriceList: data.rows.item(i).na_price_list,
          naResponsible: data.rows.item(i).na_responsible,
          nuPhone: data.rows.item(i).nu_phone,
          saldo1: data.rows.item(i).saldo1 == null ? 0 : data.rows.item(i).saldo1,
          saldo1Conver: data.rows.item(i).saldo1Conver == null ? 0 : data.rows.item(i).saldo1Conver,
          saldo2: data.rows.item(i).saldo2 == null ? 0 : data.rows.item(i).saldo2,
          saldo2Conver: data.rows.item(i).saldo2Conver == null ? 0 : data.rows.item(i).saldo2Conver,
          txAddress: data.rows.item(i).tx_address,
          coordenada: data.rows.item(i).coordenada,
          editable: data.rows.item(i).editable,
          idAddressClients: 0,
          coAddressClients: "",
          collectionIva: data.rows.item(i).collection_iva == "true" ? true : false,
        });
      }
      return lists;
    })
  }

  getClient(idClient: number, idEnterprise: number) {
    let selectStatement = 'SELECT co_client as coClient, co_currency as coCurrency, co_enterprise as coEnterprise,'
      + 'co_payment_condition as coPaymentCondition,id_channel as idChannel,id_client as idClient,id_currency as idCurrency,'
      + 'id_enterprise as idEnterprise,id_head_quarter as idHeadQuarter,id_list as idList,id_payment_condition as idPaymentCondition,'
      + 'id_warehouse as idWarehouse,in_suspension as inSuspension,lb_client as lbClient,multimoneda, na_email as naEmail,'
      + 'na_web_site as naWebSite,nu_credit_limit as nuCreditLimit,nu_rif as nuRif,qu_discount as quDiscount'
      + ' FROM clients  WHERE id_client = ? and id_enterprise = ?';
    return this.dbServ.getDatabase().executeSql(selectStatement, [idClient, idEnterprise]).then(data => {
      return data.rows.item(0);
    })
  }

  getClientById(idClient: number) {

    if (this.globalConfig.get("multiCurrency")) {
      if (this.globalConfig.get("conversionDocument")) {
        var selectStatement = 'SELECT c.co_client as coClient, c.co_currency as coCurrency, c.co_enterprise as coEnterprise,' +
          'c.co_payment_condition as coPaymentCondition,c.id_channel as idChannel,c.id_client as idClient,c.id_currency as idCurrency,' +
          'c.id_enterprise as idEnterprise,c.id_head_quarter as idHeadQuarter,c.id_list as idList,c.id_payment_condition as idPaymentCondition,' +
          'c.id_warehouse as idWarehouse,c.in_suspension as inSuspension,c.lb_client as lbClient,c.multimoneda, c.na_email as naEmail,' +
          'c.na_web_site as naWebSite,c.nu_credit_limit as nuCreditLimit,c.nu_rif as nuRif,c.qu_discount as quDiscount, ' +
          '(SELECT na_responsible FROM address_clients WHERE id_client = ? LIMIT 1 ) naResponsible, ' +
          '(SELECT na_list FROM lists p WHERE p.id_list = c.id_list LIMIT 1 ) naPriceList,(SELECT nu_phone FROM address_clients WHERE id_client = ? LIMIT 1 ) nuPhone, ' +
          '(SELECT tx_address FROM address_clients WHERE id_client = ? LIMIT 1 ) txAddress, ' +
          '(SELECT na_channel FROM distribution_channels WHERE id_channel = c.id_channel LIMIT 1 ) channel, ' +
          "(SELECT SUM(ds.nu_balance) from document_sales ds WHERE ds.id_client=? AND ds.co_currency =  '" + localStorage.getItem("localCurrency") + "') saldo1, " +
          "(SELECT SUM(ds.nu_balance / ds.nu_value_local) from document_sales ds WHERE ds.id_client=? AND ds.co_currency =  '" + localStorage.getItem("localCurrency") + "') saldo1Conver, " +
          "(SELECT SUM(ds.nu_balance) from document_sales ds WHERE ds.id_client=?  AND ds.co_currency = '" + localStorage.getItem("hardCurrency") + "') saldo2, " +
          "(SELECT SUM(ds.nu_balance * ds.nu_value_local) from document_sales ds WHERE ds.id_client=?  AND ds.co_currency = '" + localStorage.getItem("hardCurrency") + "') saldo2Conver, " +
          '(SELECT co_currency FROM document_sales ds WHERE ds.id_client=?) coCurrency,' +
          '(SELECT coordenada FROM address_clients ac WHERE ac.id_client=c.id_client) coordenada, ' +
          '(SELECT editable FROM address_clients ac WHERE ac.id_client=c.id_client) editable, ' +
          '(SELECT id_address FROM address_clients ac WHERE ac.id_client=c.id_client) idAddressClients, ' +
          '(SELECT co_address FROM address_clients ac WHERE ac.id_client=c.id_client) coAddressClients, ' +
          '(SELECT e.lb_enterprise FROM enterprises e WHERE e.id_enterprise = c.id_enterprise LIMIT 1 ) lblEnterprise  FROM clients c WHERE id_client = ?';


        return this.dbServ.getDatabase().executeSql(selectStatement, [idClient, idClient, idClient, idClient, idClient, idClient, idClient, idClient, idClient]).then(data => {
          data.rows.item(0).saldo1 = data.rows.item(0).saldo1 == null ? 0 : data.rows.item(0).saldo1;
          data.rows.item(0).saldo1Conver = data.rows.item(0).saldo1Conver == null ? 0 : data.rows.item(0).saldo1Conver;
          data.rows.item(0).saldo2 = data.rows.item(0).saldo2 == null ? 0 : data.rows.item(0).saldo2;
          data.rows.item(0).saldo2Conver = data.rows.item(0).saldo2Conver == null ? 0 : data.rows.item(0).saldo2Conver;
          return data.rows.item(0);
        })

      } else {
        var selectStatement = 'SELECT c.co_client as coClient, c.co_currency as coCurrency, c.co_enterprise as coEnterprise,' +
          'c.co_payment_condition as coPaymentCondition,c.id_channel as idChannel,c.id_client as idClient,c.id_currency as idCurrency,' +
          'c.id_enterprise as idEnterprise,c.id_head_quarter as idHeadQuarter,c.id_list as idList,c.id_payment_condition as idPaymentCondition,c.nu_credit_limit as nuCreditLimit,' +
          'c.id_warehouse as idWarehouse,c.in_suspension as inSuspension,c.lb_client as lbClient,c.nu_rif as nuRif,c.multimoneda, c.na_email as naEmail,' +
          '(SELECT na_responsible FROM address_clients WHERE id_client = ? LIMIT 1 ) naResponsible, ' +
          '(SELECT na_list FROM lists p WHERE p.id_list = c.id_list LIMIT 1 ) naPriceList,(SELECT nu_phone FROM address_clients WHERE id_client = ? LIMIT 1 ) nuPhone, ' +
          '(SELECT tx_address FROM address_clients WHERE id_client = ? LIMIT 1 ) txAddress, ' +
          '(SELECT na_channel FROM distribution_channels WHERE id_channel = c.id_channel LIMIT 1 ) channel, ' +
          '(SELECT SUM(ds.nu_balance) from document_sales ds WHERE ds.id_client=? AND ds.co_currency = c.co_currency) saldo1,' +
          '(SELECT SUM(ds.nu_balance) from document_sales ds WHERE ds.id_client=?  AND ds.co_currency != c.co_currency) saldo2,' +
          '(SELECT co_currency FROM document_sales ds WHERE ds.id_client=?) coCurrency,' +
          '(SELECT coordenada FROM address_clients ac WHERE ac.id_client=c.id_client) coordenada, ' +
          '(SELECT editable FROM address_clients ac WHERE ac.id_client=c.id_client) editable, ' +
          '(SELECT id_address FROM address_clients ac WHERE ac.id_client=c.id_client) idAddressClients, ' +
          '(SELECT co_address FROM address_clients ac WHERE ac.id_client=c.id_client) coAddressClients, ' +
          '(SELECT e.lb_enterprise FROM enterprises e WHERE e.id_enterprise = c.id_enterprise LIMIT 1 ) lblEnterprise  FROM clients c WHERE id_client = ?';


        return this.dbServ.getDatabase().executeSql(selectStatement, [idClient, idClient, idClient, idClient, idClient, idClient, idClient]).then(data => {
          data.rows.item(0).saldo1 = data.rows.item(0).saldo1 == null ? 0 : data.rows.item(0).saldo1;
          data.rows.item(0).saldo2 = data.rows.item(0).saldo2 == null ? 0 : data.rows.item(0).saldo2;

          return data.rows.item(0);
        })
      }
    } else {
      var selectStatement = 'SELECT c.co_client as coClient, c.co_currency as coCurrency, c.co_enterprise as coEnterprise,' +
        'c.co_payment_condition as coPaymentCondition,c.id_channel as idChannel,c.id_client as idClient,c.id_currency as idCurrency,c.nu_credit_limit as nuCreditLimit,' +
        'c.id_enterprise as idEnterprise,c.id_head_quarter as idHeadQuarter,c.id_list as idList,c.id_payment_condition as idPaymentCondition,' +
        'c.id_warehouse as idWarehouse,c.in_suspension as inSuspension,c.lb_client as lbClient,c.nu_rif as nuRif,c.multimoneda, c.na_email as naEmail,' +
        '(SELECT na_responsible FROM address_clients WHERE id_client = ? LIMIT 1 ) naResponsible, ' +
        '(SELECT na_list FROM lists p WHERE p.id_list = c.id_list LIMIT 1 ) naPriceList,(SELECT nu_phone FROM address_clients WHERE id_client = ? LIMIT 1 ) nuPhone, ' +
        '(SELECT tx_address FROM address_clients WHERE id_client = ? LIMIT 1 ) txAddress, ' +
        '(SELECT na_channel FROM distribution_channels WHERE id_channel = c.id_channel LIMIT 1 ) channel, ' +
        '(SELECT SUM(ds.nu_balance) from document_sales ds WHERE ds.id_client=?) saldo,' +
        '(SELECT co_currency FROM document_sales ds WHERE ds.id_client=?) coCurrency,' +
        '(SELECT coordenada FROM address_clients ac WHERE ac.id_client=c.id_client) coordenada, ' +
        '(SELECT editable FROM address_clients ac WHERE ac.id_client=c.id_client) editable, ' +
        '(SELECT id_address FROM address_clients ac WHERE ac.id_client=c.id_client) idAddressClients, ' +
        '(SELECT co_address FROM address_clients ac WHERE ac.id_client=c.id_client) coAddressClients, ' +
        '(SELECT e.lb_enterprise FROM enterprises e WHERE e.id_enterprise = c.id_enterprise LIMIT 1 ) lblEnterprise  FROM clients c WHERE id_client = ?';
      console.log("en query: getClientById");
      return this.dbServ.getDatabase().executeSql(selectStatement, [idClient, idClient, idClient, idClient, idClient, idClient]).then(data => {
        /*   let lists = [];
          for (let i = 0; i < data.rows.length; i++) {
            lists.push(data.rows.item(i));
          } */
        return data.rows.item(0);
      })
    }
  }

  getDocumentSaleByIdClient(idClient: number) {
    let selectStatement = 'SELECT DISTINCT ds.*, ' +
      '(SELECT na_type FROM document_sale_types WHERE co_type = ds.co_document_sale_type) naType ' +
      'FROM document_sales ds WHERE ds.id_client = ?';

    return this.dbServ.getDatabase().executeSql(selectStatement, [idClient]).then(data => {
      let lists: DocumentSale[] = [];

      for (let i = 0; i < data.rows.length; i++) {
        lists.push({
          idDocument: data.rows.item(i).id_document,
          idClient: data.rows.item(i).id_client,
          coClient: data.rows.item(i).co_client,
          idDocumentSaleType: data.rows.item(i).id_document_sale_type,
          coDocumentSaleType: data.rows.item(i).co_document_sale_type,
          daDocument: data.rows.item(i).da_document,
          daDueDate: data.rows.item(i).da_due_date,
          nuAmountBase: data.rows.item(i).na_amoount_base,
          nuAmountDiscount: data.rows.item(i).nu_amount_discount,
          nuAmountTax: data.rows.item(i).nu_amount_tax,
          nuAmountTotal: data.rows.item(i).nu_amount_total,
          nuAmountPaid: data.rows.item(i).nu_amount_total,
          nuBalance: data.rows.item(i).nu_balance,
          coCurrency: data.rows.item(i).co_currency,
          idCurrency: data.rows.item(i).id_currency,
          nuDocument: data.rows.item(i).nu_document,
          txComment: data.rows.item(i).tx_comment,
          coDocument: data.rows.item(i).co_document,
          coCollection: data.rows.item(i).co_collection,
          nuValueLocal: data.rows.item(i).nu_value_local,
          stDocumentSale: data.rows.item(i).st_document_sale,
          coEnterprise: data.rows.item(i).co_enterprise,
          idEnterprise: data.rows.item(i).id_enterprise,
          naType: data.rows.item(i).naType,
          isSelected: false,
          positionCollecDetails: 0,
          nuAmountRetention: 0,
          nuAmountRetention2: 0,
          daVoucher: "",
          nuVaucherRetention: "",
          igtfAmount: 0,
          txConversion: 0,
          inPaymentPartial: false,
          isSave: false,
        })
      }
      return lists
    }).catch(e => {
      let lists: DocumentSale[] = [];
      console.log(e);
      return lists;
    })
  }

}







