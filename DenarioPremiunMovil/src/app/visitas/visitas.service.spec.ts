import { TestBed } from '@angular/core/testing';

import { VisitasService } from './visitas.service';

describe('VisitasService', () => {
  let service: VisitasService;

  const buildDbRow = (overrides: Record<string, unknown> = {}) => ({
    id_visit: 1,
    co_visit: 'V001',
    st_visit: 3,
    da_visit: '2026-08-03 00:00:00',
    coordenada: '',
    id_client: 1,
    co_client: 'C001',
    na_client: 'Cliente',
    nu_sequence: 1,
    id_user: 1,
    co_user: 'U001',
    co_enterprise: 'E001',
    id_enterprise: 1,
    da_initial: '',
    da_real: '',
    id_address_client: 1,
    co_address_client: 'A001',
    coordenadaSaved: false,
    has_attachments: 'false',
    nu_attachments: 0,
    is_reassigned: 'false',
    tx_reassigned_motive: '',
    da_reassign: '',
    no_dispatched_motive: '',
    is_dispatched: 'false',
    is_visited: 'false',
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('visitDBtoObj', () => {
    it('parses has_attachments string true and nu_attachments as number', () => {
      const visit = service.visitDBtoObj(buildDbRow({
        has_attachments: 'true',
        nu_attachments: '2',
      }));

      expect(visit.hasAttachments).toBe(true);
      expect(visit.nuAttachments).toBe(2);
    });

    it('parses has_attachments false and zero attachments', () => {
      const visit = service.visitDBtoObj(buildDbRow({
        has_attachments: 'false',
        nu_attachments: 0,
      }));

      expect(visit.hasAttachments).toBe(false);
      expect(visit.nuAttachments).toBe(0);
    });

    it('parses boolean true from SQLite', () => {
      const visit = service.visitDBtoObj(buildDbRow({
        has_attachments: true,
        nu_attachments: 1,
      }));

      expect(visit.hasAttachments).toBe(true);
      expect(visit.nuAttachments).toBe(1);
    });
  });
});
