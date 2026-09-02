import { TestBed } from '@angular/core/testing';

import { ReturnLogicService } from './return-logic.service';

describe('ReturnLogicService', () => {
  let service: ReturnLogicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReturnLogicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
