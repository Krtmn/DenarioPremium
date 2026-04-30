import { TestBed } from '@angular/core/testing';

import { CollectionService } from './collection-logic.service';

describe('CollectionService', () => {
  let service: CollectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CollectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  function setupToleranceScenario(): jasmine.Spy {
    service.collection = {
      coCurrency: 'USD'
    } as any;
    service.MonedaTolerancia = 'USD';
    service.TipoTolerancia = 0;
    service.existPartialPayment = true;
    service.RangoToleranciaPositiva = 10;
    service.RangoToleranciaNegativa = 10;
    service.montoTotalPagar = 100;
    service.montoTotalPagado = 105;
    return spyOn(service, 'onCollectionValidToSend');
  }

  it('should allow tolerance differences in special alwaysPartialPayment mode', () => {
    const validToSendSpy = setupToleranceScenario();
    service.alwaysPartialPayment = true;
    service.enablePartialPayment = false;

    service.checkTolerancia();

    expect(validToSendSpy).toHaveBeenCalledWith(true);
  });

  it('should require exact amount when alwaysPartialPayment is enabled with partial mode active', () => {
    const validToSendSpy = setupToleranceScenario();
    service.alwaysPartialPayment = true;
    service.enablePartialPayment = true;

    service.checkTolerancia();

    expect(validToSendSpy).toHaveBeenCalledWith(false);
  });
});
