import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';

import { PedidoComponent } from './pedido.component';
import { OrderType } from 'src/app/modelos/tables/orderType';
import { PedidosService } from '../pedidos.service';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';
import { ProductService } from 'src/app/services/products/product.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { Location } from '@angular/common';
import { ClienteSelectorService } from 'src/app/cliente-selector/cliente-selector.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { Router } from '@angular/router';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';
import { ServicesService } from 'src/app/services/services.service';
import { AutoSendService } from 'src/app/services/autoSend/auto-send.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { PdfCreatorService } from 'src/app/services/pdf-creator/pdf-creator.service';
import { ImageServicesService } from 'src/app/services/imageServices/image-services.service';
import { Platform } from '@ionic/angular';

function buildOrderType(id: number, label: string): OrderType {
  return new OrderType(id, `CO${id}`, label, true, 'ENT', 1, false, 0, null, null, null);
}

describe('PedidoComponent', () => {
  let component: PedidoComponent;
  let fixture: ComponentFixture<PedidoComponent>;
  let orderServMock: jasmine.SpyObj<PedidosService> & { tipoOrden?: OrderType };
  let changeDetectorMock: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(waitForAsync(() => {
    orderServMock = jasmine.createSpyObj<PedidosService>('PedidosService', [
      'syncOrderTypeIvaOnProducts',
      'getTag',
      'setup',
      'productSummary',
    ]);
    Object.assign(orderServMock, {
      openOrder: false,
      orderTypeByEnterprise: true,
      carrito: [],
      cliente: { idClient: 0 },
      order: undefined,
      parteDecimal: 2,
      userMustActivateGPS: true,
      pedidoModificable: true,
      ProdSelecttags: new Map<string, string>(),
      signatureOrder: false,
    });
    orderServMock.getTag.and.returnValue('');
    orderServMock.setup.and.resolveTo(undefined);

    changeDetectorMock = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);

    TestBed.configureTestingModule({
      declarations: [PedidoComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: PedidosService, useValue: orderServMock },
        { provide: ChangeDetectorRef, useValue: changeDetectorMock },
        {
          provide: EnterpriseService,
          useValue: {
            setup: () => Promise.resolve(),
            defaultEnterprise: () => ({ idEnterprise: 1, coEnterprise: 'ENT' }),
            esMultiempresa: () => false,
            empresas: [],
          },
        },
        {
          provide: CurrencyService,
          useValue: {
            setup: () => Promise.resolve(),
            multimoneda: false,
            getCurrencyModule: () => ({ idModule: 0 }),
            getLocalCurrency: () => ({}),
            getLocalValue: () => '1',
          },
        },
        {
          provide: DateServiceService,
          useValue: {
            hoyISO: () => '2026-08-06',
            hoyISOFullTime: () => '2026-08-06 12:00:00',
            futureDaysISO: () => '2026-08-08',
            generateCO: () => 'CO-1',
          },
        },
        { provide: ProductService, useValue: { onProductStructureCLicked: () => undefined } },
        {
          provide: AdjuntoService,
          useValue: {
            setup: () => undefined,
            hasItems: () => false,
            AttachmentChanged: new Subject<void>(),
            AttachmentWeightExceeded: new Subject<void>(),
          },
        },
        { provide: Location, useValue: { back: () => undefined } },
        {
          provide: ClienteSelectorService,
          useValue: {
            ClientChanged: new Subject<any>(),
            checkClient: false,
          },
        },
        { provide: MessageService, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: SynchronizationDBService, useValue: { getDatabase: () => ({}) } },
        { provide: ServicesService, useValue: {} },
        { provide: AutoSendService, useValue: {} },
        { provide: GeolocationService, useValue: { getCurrentPosition: () => Promise.resolve('') } },
        { provide: PdfCreatorService, useValue: {} },
        { provide: ImageServicesService, useValue: {} },
        { provide: Platform, useValue: { backButton: { subscribeWithPriority: () => ({ unsubscribe: () => undefined }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PedidoComponent);
    component = fixture.componentInstance;
    component.changeDetector = changeDetectorMock;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('selectOrderTypebyEnterprise rebinds stale reference from current listaOrderTypes', () => {
    const staleType = buildOrderType(10, 'CFR');
    const currentType = buildOrderType(10, 'CFR');

    component.listaOrderTypes = [currentType];
    component.tipoOrden = staleType;

    component.selectOrderTypebyEnterprise();

    expect(component.tipoOrden).toBe(currentType);
    expect(orderServMock.tipoOrden).toBe(currentType);
    expect(orderServMock.syncOrderTypeIvaOnProducts).toHaveBeenCalled();
    expect(changeDetectorMock.detectChanges).toHaveBeenCalled();
  });

  it('selectOrderTypebyEnterprise does nothing when listaOrderTypes is empty', () => {
    component.listaOrderTypes = [];
    component.tipoOrden = buildOrderType(10, 'CFR');

    component.selectOrderTypebyEnterprise();

    expect(orderServMock.syncOrderTypeIvaOnProducts).not.toHaveBeenCalled();
    expect(changeDetectorMock.detectChanges).not.toHaveBeenCalled();
  });
});
