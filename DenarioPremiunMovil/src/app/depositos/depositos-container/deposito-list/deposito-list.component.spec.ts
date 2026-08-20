import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DepositoListComponent } from './deposito-list.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DepositoListComponent', () => {
  let component: DepositoListComponent;
  let fixture: ComponentFixture<DepositoListComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DepositoListComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DepositoListComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
