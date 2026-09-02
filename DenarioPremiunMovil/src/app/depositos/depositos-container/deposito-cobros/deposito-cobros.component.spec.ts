import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DepositoCobrosComponent } from './deposito-cobros.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DepositoCobrosComponent', () => {
  let component: DepositoCobrosComponent;
  let fixture: ComponentFixture<DepositoCobrosComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DepositoCobrosComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DepositoCobrosComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
