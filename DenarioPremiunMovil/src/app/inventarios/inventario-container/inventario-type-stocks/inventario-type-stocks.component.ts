import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ProductUtil } from 'src/app/modelos/ProductUtil';
import { Inventarios } from 'src/app/modelos/inventarios';
import { ClientStocksDetail, ClientStocksDetailUnits } from 'src/app/modelos/tables/client-stocks';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { InventariosLogicService } from 'src/app/services/inventarios/inventarios-logic.service';

@Component({
  selector: 'app-inventario-type-stocks',
  templateUrl: './inventario-type-stocks.component.html',
  styleUrls: ['./inventario-type-stocks.component.scss'],
  standalone: false
})
export class InventarioTypeStocksComponent implements OnInit {


  public inventariosLogicService = inject(InventariosLogicService)
  public dateServ = inject(DateServiceService);
  public globalConfig = inject(GlobalConfigService);
  public minFecha = '1900-01-01';
  public maxFecha = '9999-12-31';
  @ViewChild('loteExhInput', { static: false })
  loteExhInput: any;

  @ViewChild('loteDepInput', { static: false })
  loteDepInput: any;


  public typeStockMethod: string = "";
  public expirationBatch: Boolean = false;
  public showEventModal: Boolean = false;


  constructor() { }

  ngOnInit() {
    this.expirationBatch = this.globalConfig.get('expirationBatch') === 'true' ? true : false;
  }


