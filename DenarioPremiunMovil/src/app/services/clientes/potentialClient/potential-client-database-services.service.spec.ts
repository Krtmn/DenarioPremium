import { TestBed } from '@angular/core/testing';

import { PotentialClientDatabaseServicesService } from './potential-client-database-services.service';

describe('PotentialClientDatabaseServicesService', () => {
  let service: PotentialClientDatabaseServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PotentialClientDatabaseServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
