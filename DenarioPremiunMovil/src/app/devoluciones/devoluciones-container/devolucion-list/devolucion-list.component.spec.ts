import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DevolucionListComponent } from './devolucion-list.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DevolucionListComponent', () => {
  let component: DevolucionListComponent;
  let fixture: ComponentFixture<DevolucionListComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DevolucionListComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DevolucionListComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
