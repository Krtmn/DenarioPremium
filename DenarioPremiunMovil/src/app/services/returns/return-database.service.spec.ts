import { TestBed } from '@angular/core/testing';

import { ReturnDatabaseService } from './return-database.service';
import {
  commonHttpProviders,
  mockDateService,
  mockProductService,
} from 'src/app/testing/ionic-component-spec.helpers';
import { DateServiceService } from '../dates/date-service.service';
import { ProductService } from '../products/product.service';

describe('ReturnDatabaseService', () => {
  let service: ReturnDatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...commonHttpProviders(),
        { provide: ProductService, useValue: mockProductService },
        { provide: DateServiceService, useValue: mockDateService },
      ],
    });
    service = TestBed.inject(ReturnDatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
