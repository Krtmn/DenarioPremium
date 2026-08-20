import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DevolucionesContainerComponent } from './devoluciones-container.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DevolucionesContainerComponent', () => {
  let component: DevolucionesContainerComponent;
  let fixture: ComponentFixture<DevolucionesContainerComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DevolucionesContainerComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DevolucionesContainerComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
