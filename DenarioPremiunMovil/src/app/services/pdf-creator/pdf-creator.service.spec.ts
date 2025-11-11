import { TestBed } from '@angular/core/testing';

import { PdfCreatorService } from './pdf-creator.service';

describe('PdfCreatorService', () => {
  let service: PdfCreatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfCreatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
