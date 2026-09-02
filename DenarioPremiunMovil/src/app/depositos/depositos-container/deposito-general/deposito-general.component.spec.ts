import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DepositoGeneralComponent } from './deposito-general.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DepositoGeneralComponent', () => {
  let component: DepositoGeneralComponent;
  let fixture: ComponentFixture<DepositoGeneralComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DepositoGeneralComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DepositoGeneralComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
