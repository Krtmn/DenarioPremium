import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { Subject } from 'rxjs';

import { PedidosComponent } from './pedidos.component';
import { PedidosService } from './pedidos.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { GeolocationService } from '../services/geolocation/geolocation.service';
import { EnterpriseService } from '../services/enterprise/enterprise.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { ProductStructureService } from '../services/productStructures/product-structure.service';
import { DateServiceService } from '../services/dates/date-service.service';

describe('PedidosComponent', () => {
  let component: PedidosComponent;
  let fixture: ComponentFixture<PedidosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PedidosComponent ],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: PedidosService,
          useValue: {
            coordenadas: '',
            userMustActivateGPS: false,
            getTags: () => undefined,
            getLists: () => undefined,
            getConfiguration: () => undefined,
          },
        },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: MessageService, useValue: { showLoading: () => Promise.resolve() } },
        { provide: GeolocationService, useValue: { getCurrentPosition: () => Promise.resolve('') } },
        { provide: DateServiceService, useValue: {} },
        {
          provide: EnterpriseService,
          useValue: {
            setup: () => Promise.resolve(),
            defaultEnterprise: () => ({ idEnterprise: 1 }),
          },
        },
        {
          provide: SynchronizationDBService,
          useValue: { getDatabase: () => ({}) },
        },
        {
          provide: ProductStructureService,
          useValue: {},
        },
        {
          provide: Platform,
          useValue: {
            backButton: {
              subscribeWithPriority: () => new Subject<void>().subscribe(),
            },
          },
        },
      ],
    })
      .overrideComponent(PedidosComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(PedidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
