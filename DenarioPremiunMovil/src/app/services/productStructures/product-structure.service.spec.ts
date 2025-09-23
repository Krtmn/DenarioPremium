import { TestBed } from '@angular/core/testing';

import { ProductStructureService } from './product-structure.service';

describe('ProductStructureService', () => {
  let service: ProductStructureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductStructureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
