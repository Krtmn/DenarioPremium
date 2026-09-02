import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InventarioListComponent } from './inventario-list.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('InventarioListComponent', () => {
  let component: InventarioListComponent;
  let fixture: ComponentFixture<InventarioListComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(InventarioListComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(InventarioListComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
