import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InventarioActividadesComponent } from './inventario-actividades.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('InventarioActividadesComponent', () => {
  let component: InventarioActividadesComponent;
  let fixture: ComponentFixture<InventarioActividadesComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(InventarioActividadesComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(InventarioActividadesComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
