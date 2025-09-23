import { TestBed } from '@angular/core/testing';

import { ClientLogicService } from './client-logic.service';

describe('ClientLogicService', () => {
  let service: ClientLogicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientLogicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
