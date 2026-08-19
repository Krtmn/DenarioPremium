import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DepositService } from './deposit.service';
import { DEPOSITO_STATUS_SAVED, DEPOSITO_STATUS_TO_SEND } from 'src/app/utils/appConstants';

describe('DepositService', () => {
  let service: DepositService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DepositService);
    service.userMustActivateGPS = false;
    service.deposit = {
      depositCollect: [],
      coBank: '',
      nuAccount: '',
      nuDocument: '',
      daDocument: '',
      coordenada: '',
      stDelivery: DEPOSITO_STATUS_SAVED,
    } as any;
    service.depositTags.set('DEP_MSJ_ERROR_NO_BANK', 'Seleccione un banco');
    service.depositTags.set('DEP_MSJ_ERROR_NO_COLLECT', 'Seleccione un cobro');
    service.depositTags.set('DEP_MSJ_ERROR_NO_DOCUMENT', 'Ingrese plantilla');
    service.depositTags.set('DEP_MSJ_ERROR_NO_ATTACHMENTS', 'Adjunte firma');
    service.adjuntoService.weightLimitExceeded = false;
    spyOn(service.adjuntoService, 'hasItems').and.returnValue(true);
    spyOn(service.globalConfig, 'get').and.callFake((key: string) => {
      if (key === 'signatureCollection') {
        return 'false';
      }
      if (key === 'userMustActivateGPS') {
        return 'false';
      }
      return '';
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('DEP-SAVE-001 Guardar tras General válida', () => {
    it('depósito nuevo sin baseline permite Guardar con General válida', () => {
      service.generalTabValidForSave = true;
      service.isSelectedBank = true;
      service.deposit.coBank = 'B001';
      service.deposit.nuAccount = '123';
      service.resetDepositExitBaseline();
      let saveEnabled: boolean | undefined;
      service.depositValidToSave.subscribe((v: Boolean) => saveEnabled = !!v);

      service.updateSaveButtonAvailability();
      expect(saveEnabled).toBeTrue();
    });

    it('baseline limpio deshabilita Guardar aunque General sea válida', () => {
      service.generalTabValidForSave = true;
      service.isSelectedBank = true;
      service.deposit.coBank = 'B001';
      service.deposit.nuAccount = '123';
      service.depositPersistedBaseline = true;
      service.depositDirtySincePersist = false;
      let saveEnabled: boolean | undefined;
      service.depositValidToSave.subscribe((v: Boolean) => saveEnabled = !!v);

      service.updateSaveButtonAvailability();
      expect(saveEnabled).toBeFalse();
    });

    it('markDepositDirty re-habilita Guardar tras baseline', () => {
      service.generalTabValidForSave = true;
      service.isSelectedBank = true;
      service.deposit.coBank = 'B001';
      service.deposit.nuAccount = '123';
      let saveEnabled: boolean | undefined;
      service.depositValidToSave.subscribe((v: Boolean) => saveEnabled = !!v);
      service.applyPersistSucceededBaseline();

      expect(saveEnabled).toBeFalse();
      service.markDepositDirty();
      service.updateSaveButtonAvailability();
      expect(saveEnabled).toBeTrue();
    });
  });

  describe('DEP-SEND-001 Enviar y validación al click', () => {
    it('Enviar ON con General válida aunque no haya cobros', () => {
      service.generalTabValidForSave = true;
      service.isSelectedBank = true;
      service.deposit.coBank = 'B001';
      service.deposit.nuAccount = '123';
      let sendEnabled: boolean | undefined;
      service.depositValidToSend.subscribe((v: Boolean) => sendEnabled = !!v);

      service.updateSendButtonAvailability();
      expect(sendEnabled).toBeTrue();
    });

    it('hasDepositFieldErrors true sin cobros seleccionados', () => {
      service.generalTabValidForSave = true;
      service.isSelectedBank = true;
      service.deposit.coBank = 'B001';
      service.deposit.nuAccount = '123';
      service.nuDocument = 'PLT-001';
      service.deposit.nuDocument = 'PLT-001';
      service.daDocument = '2026-01-01';
      service.deposit.daDocument = '2026-01-01';

      expect(service.hasDepositFieldErrors()).toBeTrue();
      expect(service.getDepositValidationMessage()).toContain('Seleccione un cobro');
    });

    it('hasDepositFieldErrors true sin número de plantilla', () => {
      service.generalTabValidForSave = true;
      service.isSelectedBank = true;
      service.deposit.coBank = 'B001';
      service.deposit.nuAccount = '123';
      service.deposit.depositCollect = [{ coCollection: 'C1' } as any];

      expect(service.hasDepositFieldErrors()).toBeTrue();
      expect(service.getDepositValidationMessage()).toContain('Ingrese plantilla');
    });

    it('depósito por enviar queda read-only', () => {
      service.deposit.stDelivery = DEPOSITO_STATUS_TO_SEND;
      service.generalTabValidForSave = true;
      let saveEnabled: boolean | undefined;
      let sendEnabled: boolean | undefined;
      service.depositValidToSave.subscribe((v: Boolean) => saveEnabled = !!v);
      service.depositValidToSend.subscribe((v: Boolean) => sendEnabled = !!v);

      service.updateSaveButtonAvailability();
      service.updateSendButtonAvailability();
      expect(saveEnabled).toBeFalse();
      expect(sendEnabled).toBeFalse();
    });
  });

  describe('DEP-SEND-001 adjuntos signatureCollection', () => {
    beforeEach(() => {
      (service.globalConfig.get as jasmine.Spy).and.callFake((key: string) => {
        if (key === 'signatureCollection') {
          return 'true';
        }
        if (key === 'userMustActivateGPS') {
          return 'false';
        }
        return '';
      });
    });

    it('exige adjuntos cuando signatureCollection está activo', () => {
      service.generalTabValidForSave = true;
      service.isSelectedBank = true;
      service.deposit.coBank = 'B001';
      service.deposit.nuAccount = '123';
      service.nuDocument = 'PLT-001';
      service.deposit.nuDocument = 'PLT-001';
      service.daDocument = '2026-01-01';
      service.deposit.daDocument = '2026-01-01';
      service.deposit.depositCollect = [{ coCollection: 'C1' } as any];
      (service.adjuntoService.hasItems as jasmine.Spy).and.returnValue(false);

      expect(service.hasDepositFieldErrors()).toBeTrue();
      expect(service.getDepositValidationMessage()).toContain('Adjunte firma');
    });
  });
});
