import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InventarioComponent } from './inventario.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('InventarioComponent', () => {
  let component: InventarioComponent;
  let fixture: ComponentFixture<InventarioComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(InventarioComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(InventarioComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
