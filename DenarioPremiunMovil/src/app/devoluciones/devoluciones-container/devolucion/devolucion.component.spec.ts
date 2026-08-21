import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DevolucionComponent } from './devolucion.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DevolucionComponent', () => {
  let component: DevolucionComponent;
  let fixture: ComponentFixture<DevolucionComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DevolucionComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DevolucionComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
