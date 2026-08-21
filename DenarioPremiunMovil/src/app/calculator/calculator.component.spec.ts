import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { CalculatorComponent } from './calculator.component';
import { GlobalConfigService } from '../services/globalConfig/global-config.service';
import { ConversionService } from '../services/conversion/conversion.service';

describe('CalculatorComponent', () => {
  let component: CalculatorComponent;
  let fixture: ComponentFixture<CalculatorComponent>;
  let routerMock: { url: string; events: { pipe: () => { subscribe: () => void } } };
  let globalConfigMock: jasmine.SpyObj<GlobalConfigService>;

  beforeEach(waitForAsync(() => {
    routerMock = {
      url: '/cobros',
      events: {
        pipe: () => ({
          subscribe: () => undefined,
        }),
      },
    };

    globalConfigMock = jasmine.createSpyObj<GlobalConfigService>('GlobalConfigService', ['get']);
    globalConfigMock.get.and.returnValue('true');

    TestBed.configureTestingModule({
      imports: [CalculatorComponent, IonicModule.forRoot()],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: GlobalConfigService, useValue: globalConfigMock },
        {
          provide: ConversionService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows FAB only on /cobros when conversionCalculator is enabled', () => {
    routerMock.url = '/cobros';
    globalConfigMock.get.and.returnValue('true');
    component.ngOnInit();

    expect(component.showFab).toBeTrue();
  });

  it('hides FAB outside cobros even when conversionCalculator is enabled', () => {
    routerMock.url = '/home';
    globalConfigMock.get.and.returnValue('true');
    component.ngOnInit();

    expect(component.showFab).toBeFalse();
  });

  it('hides FAB on cobros when conversionCalculator is disabled', () => {
    routerMock.url = '/cobros';
    globalConfigMock.get.and.returnValue('false');
    component.ngOnInit();

    expect(component.showFab).toBeFalse();
  });
});
