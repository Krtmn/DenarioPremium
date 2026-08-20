import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { Subject } from 'rxjs';

import { VisitasComponent } from './visitas.component';
import { VisitasService } from './visitas.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { GeolocationService } from '../services/geolocation/geolocation.service';
import { DateServiceService } from '../services/dates/date-service.service';

describe('VisitasComponent', () => {
  let component: VisitasComponent;
  let fixture: ComponentFixture<VisitasComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VisitasComponent ],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: VisitasService,
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
          provide: Platform,
          useValue: {
            backButton: {
              subscribeWithPriority: () => new Subject<void>().subscribe(),
            },
          },
        },
      ],
    })
      .overrideComponent(VisitasComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(VisitasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
