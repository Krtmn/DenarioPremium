import { TestBed } from '@angular/core/testing';

import { InventariosLogicService } from './inventarios-logic.service';

describe('StockLogicServicesService', () => {
  let service: InventariosLogicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventariosLogicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
