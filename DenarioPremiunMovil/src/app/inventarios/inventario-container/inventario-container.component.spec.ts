import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InventarioContainerComponent } from './inventario-container.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('InventarioContainerComponent', () => {
  let component: InventarioContainerComponent;
  let fixture: ComponentFixture<InventarioContainerComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(InventarioContainerComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(InventarioContainerComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
