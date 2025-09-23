import { TestBed } from '@angular/core/testing';

import { ReturnDatabaseService } from './return-database.service';

describe('ReturnDatabaseService', () => {
  let service: ReturnDatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReturnDatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
