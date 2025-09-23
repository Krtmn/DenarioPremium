import { TestBed } from '@angular/core/testing';

import { ClienteSelectorService } from './cliente-selector.service';

describe('ClienteSelectorService', () => {
  let service: ClienteSelectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClienteSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
