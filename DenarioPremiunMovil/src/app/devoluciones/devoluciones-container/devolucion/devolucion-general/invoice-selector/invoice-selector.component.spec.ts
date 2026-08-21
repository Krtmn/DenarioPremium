import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InvoiceSelectorComponent } from './invoice-selector.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('InvoiceSelectorComponent', () => {
  let component: InvoiceSelectorComponent;
  let fixture: ComponentFixture<InvoiceSelectorComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(InvoiceSelectorComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(InvoiceSelectorComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
