import { TestBed } from '@angular/core/testing';

import { AutoSendService } from './auto-send.service';

describe('AutoSendService', () => {
  let service: AutoSendService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AutoSendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
