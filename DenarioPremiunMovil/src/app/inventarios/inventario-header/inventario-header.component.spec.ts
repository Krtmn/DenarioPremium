import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InventarioHeaderComponent } from './inventario-header.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('InventarioHeaderComponent', () => {
  let component: InventarioHeaderComponent;
  let fixture: ComponentFixture<InventarioHeaderComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(InventarioHeaderComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(InventarioHeaderComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
