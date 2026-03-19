import { Component, OnInit, Input, inject } from '@angular/core';

import { InventariosLogicService } from 'src/app/services/inventarios/inventarios-logic.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { ProductStructureService } from 'src/app/services/productStructures/product-structure.service';
import { ProductService } from 'src/app/services/products/product.service';
import { ClientStockTotal } from 'src/app/modelos/client-stock-total';
import { PedidosService } from 'src/app/pedidos/pedidos.service';
import { Router } from '@angular/router';
import { List } from 'src/app/modelos/tables/list';
import { MessageService } from 'src/app/services/messageService/message.service';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { DELIVERY_STATUS_SENT } from 'src/app/utils/appConstants';
import { Client } from 'src/app/modelos/tables/client';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';

interface InventoryRow {
  rowId: string;
  coProduct: string;
  naProduct: string;
  exhEntries: string[];
  depEntries: string[];
  selected: boolean;
}

@Component({
    selector: 'app-inventario-actividades',
    templateUrl: './inventario-actividades.component.html',
    styleUrls: ['./inventario-actividades.component.scss'],
    standalone: false
})
export class InventarioActividadesComponent implements OnInit {

  public productStructureService = inject(ProductStructureService);
  public productService = inject(ProductService);
  public inventariosLogicService = inject(InventariosLogicService)
  public globalConfig = inject(GlobalConfigService);
  public dateServ = inject(DateServiceService);
  public orderServ =  inject(PedidosService);
  public dbServ = inject(SynchronizationDBService);
  public adjuntoService = inject(AdjuntoService)
  public clientStocksTotal: ClientStockTotal[] = [];
  public inventoryRows: InventoryRow[] = [];
  public router =  inject(Router);
  public message = inject(MessageService);

  ngOnInit() {
    this.rebuildTableData();
  }

  private rebuildTableData() {
    this.clientStocksTotal = [];
    this.inventoryRows = [];
    const groupedRows = new Map<string, InventoryRow>();

    this.inventariosLogicService.newClientStock.clientStockDetails.forEach((clientStockDetail: any) => {
      let clienStockTotal = {} as ClientStockTotal;
      clienStockTotal.totalUnits = 0;
      clienStockTotal.totalExh = 0;
      clienStockTotal.totalDep = 0;
      clienStockTotal.idEnterprise = clientStockDetail.idEnterprise;
      clienStockTotal.coEnterprise = clientStockDetail.coEnterprise;
      clienStockTotal.idProduct = clientStockDetail.idProduct;
      clienStockTotal.coProduct = clientStockDetail.coProduct;
      clienStockTotal.naProduct = clientStockDetail.naProduct;

      clientStockDetail.clientStockDetailUnits.forEach((detailUnit: any) => {
        clienStockTotal.naUnit = detailUnit.naUnit;
        clienStockTotal.idUnit = detailUnit.idUnit;
        clienStockTotal.coUnit = detailUnit.coUnit;
        clienStockTotal.daExpiration = (detailUnit.daExpiration || '').split('T')[0];
        clienStockTotal.totalUnits += Number(detailUnit.quStock || 0);
        clienStockTotal.ubicacion = detailUnit.ubicacion;

        if (detailUnit.ubicacion === 'exh') {
          clienStockTotal.totalExh += Number(detailUnit.quStock || 0);
        } else {
          clienStockTotal.totalDep += Number(detailUnit.quStock || 0);
        }

        const rowKey = clientStockDetail.coProduct;
        if (!groupedRows.has(rowKey)) {
          groupedRows.set(rowKey, {
            rowId: rowKey,
            coProduct: clientStockDetail.coProduct,
            naProduct: clientStockDetail.naProduct,
            exhEntries: [],
            depEntries: [],
            selected: false,
          });
        }

        const groupedRow = groupedRows.get(rowKey)!;
        const amountWithUnit = `${Number(detailUnit.quStock || 0)} ${detailUnit.naUnit || ''}`.trim();

        if (detailUnit.ubicacion === 'exh') {
          groupedRow.exhEntries.push(amountWithUnit);
        } else {
          groupedRow.depEntries.push(amountWithUnit);
        }
      });

      this.clientStocksTotal.push(clienStockTotal);
    });

    this.inventoryRows = Array.from(groupedRows.values());
  }

  get selectedRowsCount() {
    return this.inventoryRows.filter(row => row.selected).length;
  }

  preguntarSugerirPedido(){
    let buttonsConfirmSend = [
      {
        text: 'Cancelar',
        role: 'cancel',
        handler: () => {
          console.log('Alert canceled');


        },
      },
      {
        text: 'Aceptar',
        role: 'confirm',
        handler: () => {
          console.log('Alert confirmed');
          this.sugerirPedido();
          this.message.closeCustomBtn();



        },
      },
    ];
    let message = {
      header: this.inventariosLogicService.inventarioTags.get("INV_NOMBRE_MODULO"),
      message: this.inventariosLogicService.inventarioTags.get("INV_PREGUNTA_SUGERIR")
    } as MessageAlert;

    this.message.alertCustomBtn(message ,buttonsConfirmSend);
  }

