import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { Subject } from 'rxjs';

import { ListaVisitaComponent } from './lista-visita.component';
import { VisitasService } from '../visitas.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { DateServiceService } from 'src/app/services/dates/date-service.service';

describe('ListaVisitaComponent', () => {
  let component: ListaVisitaComponent;
  let fixture: ComponentFixture<ListaVisitaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListaVisitaComponent ],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: VisitasService,
          useValue: {
            coordenadas: '',
            userMustActivateGPS: false,
            rolTransportista: false,
            getTag: (tag: string) => tag,
            getVisitList: () => Promise.resolve([]),
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
      .overrideComponent(ListaVisitaComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ListaVisitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
