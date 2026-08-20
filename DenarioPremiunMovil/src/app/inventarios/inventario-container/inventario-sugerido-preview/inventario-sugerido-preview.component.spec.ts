import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InventarioSugeridoPreviewComponent } from './inventario-sugerido-preview.component';
import {
  configureIonicComponentTestingModule,
  createShallowComponentFixture,
} from 'src/app/testing/ionic-component-spec.helpers';

describe('InventarioSugeridoPreviewComponent', () => {
  let component: InventarioSugeridoPreviewComponent;
  let fixture: ComponentFixture<InventarioSugeridoPreviewComponent>;

  beforeEach(waitForAsync(() => {
    configureIonicComponentTestingModule(InventarioSugeridoPreviewComponent).compileComponents();
  }));

  beforeEach(() => {
    ({ fixture, component } = createShallowComponentFixture(InventarioSugeridoPreviewComponent));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
