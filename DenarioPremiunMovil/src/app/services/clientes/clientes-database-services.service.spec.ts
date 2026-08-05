import { TestBed } from '@angular/core/testing';

import { ClientesDatabaseServicesService } from './clientes-database-services.service';
import { GlobalConfigService } from '../globalConfig/global-config.service';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { TextService } from '../text/text.service';

describe('ClientesDatabaseServicesService', () => {
  let service: ClientesDatabaseServicesService;
  let executeSqlSpy: jasmine.Spy;

  beforeEach(() => {
    executeSqlSpy = jasmine.createSpy('executeSql').and.resolveTo({ rows: { length: 0 } });

    TestBed.configureTestingModule({
      providers: [
        ClientesDatabaseServicesService,
        {
          provide: GlobalConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'multiCurrency' || key === 'conversionDocument') {
                return 'false';
              }
              return '';
            },
          },
        },
        {
          provide: SynchronizationDBService,
          useValue: {
            getDatabase: () => ({ executeSql: executeSqlSpy }),
          },
        },
        {
          provide: TextService,
          useValue: {
            convertToSqliteAccentGlob: (value: string) => value,
          },
        },
      ],
    });

    service = TestBed.inject(ClientesDatabaseServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getClients should omit in_suspension filter when excludeSuspended is false', async () => {
    await service.getClients(1, 0, false, false);

    const sql = executeSqlSpy.calls.mostRecent().args[0] as string;
    expect(sql).not.toContain('c.in_suspension');
  });

  it('getClients should include in_suspension filter when excludeSuspended is true', async () => {
    await service.getClients(1, 0, false, true);

    const sql = executeSqlSpy.calls.mostRecent().args[0] as string;
    expect(sql).toContain('c.in_suspension');
  });

  it('searchClients should include in_suspension filter when excludeSuspended is true', async () => {
    await service.searchClients(1, 'acme', 0, false, true);

    const sql = executeSqlSpy.calls.mostRecent().args[0] as string;
    expect(sql).toContain('c.in_suspension');
  });

  it('searchClients should omit in_suspension filter when excludeSuspended is false', async () => {
    await service.searchClients(1, 'acme', 0, false, false);

    const sql = executeSqlSpy.calls.mostRecent().args[0] as string;
    expect(sql).not.toContain('c.in_suspension');
  });
});
