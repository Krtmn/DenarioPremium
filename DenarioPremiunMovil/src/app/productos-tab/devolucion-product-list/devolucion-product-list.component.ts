import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ReturnDetail } from 'src/app/modelos/tables/ReturnDetail';
import { MessageAlert } from 'src/app/modelos/tables/messageAlert';
import { ReturnMotive } from 'src/app/modelos/tables/returnMotive';
import { Unit } from 'src/app/modelos/tables/unit';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ProductStructureService } from 'src/app/services/productStructures/product-structure.service';
import { ReturnLogicService } from 'src/app/services/returns/return-logic.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
  selector: 'devolucion-product-list',
  templateUrl: './devolucion-product-list.component.html',
  styleUrls: ['./devolucion-product-list.component.scss'],
  standalone: false
})
export class DevolucionProductListComponent implements OnInit, OnDestroy {

  productStructureService = inject(ProductStructureService);
  returnLogic = inject(ReturnLogicService);
  messageService = inject(MessageService);
  db = inject(SynchronizationDBService);
  dateServ = inject(DateServiceService);

  showReturnDetail: Boolean = true;
  tags = new Map<string, string>([]);
  productListSub: any;
  productListCartSub: any;
  productList: ReturnDetail[] = [];
  returnMotives: ReturnMotive[] = [];
  selectedDate: string = '';

  messageAlert!: MessageAlert;

  constructor() { }

  ngOnInit() {
    this.selectedDate = this.dateServ.onlyDateHoyISO();
    this.messageService.showLoading().then(() => {
      this.getTags();
      this.syncProductListFromService();
      this.returnMotives = this.returnLogic.returnMotives;
      this.productListSub = this.productStructureService.productStructures.subscribe((data) => {
        this.showReturnDetail = !data;
      });
    });

    this.productListCartSub = this.returnLogic.productListCart.subscribe((data) => {
      this.productList = data;
      this.hydrateProductListUnits();
    });
  }

  private syncProductListFromService(): void {
    this.productList = this.returnLogic.productList;
    this.hydrateProductListUnits();
  }

  private hydrateProductListUnits(): void {
    if (!Array.isArray(this.productList)) {
      return;
    }

    for (const product of this.productList) {
      const savedUnit = product.unit ?? this.buildUnitFromDetailFields(product);
      if ((!Array.isArray(product.productUnits) || product.productUnits.length === 0) && this.hasUnitLabel(savedUnit)) {
        product.productUnits = [savedUnit];
      }

      if (savedUnit && (!product.unit || !this.hasUnitLabel(product.unit))) {
        product.unit = savedUnit;
      }

      product.idUnit = Number(product.idUnit ?? product.unit?.idUnit ?? 0);
    }
  }

  private buildUnitFromDetailFields(product: ReturnDetail): Unit {
    return {
      idUnit: Number(product.idUnit ?? 0),
      coUnit: product.coMeasureUnit ?? product.unit?.coUnit ?? '',
      naUnit: product.naMeasureUnit ?? product.unit?.naUnit ?? '',
      quUnit: Number(product.unit?.quUnit ?? 0),
      idProductUnit: Number(product.unit?.idProductUnit ?? 0),
      coProductUnit: product.unit?.coProductUnit ?? '',
      coEnterprise: product.unit?.coEnterprise ?? '',
      idEnterprise: Number(product.unit?.idEnterprise ?? 0),
    } as Unit;
  }

  private hasUnitLabel(unit: Unit | undefined): boolean {
    return !!String(unit?.naUnit ?? '').trim() || !!String(unit?.coUnit ?? '').trim() || Number(unit?.idUnit ?? 0) > 0;
  }

  compareUnitId = (first: number | string | null | undefined, second: number | string | null | undefined): boolean => {
    return Number(first ?? 0) === Number(second ?? 0);
  };

  trackByCoReturnDetail = (_index: number, product: ReturnDetail): string => {
    return product.coReturnDetail || `${product.idProduct}-${_index}`;
  };

  getTags() {
    this.tags = this.returnLogic.tags;
    this.messageService.hideLoading();
  }

  ngOnDestroy(): void {
    this.productListSub?.unsubscribe();
    this.productListCartSub?.unsubscribe();
  }

  removeProduct(index: number) {
    this.returnLogic.removeProductDev(index);
    this.syncProductListFromService();
  }

  onOpenCalendar(index: number) {
    this.productList[index].daDueDate = '';
  }

  datePick(index: number) {
    console.log('daDueDate ' + this.productList[index].daDueDate);
  }

  dateFormat(date: string | null) {
    if (date != null) {
      return this.dateServ.formatShort(date);
    }
    return 'Seleccione Fecha';
  }

  onValidateUnitChanged(product: ReturnDetail, listIndex: number) {
    if (this.returnLogic.validateReturn) {
      const validateUnit = this.returnLogic.newReturn.invoicedetailUnits.find(
        (inv) => inv.idProductUnit === product.unit?.idProductUnit,
      );
      if (product.quProduct < 1 || product.quProduct > validateUnit!.quUnit) {
        this.messageAlert = new MessageAlert(
          this.tags.get('DENARIO_DEV')!,
          this.tags.get('DEV_INVALID_QU_UNIT')! + ' ' + validateUnit!.quUnit,
        );
        this.messageService.alertModal(this.messageAlert);
      }
    }
    this.notifyProductEdited();
  }

  changeProductUnit(index: number, idUnit: number) {
    const normalizedId = Number(idUnit ?? 0);
    this.productList[index].idUnit = normalizedId;
    this.productList[index].unit = this.productList[index].productUnits.find(
      (pu) => Number(pu.idUnit) === normalizedId,
    );
    this.notifyProductEdited();
  }

  setShowDateModal(i: number, val: boolean) {
    this.productList[i].showDateModal = val;
  }

  formatShort(date: string | null) {
    if (date != null) {
      return this.dateServ.formatShort(date);
    }
    return this.tags.get('DENARIO_DEV_DATE');
  }

  updateSendButtonState(): void {
    if (!this.returnLogic.requeridedNroFactura && !this.returnLogic.validateReturn) {
      for (const element of this.productList) {
        if ((element.coDocument ?? '').trim() === '') {
          element.coDocument = '0';
        }
      }
    }
    this.notifyProductEdited();
  }

  shouldShowProductSendError(index: number): boolean {
    return this.returnLogic.isReturnProductLineIncomplete(index);
  }

  private notifyProductEdited(): void {
    this.returnLogic.notifyReturnEdited();
  }

  cleanString(str: string): string {
    str = str.replace(/;/g, '');
    str = str.replace(/'/g, '');
    str = str.replace(/"/g, '');
    return str;
  }

  cleanInput(input: string | null | undefined | number): string {
    this.updateSendButtonState();
    if (!input) {
      return '';
    }
    return this.cleanString(input.toString());
  }

}
