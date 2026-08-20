import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DevolucionesComponent } from './devoluciones.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DevolucionesComponent', () => {
  let component: DevolucionesComponent;
  let fixture: ComponentFixture<DevolucionesComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DevolucionesComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DevolucionesComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
