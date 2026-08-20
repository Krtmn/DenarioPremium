import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DevolucionesHeaderComponent } from './devoluciones-header.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DevolucionesHeaderComponent', () => {
  let component: DevolucionesHeaderComponent;
  let fixture: ComponentFixture<DevolucionesHeaderComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DevolucionesHeaderComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DevolucionesHeaderComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
