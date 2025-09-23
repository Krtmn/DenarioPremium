import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ProductosTabOrderProductListComponent } from './productos-tab-order-product-list.component';

describe('ProductosTabOrderProductListComponent', () => {
  let component: ProductosTabOrderProductListComponent;
  let fixture: ComponentFixture<ProductosTabOrderProductListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductosTabOrderProductListComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosTabOrderProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
