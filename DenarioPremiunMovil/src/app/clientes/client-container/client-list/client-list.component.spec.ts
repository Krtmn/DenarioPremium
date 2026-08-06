import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ClientListComponent } from './client-list.component';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';
import { EnterpriseService } from 'src/app/services/enterprise/enterprise.service';
import { ClienteSelectorService } from 'src/app/cliente-selector/cliente-selector.service';
import { MessageService } from 'src/app/services/messageService/message.service';

describe('ClientListComponent', () => {
  let component: ClientListComponent;
  let fixture: ComponentFixture<ClientListComponent>;
  let clientLogicMock: any;
  let messageServiceMock: any;

  beforeEach(waitForAsync(() => {
    clientLogicMock = {
      clientListComponent: false,
      clientListPage: 0,
      clientListSearchMode: false,
      clienteNuevoBlancoImg: true,
      fromSelector: false,
      esTransportista: false,
      clients: [],
      empresaSeleccionada: { idEnterprise: 1 },
      setNombreModulo: jasmine.createSpy('setNombreModulo'),
      checkUserStatus: jasmine.createSpy('checkUserStatus'),
      getClients: jasmine.createSpy('getClients').and.resolveTo(false),
      searchClients: jasmine.createSpy('searchClients').and.resolveTo(false),
      message: { hideLoading: jasmine.createSpy('hideLoading') },
    };
    messageServiceMock = {
      showLoading: jasmine.createSpy('showLoading').and.resolveTo(undefined),
      hideLoading: jasmine.createSpy('hideLoading'),
    };

    TestBed.configureTestingModule({
      declarations: [ClientListComponent],
      providers: [
        { provide: Router, useValue: {} },
        { provide: ClientLogicService, useValue: clientLogicMock },
        { provide: CurrencyService, useValue: { precision: 2, oppositeCoCurrency: (c: string) => c, formatNumber: (n: number) => String(n) } },
        { provide: EnterpriseService, useValue: {} },
        { provide: ClienteSelectorService, useValue: { clientes: [] } },
        { provide: MessageService, useValue: messageServiceMock },
      ],
    })
      .overrideComponent(ClientListComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ClientListComponent);
    component = fixture.componentInstance;
    // Evita ngOnInit (carga SQLite); se prueban métodos aislados.
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('DM-CLT-003: runSearch con texto llama searchClients', async () => {
    component.searchText = 'Empresa A';
    await (component as any).runSearch();

    expect(clientLogicMock.clientListPage).toBe(0);
    expect(clientLogicMock.searchClients).toHaveBeenCalledWith(1, 'Empresa A');
    expect(clientLogicMock.getClients).not.toHaveBeenCalled();
  });

  it('DM-CLT-006: runSearch con texto vacío recarga listado completo', async () => {
    component.searchText = '';
    await (component as any).runSearch();

    expect(clientLogicMock.clientListPage).toBe(0);
    expect(clientLogicMock.getClients).toHaveBeenCalledWith(1);
    expect(clientLogicMock.searchClients).not.toHaveBeenCalled();
  });

  it('DM-CLT-007: onIonInfinite incrementa página y carga siguiente lote', () => {
    const ev = { target: { complete: jasmine.createSpy('complete') } } as any;
    clientLogicMock.clientListPage = 0;
    clientLogicMock.clientListSearchMode = false;

    component.onIonInfinite(ev);

    expect(clientLogicMock.clientListPage).toBe(1);
    expect(clientLogicMock.getClients).toHaveBeenCalledWith(1);
  });

  it('DM-CLT-007: onIonInfinite en modo búsqueda usa searchClients', () => {
    const ev = { target: { complete: jasmine.createSpy('complete') } } as any;
    component.searchText = 'abc';
    clientLogicMock.clientListSearchMode = true;

    component.onIonInfinite(ev);

    expect(clientLogicMock.searchClients).toHaveBeenCalledWith(1, 'abc');
  });

  it('DM-CLT-032: checkUserStatus copia esTransportista', () => {
    clientLogicMock.esTransportista = true;
    component.checkUserStatus();
    expect(component.transportista).toBeTrue();
  });
});