  deleteTypeStock(indexType: number, indexProduct: number, type: string, prod: ProductUtil) {
    let notMoreIdp = true;
    //borrar de typstocks
    this.inventariosLogicService.typeExh = false;
    this.inventariosLogicService.typeDep = false;

    //ELIMINO TODOS LOS REGISTROS DE ESE PRODUCTO     

    let indexClientStockDetail = this.inventariosLogicService.productTypeStocksMap.get(this.inventariosLogicService.productSelected.idProduct)
    if (this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!] != undefined) {
      if (this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!].clientStockDetailUnits != undefined) {
        this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!].clientStockDetailUnits.splice(indexType, 1);
      } else {
        this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!].clientStockDetailUnits.splice(indexType, 1);
      }
      //si no quedan mas detailunits elimino el detail
      if (this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!].clientStockDetailUnits.length < 1) {
        this.inventariosLogicService.newClientStock.clientStockDetails.splice(indexClientStockDetail!, 1);
      }
    }

    this.inventariosLogicService.typeStocks.splice(indexType, 1);

    for (var j = 0; j < this.inventariosLogicService.typeStocks.length; j++) {
      if (this.inventariosLogicService.typeStocks[j].idProduct == indexProduct) {
        notMoreIdp = false;
      }
      if (this.inventariosLogicService.typeStocks[j].tipo == "exh")
        this.inventariosLogicService.typeExh = true;
      else
        this.inventariosLogicService.typeDep = true;
    }

    if (this.inventariosLogicService.newClientStock.clientStockDetails.length == 0) {
      this.inventariosLogicService.onStockValidToSend(false);
    }

    if (notMoreIdp)
      this.inventariosLogicService.productTypeStocksMap.delete(this.inventariosLogicService.productSelected.idProduct);
    //    this.inventariosLogicService.setVariablesMap();

  }



  setNewDetail(cantidad: any, idP: number, indexTypeStocks: number, type: string) {
    let indexDetail = this.inventariosLogicService.productTypeStocksMap.get(this.inventariosLogicService.productSelected.idProduct)
    indexDetail = indexDetail == undefined ? 0 : indexDetail;
    this.inventariosLogicService.productTypeStocksMap.set(idP, indexDetail);
    /* for (var i = 0; i < this.inventariosLogicService.typeStocks.length; i++) {
      if (this.inventariosLogicService.typeStocks[i].idProduct == this.inventariosLogicService.productSelected.idProduct) {
        this.inventariosLogicService.typeStocks[i].validateCantidad = true
      }
    } */

    if (this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!] == undefined) {
      let index = this.inventariosLogicService.productSelectedIndex;
      let clientStockDetail = {} as ClientStocksDetail;
      clientStockDetail.idClientStockDetail = 0;
      clientStockDetail.coClientStockDetail = this.dateServ.generateCO(0);
      clientStockDetail.coClientStock = this.inventariosLogicService.newClientStock.coClientStock;
      clientStockDetail.idProduct = this.inventariosLogicService.newClientStock.productList[index].idProduct;
      clientStockDetail.coProduct = this.inventariosLogicService.newClientStock.productList[index].coProduct;
      clientStockDetail.naProduct = this.inventariosLogicService.newClientStock.productList[index].naProduct;
      clientStockDetail.coEnterprise = this.inventariosLogicService.newClientStock.coEnterprise;
      clientStockDetail.idEnterprise = this.inventariosLogicService.newClientStock.idEnterprise;
      clientStockDetail.posicion = 0;
      clientStockDetail.isEdit = true;
      clientStockDetail.isSave = true;
      clientStockDetail.clientStockDetailUnits = [] as ClientStocksDetailUnits[]
      this.inventariosLogicService.newClientStock.clientStockDetails.push(clientStockDetail);
      this.inventariosLogicService.typeStocks[indexTypeStocks!].clientStockDetail.push(clientStockDetail)

      let clientStockDetailUnits = {} as ClientStocksDetailUnits;
      clientStockDetailUnits.idClientStockDetailUnit = 0;
      clientStockDetailUnits.coClientStockDetailUnit = this.dateServ.generateCO(1);
      clientStockDetailUnits.coClientStockDetail = clientStockDetail.coClientStockDetail
      clientStockDetailUnits.idProductUnit = this.inventariosLogicService.unitSelected.idProductUnit;
      clientStockDetailUnits.coProductUnit = this.inventariosLogicService.unitSelected.coProductUnit;
      clientStockDetailUnits.idUnit = this.inventariosLogicService.unitSelected.idUnit;
      clientStockDetailUnits.coUnit = this.inventariosLogicService.unitSelected.coUnit;
      clientStockDetailUnits.quUnit = this.inventariosLogicService.unitSelected.quUnit;
      clientStockDetailUnits.naUnit = this.inventariosLogicService.unitSelected.naUnit;
      clientStockDetailUnits.quStock = Number(cantidad);
      clientStockDetailUnits.quSuggested = 0;
      clientStockDetailUnits.coEnterprise = this.inventariosLogicService.newClientStock.coEnterprise;
      clientStockDetailUnits.idEnterprise = this.inventariosLogicService.newClientStock.idEnterprise;
      clientStockDetailUnits.ubicacion = type;
      clientStockDetailUnits.isEdit = true
      clientStockDetailUnits.isSave = true;
      clientStockDetailUnits.posicion = 0;
      clientStockDetailUnits.nuBatch = "";
      clientStockDetailUnits.daExpiration = this.inventariosLogicService.typeStocks[indexTypeStocks].fechaVencimiento;

      let indexDetailUnit = this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!].clientStockDetailUnits.length;

      if (indexDetailUnit < 0)
        indexDetailUnit = 0;
      /* if (this.inventariosLogicService.typeStocks[indexDetail!].clientStockDetail[0!].clientStockDetailUnits[asd1] == undefined) */
      this.inventariosLogicService.typeStocks[indexTypeStocks!].clientStockDetail[0!].clientStockDetailUnits.push(clientStockDetailUnits)

      if (this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!].clientStockDetailUnits[indexDetailUnit] == undefined)
        this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!].clientStockDetailUnits.push(clientStockDetailUnits);

      if (!this.expirationBatch) {
        this.inventariosLogicService.onStockValidToSend(true);
        this.inventariosLogicService.onStockValidToSave(true);

      }
    }
    this.inventariosLogicService.checkImageWeightLimit();
  }


  setNewDetailUnit(cantidad: any, indexProduct: number, indexType: number, type: string) {

    let index = this.inventariosLogicService.productSelectedIndex;
    let clientStockDetail = {} as ClientStocksDetail;
    clientStockDetail.idClientStockDetail = 0;
    clientStockDetail.coClientStockDetail = this.dateServ.generateCO(0);
    clientStockDetail.coClientStock = this.inventariosLogicService.newClientStock.coClientStock;
    clientStockDetail.idProduct = this.inventariosLogicService.newClientStock.productList[index].idProduct;
    clientStockDetail.coProduct = this.inventariosLogicService.newClientStock.productList[index].coProduct;
    clientStockDetail.naProduct = this.inventariosLogicService.newClientStock.productList[index].naProduct;
    clientStockDetail.coEnterprise = this.inventariosLogicService.newClientStock.coEnterprise;
    clientStockDetail.idEnterprise = this.inventariosLogicService.newClientStock.idEnterprise;
    clientStockDetail.posicion = 0;
    clientStockDetail.isEdit = true;
    clientStockDetail.isSave = true;
    clientStockDetail.clientStockDetailUnits = [] as ClientStocksDetailUnits[]
    //this.inventariosLogicService.newClientStock.clientStockDetails.push(clientStockDetail);
    this.inventariosLogicService.typeStocks[indexType!].clientStockDetail.push(clientStockDetail)

    let clientStockDetailUnits = {} as ClientStocksDetailUnits;
    clientStockDetailUnits.idClientStockDetailUnit = 0;
    clientStockDetailUnits.coClientStockDetailUnit = this.dateServ.generateCO(1);
    clientStockDetailUnits.coClientStockDetail = this.inventariosLogicService.newClientStock.clientStockDetails[indexProduct].coClientStockDetail;
    clientStockDetailUnits.idProductUnit = this.inventariosLogicService.unitSelected.idProductUnit;
    clientStockDetailUnits.coProductUnit = this.inventariosLogicService.unitSelected.coProductUnit;
    clientStockDetailUnits.idUnit = this.inventariosLogicService.unitSelected.idUnit;
    clientStockDetailUnits.coUnit = this.inventariosLogicService.unitSelected.coUnit;
    clientStockDetailUnits.quUnit = this.inventariosLogicService.unitSelected.quUnit;
    clientStockDetailUnits.naUnit = this.inventariosLogicService.unitSelected.naUnit;
    clientStockDetailUnits.quStock = Number(cantidad);
    clientStockDetailUnits.quSuggested = 0;
    clientStockDetailUnits.coEnterprise = this.inventariosLogicService.newClientStock.coEnterprise;
    clientStockDetailUnits.idEnterprise = this.inventariosLogicService.newClientStock.idEnterprise;
    clientStockDetailUnits.ubicacion = type;
    clientStockDetailUnits.isEdit = true
    clientStockDetailUnits.isSave = true;
    clientStockDetailUnits.posicion = 0;
    clientStockDetailUnits.nuBatch = "";
    clientStockDetailUnits.daExpiration = this.inventariosLogicService.typeStocks[indexType].fechaVencimiento;
    this.inventariosLogicService.typeStocks[indexType!].clientStockDetail[0!].clientStockDetailUnits.push(clientStockDetailUnits)
    let indexDetailUnit = this.inventariosLogicService.newClientStock.clientStockDetails[indexProduct!].clientStockDetailUnits.length;
    if (indexDetailUnit < 0)
      indexDetailUnit = 0


    if (this.inventariosLogicService.newClientStock.clientStockDetails[indexProduct!].clientStockDetailUnits[indexDetailUnit] == undefined)
      this.inventariosLogicService.newClientStock.clientStockDetails[indexProduct!].clientStockDetailUnits.push(clientStockDetailUnits);

    if (!this.expirationBatch) {
      this.inventariosLogicService.onStockValidToSend(true);
      this.inventariosLogicService.onStockValidToSave(true);

    }
    this.inventariosLogicService.checkImageWeightLimit();
  }

  addClientStocktMethod(typeStock: string, index: number, product: any) {
    console.log(this.typeStockMethod)
    switch (typeStock) {
      case "exh": {

        let newTypeStock: Inventarios = {} as Inventarios;
        newTypeStock.tipo = "exh";
        newTypeStock.idProduct = product.idProduct;
        newTypeStock.fechaVencimiento = this.dateServ.hoyISO();;
        newTypeStock.validateCantidad = false;
        newTypeStock.validateLote = false;
        newTypeStock.showDateModalDep = false;
        newTypeStock.showDateModalExh = false;
        newTypeStock.clientStockDetail = [] as ClientStocksDetail[]
        this.inventariosLogicService.typeStocks.push(newTypeStock);
        this.inventariosLogicService.typeExh = true;
        this.typeStockMethod = "";
        break;
      }

      case "dep": {
        let newTypeStock: Inventarios = {} as Inventarios;
        newTypeStock.tipo = "dep";
        newTypeStock.idProduct = product.idProduct;
        newTypeStock.fechaVencimiento = this.dateServ.hoyISO();;
        newTypeStock.validateCantidad = false;
        newTypeStock.validateLote = false;
        newTypeStock.showDateModalDep = false;
        newTypeStock.showDateModalExh = false;
        newTypeStock.clientStockDetail = [] as ClientStocksDetail[]
        this.inventariosLogicService.typeStocks.push(newTypeStock);
        this.inventariosLogicService.typeDep = true;
        this.typeStockMethod = "";
        break;
      }
    }
    this.setNewDetail(0, product.idProduct, index, typeStock)
  }

  setLote(lote: any, indexType: number, idP: number, type: string) {
    let indexDetail = this.inventariosLogicService.productTypeStocksMap.get(idP)

    lote.target.value = this.cleanString(lote.target.value);

    if (lote.target.value.length === 0) {
      this.inventariosLogicService.typeStocks[indexType].validateLote = false;
      this.inventariosLogicService.onStockValidToSend(false);
      this.inventariosLogicService.onStockValidToSave(false);
      return;
    }
    this.inventariosLogicService.typeStocks[indexType].validateLote = true;
    this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!].clientStockDetailUnits[indexType].nuBatch = lote.target.value;

    this.inventariosLogicService.onStockValidToSend(true);
    this.inventariosLogicService.onStockValidToSave(true);
    this.inventariosLogicService.isEdit = true;

  }

  setCantidad(cantidad: any, idP: number, indexType: number, type: string) {
    if (cantidad.target.value > 0) {
      this.inventariosLogicService.typeStocks[indexType].validateCantidad = true;
      this.inventariosLogicService.isEdit = true;
      let indexClientStockDetail = this.inventariosLogicService.productTypeStocksMap.get(idP)
      indexClientStockDetail = indexClientStockDetail == undefined ? 0 : indexClientStockDetail;

      //NO EXISTE EL DETAIL, SE DEBE CREAR
      if (this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!] == undefined)
        this.setNewDetail(cantidad.target.value, idP, indexType, type)
      else {
        console.log("YA EXISTE EL DETAIL")
        //EXISTE EL DETAILUNIT????
        let length = 0
        for (var i = 0; i < this.inventariosLogicService.typeStocks.length; i++) {
          if (this.inventariosLogicService.typeStocks[i].idProduct == idP) {
            length++;
          }
        }
        length--;

        if (this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!].clientStockDetailUnits[length] == undefined) {
          //ES NUEVO DETAILUNIT, SE DEBE CREAR
          this.setNewDetailUnit(cantidad.target.value, indexClientStockDetail!, indexType, type);
        } else {
          //EXISTEDETAILUNIT DEBO CAMBIAR SOLO LA CANTIDAD
          /*  //this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!].clientStockDetailUnits[length].quStock = cantidad.target.value;
           for (var i = 0; i < this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!].clientStockDetailUnits.length; i++) {
             if (this.inventariosLogicService.typeStocks[indexType].clientStockDetail[0].clientStockDetailUnits[0].coClientStockDetailUnit ==
               this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!].clientStockDetailUnits[i].coClientStockDetailUnit) {
               this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!].clientStockDetailUnits[i].quStock = Number(cantidad.target.value);
             }
           } */
          this.inventariosLogicService.newClientStock.clientStockDetails[indexClientStockDetail!].clientStockDetailUnits[indexType].quStock = Number(cantidad.target.value);
        }
        //this.setExistCantidad(cantidad.target.value, indexProduct, indexType, type);
      }

    } else {
      //NO PUEDE COLOCAR CANTIDAD MENOR A 0
      console.warn("CANTIDAD MENOR A 0 NO ES PERMITIDA");
      this.inventariosLogicService.typeStocks[indexType].validateCantidad = false;
    }
  }

  getFechaValor(fecha: string, indexType: number, indexProduct: number, type: string) {
    let indexDetail = this.inventariosLogicService.productTypeStocksMap.get(this.inventariosLogicService.productSelected.idProduct)
    for (var i = 0; i < this.inventariosLogicService.typeStocks.length; i++) {
      if (this.inventariosLogicService.typeStocks[i].idProduct == this.inventariosLogicService.productSelected.idProduct) {
        this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!].clientStockDetailUnits![indexType].daExpiration = fecha
        this.inventariosLogicService.isEdit = true;
      }
    }
  }

  setShowDateModalExh(i: number, val: boolean) {
    this.inventariosLogicService.typeStocks[i]
      .showDateModalExh = val;
  }

  setShowDateModalDep(i: number, val: boolean) {
    this.inventariosLogicService.typeStocks[i]
      .showDateModalDep = val;
  }
  selectProducUnit(e: any, index: number, type: string) {
    let indexDetail = this.inventariosLogicService.productTypeStocksMap.get(this.inventariosLogicService.productSelected.idProduct)
    for (var i = 0; i < this.inventariosLogicService.typeStocks.length; i++) {
      if (this.inventariosLogicService.typeStocks[i].idProduct == this.inventariosLogicService.productSelected.idProduct) {
        this.inventariosLogicService.typeStocks[i].unidad = e.target.value
        /* this.inventariosLogicService.newClientStock.clientStockDetails[indexDetail!].clientStockDetailUnits![index].daExpiration = e.target.value */
        this.inventariosLogicService.isEdit = true;
      }
    }
    this.inventariosLogicService.unitSelected = e.target.value
  }

  setShowEventModal(value: boolean) {
    this.showEventModal = value;
    // Si se está abriendo el modal, limpiar selección
    if (value) {
      this.inventariosLogicService.tiposPago.forEach(tp => tp.selected = false);
    }
  }

  onAceptarTiposPago() {
    // Obtiene todos los tipos de pago seleccionados
    const seleccionados = this.inventariosLogicService.tiposPago.filter(tp => tp.selected);
    // Llama a addCollectMethod por cada tipo seleccionado
    seleccionados.forEach(tp => this.addInventarioMethod({ target: { value: tp } }));
    this.setShowEventModal(false);
  }

  addInventarioMethod(e: any) {
    this.showEventModal = true;
    this.addClientStocktMethod(e.target.value.type,
      this.inventariosLogicService.typeStocks.length == 0 ? 0 : this.inventariosLogicService.typeStocks.length,
      this.inventariosLogicService.productSelected)
    //this.addClientStocktMethod(e.target.value.type);
  }

  onSelectTipoPago(tipoSeleccionado: any, type: number) {
    // Solo uno puede estar seleccionado
    this.inventariosLogicService.tiposPago.forEach(tp => tp.selected = false);
    tipoSeleccionado.selected = true;
  }

  compareWith(o1: any, o2: any) {
    return "";
    /* return o1 && o2 ? o1.id === o2.id : o1 === o2; */
  }

  cleanString(str: string): string {
    // Elimina espacios al principio y al final
    str = str.trim();
    // Elimina ;
    str = str.replace(/;/g, '');
    // Elimina comillas simples
    str = str.replace(/'/g, '');
    // Elimina comillas dobles
    str = str.replace(/"/g, '');


    return str;
  }


  cleanLoteInput(input: string | null | undefined | number): string {
    if (!input) {
      return '';
    }
    return this.cleanString(input.toString());
  }



}