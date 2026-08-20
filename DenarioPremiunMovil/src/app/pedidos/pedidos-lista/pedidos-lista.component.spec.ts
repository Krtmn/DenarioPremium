import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { Subject } from 'rxjs';

import { PedidosListaComponent } from './pedidos-lista.component';
import { PedidosService } from '../pedidos.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';

describe('PedidosListaComponent', () => {
  let component: PedidosListaComponent;
  let fixture: ComponentFixture<PedidosListaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PedidosListaComponent ],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: PedidosService,
          useValue: {
            coordenadas: '',
            userMustActivateGPS: false,
            rolTransportista: false,
            tags: new Map<string, string>([['PED_NOMBRE_MODULO', 'Pedidos']]),
            getTag: function (this: { tags: Map<string, string> }, tag: string) {
              return this.tags.get(tag) ?? tag;
            },
            getListaPedidos: () => undefined,
            itemListPedidos: [],
          },
        },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: MessageService, useValue: {} },
        { provide: GeolocationService, useValue: { getCurrentPosition: () => Promise.resolve('') } },
        {
          provide: DateServiceService,
          useValue: { onlyDateHoyISO: () => '2026-08-03' },
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
      .overrideComponent(PedidosListaComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(PedidosListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
