import { TestBed } from '@angular/core/testing';

import { ClienteSelectorService } from './cliente-selector.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { ServicesService } from '../services/services.service';
import { ClientLogicService } from '../services/clientes/client-logic.service';

describe('ClienteSelectorService', () => {
  let service: ClienteSelectorService;
  let getTagsSpy: jasmine.Spy;

  beforeEach(() => {
    getTagsSpy = jasmine.createSpy('getTags').and.callFake(
      (_db: unknown, module: string) => {
        if (module === 'DEN') {
          return Promise.resolve([
            {
              idApplicationTag: 1,
              coApplicationTag: 'DENARIO_DOC_VIGENTE',
              coLanguage: 'ESP',
              coModule: 'DEN',
              naModule: 'DENARIO',
              tag: 'Documento vigente',
            },
            {
              idApplicationTag: 2,
              coApplicationTag: 'DENARIO_DOC_VENCIDO',
              coLanguage: 'ESP',
              coModule: 'DEN',
              naModule: 'DENARIO',
              tag: 'Documento vencido',
            },
          ]);
        }
        return Promise.resolve([]);
      },
    );

    TestBed.configureTestingModule({
      providers: [
        ClienteSelectorService,
        {
          provide: SynchronizationDBService,
          useValue: { getDatabase: () => ({}) },
        },
        {
          provide: ServicesService,
          useValue: {
            tags: new Map<string, string>(),
            getTags: getTagsSpy,
          },
        },
        {
          provide: ClientLogicService,
          useValue: {
            clientTags: new Map<string, string>(),
            clientTagsDenario: new Map<string, string>(),
            getClientTag: (key: string) => '',
          },
        },
      ],
    });
    service = TestBed.inject(ClienteSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('ensureTagsLoaded carga DENARIO_DOC_VIGENTE para leyenda del selector', async () => {
    await service.ensureTagsLoaded(true);

    expect(service.getTag('DENARIO_DOC_VIGENTE')).toBe('Documento vigente');
    expect(service.getTag('DENARIO_DOC_VENCIDO')).toBe('Documento vencido');
  });
});
