import { TestBed } from '@angular/core/testing';

import { ClientesDatabaseServicesService } from './clientes-database-services.service';

describe('ClientesDatabaseServicesService', () => {
  let service: ClientesDatabaseServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientesDatabaseServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
