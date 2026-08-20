import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InventarioInventarioComponent } from './inventario-inventario.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('InventarioInventarioComponent', () => {
  let component: InventarioInventarioComponent;
  let fixture: ComponentFixture<InventarioInventarioComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(InventarioInventarioComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(InventarioInventarioComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
