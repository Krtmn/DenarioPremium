import { Injectable, OnInit, inject } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite';

@Injectable({
  providedIn: 'root'
})
export class HistoryTransaction implements OnInit {

  constructor() {

  }

  ngOnInit() {


  }

  getStatusTransaction(db: SQLiteObject, idTransactionType: number, idTransaction: number) {
    // Configuración por tipo de transacción
    const config: any = {
      2: { select: "SELECT o.id_order, st.na_status, ts.tx_comment ", join: "JOIN orders o on ts.id_transaction = o.id_order and ts.id_transaction_type = ? ", where: "WHERE o.id_order = ? " },
      3: { select: "SELECT co.id_collection, st.na_status, ts.tx_comment ", join: "JOIN collections co on ts.id_transaction = co.id_collection and ts.id_transaction_type = ? ", where: "WHERE co.id_collection = ? " },
      4: { select: "SELECT re.id_return, st.na_status, ts.tx_comment ", join: "JOIN returns re on ts.id_transaction = re.id_return and ts.id_transaction_type = ? ", where: "WHERE re.id_return = ? " },
      5: { select: "SELECT cs.id_client_stock, st.na_status, ts.tx_comment ", join: "JOIN client_stocks cs on ts.id_transaction = cs.id_client_stock and ts.id_transaction_type = ? ", where: "WHERE cs.id_client_stock = ? " },
      6: { select: "SELECT de.id_deposit, st.na_status, ts.tx_comment ", join: "JOIN deposits de on ts.id_transaction = de.id_deposit and ts.id_transaction_type = ? ", where: "WHERE de.id_deposit = ? " }
    };

    const conf = config[idTransactionType];
    if (!conf) return Promise.resolve("Tipo de transacción no soportado");

    let query = conf.select +
      "FROM transaction_statuses ts " +
      conf.join +
      "JOIN statuses st on ts.id_status = st.id_status " +
      conf.where +
      "ORDER BY ts.da_transaction_statuses DESC LIMIT 1";

    return db.executeSql(query, [idTransactionType, idTransaction]).then(data => {
      return data.rows.length > 0 ? data.rows.item(0) : "Enviado";
    }).catch(error => {
      console.error("Error al obtener el estado del pedido:", error);
      return "Error al obtener el estado";
    });
  }
}
