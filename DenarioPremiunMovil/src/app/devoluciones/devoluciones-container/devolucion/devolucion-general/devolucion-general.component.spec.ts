import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DevolucionGeneralComponent } from './devolucion-general.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DevolucionGeneralComponent', () => {
  let component: DevolucionGeneralComponent;
  let fixture: ComponentFixture<DevolucionGeneralComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DevolucionGeneralComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DevolucionGeneralComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
