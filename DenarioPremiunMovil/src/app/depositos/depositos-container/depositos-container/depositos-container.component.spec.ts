import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DepositosContainerComponent } from './depositos-container.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('DepositosContainerComponent', () => {
  let component: DepositosContainerComponent;
  let fixture: ComponentFixture<DepositosContainerComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(DepositosContainerComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(DepositosContainerComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
