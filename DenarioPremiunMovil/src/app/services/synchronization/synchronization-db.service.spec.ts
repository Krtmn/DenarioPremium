import { TestBed } from '@angular/core/testing';

import { SynchronizationDBService } from './synchronization-db.service';

describe('SynchronizationDBService', () => {
  let service: SynchronizationDBService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SynchronizationDBService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
