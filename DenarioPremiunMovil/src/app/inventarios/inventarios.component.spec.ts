import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InventariosComponent } from './inventarios.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('InventariosComponent', () => {
  let component: InventariosComponent;
  let fixture: ComponentFixture<InventariosComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(InventariosComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(InventariosComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
