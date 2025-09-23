import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ProductosTabReturnProductListComponent } from './productos-tab-return-product-list.component';

describe('ProductosTabReturnProdutListComponent', () => {
  let component: ProductosTabReturnProductListComponent;
  let fixture: ComponentFixture<ProductosTabReturnProductListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductosTabReturnProductListComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosTabReturnProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
