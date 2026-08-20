import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DepositosComponent } from './depositos.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DepositosComponent', () => {
  let component: DepositosComponent;
  let fixture: ComponentFixture<DepositosComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DepositosComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DepositosComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
