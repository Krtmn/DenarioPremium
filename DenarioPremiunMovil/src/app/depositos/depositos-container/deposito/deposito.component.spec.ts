import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DepositoComponent } from './deposito.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DepositoComponent', () => {
  let component: DepositoComponent;
  let fixture: ComponentFixture<DepositoComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DepositoComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DepositoComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
