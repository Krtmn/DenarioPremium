import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CobrosDocumentComponent } from './cobro-documents.component';
import { CollectionService } from 'src/app/services/collection/collection-logic.service';
import { ClienteSelectorService } from 'src/app/cliente-selector/cliente-selector.service';
import { GlobalConfigService } from 'src/app/services/globalConfig/global-config.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';

describe('CobrosDocumentComponent', () => {
  let component: CobrosDocumentComponent;
  let fixture: ComponentFixture<CobrosDocumentComponent>;
  let collectServiceMock: any;

  beforeEach(waitForAsync(() => {
    collectServiceMock = {
      documentSales: [],
      documentSalesBackup: [],
      documentSalesView: [],
      documentSalesPageIds: new Set<number>(),
      documentsSaleComponent: false,
      isPaymentPartial: false,
      alwaysPartialPayment: false,
      isChangePaymentPartialPersistence: false,
      collection: {
        collectionDetails: [],
      },
      documentSaleOpen: null,
      collectionTags: new Map(),
      collectionTagsDenario: new Map([['DENARIO_BOTON_ACEPTAR', 'Aceptar']]),
    };

    TestBed.configureTestingModule({
      declarations: [CobrosDocumentComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: CollectionService, useValue: collectServiceMock },
        { provide: ClienteSelectorService, useValue: {} },
        { provide: GlobalConfigService, useValue: { get: () => undefined } },
        { provide: CurrencyService, useValue: { formatNumber: (n: number) => String(n) } },
        {
          provide: DateServiceService,
          useValue: { hoyISO: () => '2026-08-04' },
        },
        { provide: SynchronizationDBService, useValue: { getDatabase: () => ({}) } },
        { provide: ClientLogicService, useValue: {} },
        { provide: MessageService, useValue: {} },
        {
          provide: ChangeDetectorRef,
          useValue: { detectChanges: () => undefined, markForCheck: () => undefined },
        },
      ],
    })
      .overrideComponent(CobrosDocumentComponent, { set: { template: '' } })
      .compileComponents();

    spyOn(CobrosDocumentComponent.prototype, 'ngOnInit').and.stub();
    spyOn(CobrosDocumentComponent.prototype, 'ngAfterViewInit').and.stub();
    fixture = TestBed.createComponent(CobrosDocumentComponent);
    component = fixture.componentInstance;
    (component as any).cdr = {
      detectChanges: () => undefined,
      markForCheck: () => undefined,
    };
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('P2: applyDocumentFilter keeps only page docs matching currency', () => {
    collectServiceMock.documentSales = [
      { idDocument: 1, coCurrency: 'USD' },
      { idDocument: 2, coCurrency: 'VES' },
      { idDocument: 3, coCurrency: 'USD' },
    ] as DocumentSale[];
    collectServiceMock.documentSalesPageIds = new Set([1, 2]);

    (component as any).applyDocumentFilter('USD', false);

    expect(component.filteredDocumentsView.map(d => d.idDocument)).toEqual([1]);
    expect(collectServiceMock.documentsSaleComponent).toBeTrue();
  });

  it('P2: syncDocumentPaymentPartialState marks detail and document as partial', () => {
    collectServiceMock.documentSales = [{
      idDocument: 9,
      inPaymentPartial: false,
      positionCollecDetails: 0,
    }] as DocumentSale[];
    collectServiceMock.documentSalesBackup = [{
      idDocument: 9,
      inPaymentPartial: false,
    }] as DocumentSale[];
    collectServiceMock.documentSalesView = [{
      idDocument: 9,
      inPaymentPartial: false,
    }] as DocumentSale[];
    collectServiceMock.collection.collectionDetails = [{
      idDocument: 9,
      inPaymentPartial: false,
    }];
    collectServiceMock.documentSaleOpen = {
      idDocument: 9,
      inPaymentPartial: false,
      positionCollecDetails: 0,
    };

    (component as any).syncDocumentPaymentPartialState(0, 0, true);

    expect(collectServiceMock.isPaymentPartial).toBeTrue();
    expect(collectServiceMock.documentSales[0].inPaymentPartial).toBeTrue();
    expect(collectServiceMock.collection.collectionDetails[0].inPaymentPartial).toBeTrue();
    expect(collectServiceMock.documentSaleOpen.inPaymentPartial).toBeTrue();
  });
});
