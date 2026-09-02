import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { Subject } from 'rxjs';

import { VisitaComponent } from './visita.component';
import { DateServiceService } from '../../services/dates/date-service.service';
import { VisitasService } from '../visitas.service';
import { ServicesService } from '../../services/services.service';
import { SynchronizationDBService } from '../../services/synchronization/synchronization-db.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { GeolocationService } from 'src/app/services/geolocation/geolocation.service';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { AutoSendService } from 'src/app/services/autoSend/auto-send.service';
import { AdjuntoService } from 'src/app/adjuntos/adjunto.service';
import { ClienteSelectorService } from 'src/app/cliente-selector/cliente-selector.service';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { ClientLocationService } from 'src/app/services/clientes/locationClient/client-location.service';
import { ClientesDatabaseServicesService } from 'src/app/services/clientes/clientes-database-services.service';
import { Visit } from 'src/app/modelos/tables/visit';
import {
  VISIT_STATUS_SAVED,
  VISIT_STATUS_TO_SEND,
  VISIT_STATUS_VISITED,
} from 'src/app/utils/appConstants';

describe('VisitaComponent', () => {
  let component: VisitaComponent;
  let fixture: ComponentFixture<VisitaComponent>;
  let dateServ: jasmine.SpyObj<DateServiceService>;
  let visitServ: { visit: Visit };

  const buildVisit = (overrides: Partial<Visit> = {}): Visit => ({
    idVisit: 1,
    coVisit: 'V001',
    stVisit: VISIT_STATUS_SAVED,
    daVisit: '2026-08-03 00:00:00',
    coordenada: '',
    idClient: 1,
    coClient: 'C001',
    naClient: 'Cliente',
    nuSequence: 1,
    idUser: 1,
    coUser: 'U001',
    coEnterprise: 'E001',
    idEnterprise: 1,
    visitDetails: [],
    daInitial: '',
    daReal: '',
    idAddressClient: 1,
    coAddressClient: 'A001',
    coordenadaSaved: false,
    hasAttachments: false,
    nuAttachments: 0,
    isDispatched: false,
    noDispatchedMotive: '',
    isReassigned: false,
    txReassignedMotive: '',
    daReassign: '',
    isVisited: false,
    ...overrides,
  });

  beforeEach(waitForAsync(() => {
    dateServ = jasmine.createSpyObj('DateServiceService', [
      'formatComplete',
      'formatShort',
      'hoyISO',
      'hoyISOFullTime',
    ]);
    dateServ.formatComplete.and.callFake((value: string) => `complete:${value}`);
    dateServ.formatShort.and.callFake((value: string) => `short:${value}`);
    dateServ.hoyISO.and.returnValue('2026-08-03T00:00:00');
    dateServ.hoyISOFullTime.and.returnValue('2026-08-03 10:00:00');

    visitServ = {
      visit: buildVisit(),
    };

    const adjuntoServiceMock = {
      signatureChanged: new Subject<void>(),
      AttachmentChanged: new Subject<void>(),
      AttachmentWeightExceeded: new Subject<void>(),
      setup: jasmine.createSpy('setup'),
      hasItems: () => false,
      getNuAttachment: () => 0,
      tieneFirma: () => false,
    };

    TestBed.configureTestingModule({
      declarations: [VisitaComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DateServiceService, useValue: dateServ },
        { provide: VisitasService, useValue: visitServ },
        { provide: ServicesService, useValue: {} },
        { provide: SynchronizationDBService, useValue: { getDatabase: () => null } },
        { provide: MessageService, useValue: { hideLoading: () => undefined } },
        { provide: GeolocationService, useValue: {} },
        {
          provide: EnterpriseService,
          useValue: { setup: () => Promise.resolve(), empresas: [] },
        },
        { provide: AutoSendService, useValue: {} },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: Platform, useValue: {
          backButton: {
            subscribeWithPriority: () => new Subject<void>().subscribe(),
          },
        } },
        { provide: Location, useValue: { back: jasmine.createSpy('back') } },
        { provide: AdjuntoService, useValue: adjuntoServiceMock },
        { provide: ClienteSelectorService, useValue: { ClientChanged: new Subject<void>() } },
        {
          provide: ClientLogicService,
          useValue: { clientLocationComponent: false, getTags: () => undefined },
        },
        { provide: ClientLocationService, useValue: {} },
        { provide: ClientesDatabaseServicesService, useValue: {} },
      ],
    })
      .overrideComponent(VisitaComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(VisitaComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('visitDateButtonLabel', () => {
    it('shows da_visit without time when visit is not started from web', () => {
      visitServ.visit = buildVisit({
        daVisit: '2026-08-03T00:00:00',
        daInitial: '',
        daReal: '',
      });
      component.fromWeb = true;
      component.initialLock = true;
      component.fechaInitial = '';
      component.fechaVisita = '2026-08-03T00:00:00';

      expect(component.visitDateButtonLabel).toBe('short:2026-08-03 00:00:00');
      expect(dateServ.formatShort).toHaveBeenCalledWith('2026-08-03 00:00:00');
    });

    it('shows da_initial with time after visit is started', () => {
      visitServ.visit = buildVisit({
        daVisit: '2026-08-03 00:00:00',
        daInitial: '2026-08-03 09:15:00',
        daReal: '',
      });
      component.fromWeb = true;
      component.initialLock = false;
      component.fechaInitial = '2026-08-03 09:15:00';

      expect(component.visitDateButtonLabel).toBe('complete:2026-08-03 09:15:00');
      expect(dateServ.formatComplete).toHaveBeenCalledWith('2026-08-03 09:15:00');
    });

    it('shows da_real with time when visit was sent', () => {
      visitServ.visit = buildVisit({
        daVisit: '2026-08-03 00:00:00',
        daInitial: '2026-08-03 09:15:00',
        daReal: '2026-08-03T11:30:00',
        stVisit: VISIT_STATUS_TO_SEND,
      });
      component.fechaInitial = '2026-08-03 09:15:00';

      expect(component.visitDateButtonLabel).toBe('complete:2026-08-03 11:30:00');
      expect(dateServ.formatComplete).toHaveBeenCalledWith('2026-08-03 11:30:00');
    });

    it('shows da_real with time when visit status is visited even if only status changed', () => {
      visitServ.visit = buildVisit({
        daVisit: '2026-08-03 00:00:00',
        daInitial: '2026-08-03 09:15:00',
        daReal: '2026-08-03T12:00:00',
        stVisit: VISIT_STATUS_VISITED,
      });

      expect(component.visitDateButtonLabel).toBe('complete:2026-08-03 12:00:00');
    });
  });
});