  async sugerirPedido(){

    // this.orderServ.empresaSeleccionada = this.inventariosLogicService.empresaSeleccionada;
    // this.orderServ.setup();
    let direccion = this.inventariosLogicService.addressClient.filter(dir =>{
      return dir.idAddress == this.inventariosLogicService.newClientStock.idAddressClient
    })[0];
    this.orderServ.desdeSugerencia = true;
    this.orderServ.openOrder = true;
    this.orderServ.pedidoModificable =  true;


    let list = this.orderServ.listaList.find((list) => list.idList == this.inventariosLogicService.cliente.idList);
    if(list != undefined){
      this.orderServ.listaSeleccionada = list;
      this.orderServ.listaPriceListFiltrada = this.orderServ.listaPricelist.filter((pl) => pl.idList == list?.idList)
    }else{
      console.log('no se consiguió la lista');
      //a veces tengo un client muy basico que no tiene idList, por eso busco por segunda vez
      let cliente: Client = await this.orderServ.getClient(this.inventariosLogicService.cliente.idClient);
      this.inventariosLogicService.cliente = cliente;
      list = this.orderServ.listaList.find((list) => list.idList == cliente.idList);
      if(list != undefined){
        this.orderServ.listaSeleccionada = list;
        this.orderServ.listaPriceListFiltrada = this.orderServ.listaPricelist.filter((pl) => pl.idList == list?.idList)
      }else{
        console.log('no se consiguió la lista por segunda vez');
        list = {} as List;
      }
    }
    //guardar el stock actual
    var toSend =  false;
    if(this.inventariosLogicService.newClientStock.stDelivery != DELIVERY_STATUS_SENT){
      this.inventariosLogicService.saveClientStock(this.dbServ.getDatabase(),false);
      this.adjuntoService.savePhotos(this.dbServ.getDatabase(),
      this.inventariosLogicService.newClientStock.coClientStock, "inventarios");
      toSend= true;
    }

    this.orderServ.datosPedidoSugerido = {
      empresa: this.inventariosLogicService.empresaSeleccionada,
      cliente: this.inventariosLogicService.cliente,
      direccion: direccion,
      productos: this.clientStocksTotal,
      list: JSON.parse(JSON.stringify(list)),
      enviar: toSend,
      coClientStock: this.inventariosLogicService.newClientStock.coClientStock,
      idClientStock: this.inventariosLogicService.newClientStock.idClientStock,
    };
    //ir a nuevo pedido
    this.router.navigate(['pedido']);
    this.inventariosLogicService.isEdit = false;
    this.inventariosLogicService.showHeaderButtonsFunction(false);
    this.inventariosLogicService.inventarioComp = false;
    this.inventariosLogicService.inventarioList = false;
    this.inventariosLogicService.typeStocksComponent = false;
    this.inventariosLogicService.containerComp = true;
    this.message.closeCustomBtn();

  }

  deleteClientStock(index: number) {
    // Compatibilidad con llamadas existentes: elimina todas las filas de ese producto
    const targetProduct = this.clientStocksTotal[index];
    if (!targetProduct) {
      return;
    }
    const rowIds = this.inventoryRows
      .filter(row => row.coProduct === targetProduct.coProduct)
      .map(row => row.rowId);
    this.deleteRowsByIds(rowIds);
  }

  deleteClientStockRow(rowId: string) {
    this.deleteRowsByIds([rowId]);
  }

  deleteSelectedRows() {
    const rowIds = this.inventoryRows.filter(row => row.selected).map(row => row.rowId);
    this.deleteRowsByIds(rowIds);
  }

  private deleteRowsByIds(rowIds: string[]) {
    if (!rowIds.length) {
      return;
    }

    rowIds.forEach((rowId) => {
      const detailIndex = this.inventariosLogicService.newClientStock.clientStockDetails.findIndex(
        detail => detail.coProduct === rowId
      );

      if (detailIndex >= 0) {
        this.inventariosLogicService.newClientStock.clientStockDetails.splice(detailIndex, 1);
      }
    });

    this.inventariosLogicService.typeStocks = [];
    this.inventariosLogicService.typeExh = false;
    this.inventariosLogicService.typeDep = false;
    this.inventariosLogicService.productTypeStocksMap = new Map<number, number>();
    this.inventariosLogicService.setVariablesMap();

    if (this.inventariosLogicService.newClientStock.clientStockDetails.length === 0) {
      this.inventariosLogicService.cannotSendClientStock = true;
    }

    this.rebuildTableData();
  }

  imprimir() {

    console.log(this.inventariosLogicService);



  }


}
