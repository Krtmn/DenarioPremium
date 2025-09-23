import { TestBed } from '@angular/core/testing';

import { PedidosDbService } from './pedidos-db.service';

describe('PedidosDbService', () => {
  let service: PedidosDbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PedidosDbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
