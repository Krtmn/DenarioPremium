import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';

import { PotentialClientComponent } from './client-potential-client.component';
import { ClientLogicService } from 'src/app/services/clientes/client-logic.service';
import { PotentialClientDatabaseServicesService } from 'src/app/services/clientes/potentialClient/potential-client-database-services.service';
import { MessageService } from 'src/app/services/messageService/message.service';

describe('PotentialClientComponent', () => {
  let component: PotentialClientComponent;
  let fixture: ComponentFixture<PotentialClientComponent>;
  let clientLogicMock: any;
  let potentialDbMock: any;

  beforeEach(waitForAsync(() => {
    clientLogicMock = {
      indice: 1,
      potentialClients: [
        { idClient: 1, naClient: 'Alpha Pot', nuRif: 'J-111', coClient: 'P1' },
        { idClient: 2, naClient: 'Beta Pot', nuRif: 'J-222', coClient: 'P2' },
      ],
      clientTags: new Map([['CLI_SIN_RESULTADOS', 'Sin resultados']]),
      getPotentialClient: jasmine.createSpy('getPotentialClient'),
      setNombreModulo: jasmine.createSpy('setNombreModulo'),
      potentialClient: {},
      clienteNuevoBlancoImg: true,
      clientPotentialClientComponent: true,
      clientNewPotentialClientComponent: false,
    };
    potentialDbMock = {
      deleteClientPotential: jasmine.createSpy('deleteClientPotential').and.resolveTo(true),
    };

    TestBed.configureTestingModule({
      declarations: [PotentialClientComponent],
      providers: [
        { provide: Router, useValue: {} },
        { provide: ClientLogicService, useValue: clientLogicMock },
        { provide: PotentialClientDatabaseServicesService, useValue: potentialDbMock },
        {
          provide: MessageService,
          useValue: {
            showLoading: jasmine.createSpy('showLoading').and.resolveTo(undefined),
            hideLoading: jasmine.createSpy('hideLoading'),
            alertModal: jasmine.createSpy('alertModal'),
          },
        },
      ],
    })
      .overrideComponent(PotentialClientComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(PotentialClientComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('DM-CLT-030: matchesPotentialClientSearch filtra por nombre/RIF/id', () => {
    component.searchText = 'beta';
    expect(component.matchesPotentialClientSearch(clientLogicMock.potentialClients[0], 0)).toBeFalse();
    expect(component.matchesPotentialClientSearch(clientLogicMock.potentialClients[1], 1)).toBeTrue();

    component.searchText = 'j-111';
    expect(component.matchesPotentialClientSearch(clientLogicMock.potentialClients[0], 0)).toBeTrue();

    component.searchText = '2';
    expect(component.matchesPotentialClientSearch(clientLogicMock.potentialClients[1], 1)).toBeTrue();
  });

  it('DM-CLT-030: índice de paginación oculta filas fuera de ventana', () => {
    clientLogicMock.indice = 1;
    component.searchText = '';
    expect(component.matchesPotentialClientSearch(clientLogicMock.potentialClients[0], 10)).toBeFalse();
  });

  it('DM-CLT-029: getEmptyListLabel distingue lista vacía vs sin resultados', () => {
    clientLogicMock.potentialClients = [];
    expect(component.getEmptyListLabel()).toContain('potenciales');

    clientLogicMock.potentialClients = [{ idClient: 1, naClient: 'X', nuRif: 'Y', coClient: 'Z' }];
    component.searchText = 'zzz';
    expect(component.getEmptyListLabel()).toBe('Sin resultados');
  });

  it('DM-CLT-031: deletePotentialClient elimina del arreglo si BD OK', async () => {
    const message = TestBed.inject(MessageService) as any;
    component.deletePotentialClient(0);

    await Promise.resolve();
    await Promise.resolve();

    expect(potentialDbMock.deleteClientPotential).toHaveBeenCalledWith('P1');
    expect(clientLogicMock.potentialClients.length).toBe(1);
    expect(clientLogicMock.potentialClients[0].coClient).toBe('P2');
    expect(message.alertModal).toHaveBeenCalled();
  });
});
