import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DepositoTotalComponent } from './deposito-total.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DepositoTotalComponent', () => {
  let component: DepositoTotalComponent;
  let fixture: ComponentFixture<DepositoTotalComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DepositoTotalComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DepositoTotalComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
