import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CollectionService } from './collection-logic.service';
import { CollectionDetail } from 'src/app/modelos/tables/collection';
import { DocumentSale } from 'src/app/modelos/tables/documentSale';

describe('CollectionService', () => {
  let service: CollectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
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

  describe('retention line voucher and date', () => {
    it('normalizeCollectionDetailRetentionLine should preserve voucher and date fields', () => {
      const normalized = service.normalizeCollectionDetailRetentionLine(
        {
          idCollectionDetailRetention: null,
          idCollectionDetail: 0,
          coCollection: 'COB-001',
          coDocument: 'FAC-001',
          idCollectRetention: 1,
          coCollectRetention: 'IVA',
          nuAmountRetention: 50,
          nuAmountRetentionConversion: 50,
          posicion: 1,
          nuVoucherRetention: '1234567890',
          daVoucherRetention: '2025-06-15T00:00:00',
        },
        'COB-001',
        'FAC-001',
        0,
        0,
      );

      expect(normalized.nuVoucherRetention).toBe('1234567890');
      expect(normalized.daVoucherRetention).toBe('2025-06-15T00:00:00');
      expect(normalized.nuAmountRetention).toBe(50);
    });

    it('validateRetentionVoucherValue should enforce nuVoucherLength from collect_retentions', () => {
      service.collectRetentions = [{
        idCollectRetention: 1,
        coCollectRetention: 'IVA',
        naCollectRetention: 'Retencion IVA',
        idEnterprise: 1,
        requireInput: true,
        nuVoucherLength: 10,
      } as any];

      expect(service.validateRetentionVoucherValue('', 1)).toBeFalse();
      expect(service.validateRetentionVoucherValue('12345', 1)).toBeFalse();
      expect(service.validateRetentionVoucherValue('1234567890', 1)).toBeTrue();
    });

    it('validateRetentionVoucherValue should allow empty voucher when requireInput is false', () => {
      service.collectRetentions = [{
        idCollectRetention: 2,
        coCollectRetention: 'ISLR',
        naCollectRetention: 'Retencion ISLR',
        idEnterprise: 1,
        requireInput: false,
        nuVoucherLength: 0,
      } as any];

      expect(service.validateRetentionVoucherValue('', 2)).toBeTrue();
      expect(service.validateRetentionVoucherValue('ABC', 2)).toBeTrue();
    });

    it('validateRetentionVoucherValue should enforce configured length even when optional', () => {
      service.collectRetentions = [{
        idCollectRetention: 3,
        coCollectRetention: 'IVA2',
        naCollectRetention: 'Retencion IVA 2',
        idEnterprise: 1,
        requireInput: false,
        nuVoucherLength: 6,
      } as any];

      expect(service.validateRetentionVoucherValue('', 3)).toBeTrue();
      expect(service.validateRetentionVoucherValue('123456', 3)).toBeTrue();
      expect(service.validateRetentionVoucherValue('12345', 3)).toBeFalse();
    });

    it('syncLegacyDetailFieldsFromFirstRetentionLine should copy first line with amount', () => {
      const detail = {
        nuVoucherRetention: '',
        daVoucher: '',
      } as CollectionDetail;
      const open = {
        nuVaucherRetention: '',
        daVoucher: '',
      } as DocumentSale;

      service.syncLegacyDetailFieldsFromFirstRetentionLine(
        detail,
        [
          { nuAmountRetention: 0, nuVoucherRetention: 'SKIP', daVoucherRetention: '2025-01-01' },
          { nuAmountRetention: 25, nuVoucherRetention: 'VOUCHER-01', daVoucherRetention: '2025-06-20T12:00:00' },
          { nuAmountRetention: 10, nuVoucherRetention: 'OTHER', daVoucherRetention: '2025-07-01' },
        ],
        open,
      );

      expect(detail.nuVoucherRetention).toBe('VOUCHER-01');
      expect(detail.daVoucher).toBe('2025-06-20');
      expect(open.nuVaucherRetention).toBe('VOUCHER-01');
      expect(open.daVoucher).toBe('2025-06-20');
    });

    it('getCollectionDetailsRetentions should map nu_voucher_retention and da_voucher_retention', async () => {
      const dbServ = {
        executeSql: jasmine.createSpy('executeSql').and.resolveTo({
          rows: {
            length: 1,
            item: (index: number) => ({
              id_collection_detail_retention: 99,
              id_collection_detail: 0,
              id_collect_retention: 2,
              co_collect_retention: 'ISLR',
              nu_amount_retention: 15,
              nu_amount_retention_conversion: 15,
              co_collection: 'COB-100',
              co_document: 'FAC-200',
              posicion: 1,
              nu_voucher_retention: '9876543210',
              da_voucher_retention: '2025-05-10',
            }),
          },
        }),
      };

      const result = await service.getCollectionDetailsRetentions(dbServ as any, 'COB-100');

      expect(result.length).toBe(1);
      expect(result[0].nuVoucherRetention).toBe('9876543210');
      expect(result[0].daVoucherRetention).toBe('2025-05-10');
      expect(result[0].coDocument).toBe('FAC-200');
    });
  });

  /**
   * Bloque P0 — montos Documentos/Pagos (guion DM-COB-008 / 046 + fix paginación COB-DOCS-001).
   * Unitario: no reemplaza el smoke Manual-UI; protege la lógica de CollectionService.
   */
  describe('COB docs amounts (DM-COB-008 / pagination / DM-COB-046)', () => {
    function makeDetail(partial: Partial<CollectionDetail>): CollectionDetail {
      return {
        idDocument: 1,
        coDocument: 'FAC-1',
        inPaymentPartial: false,
        nuAmountPaid: 0,
        nuAmountPaidConversion: 0,
        nuBalanceDoc: 0,
        nuBalanceDocConversion: 0,
        nuBalanceDocOriginal: 0,
        nuAmountDoc: 0,
        nuAmountDiscount: 0,
        nuAmountCollectDiscount: 0,
        nuAmountRetention: 0,
        nuAmountRetention2: 0,
        nuAmountIgtf: 0,
        isSave: true,
        ...partial,
      } as CollectionDetail;
    }

    function stubPaymentSideEffects(): void {
      const svc = service as any;
      spyOn(service, 'convertirMonto').and.callFake((amount: number) => Number(amount) || 0);
      spyOn(svc.currencyService, 'formatNumber').and.callFake((n: number) => String(n ?? 0));
      spyOn(service, 'cleanFormattedNumber').and.callFake((value: string | number) => Number(value) || 0);
      spyOn(svc, 'shouldApplyIgtfToCollection').and.returnValue(false);
      spyOn(svc, 'shouldCalculateEmbeddedIgtf').and.returnValue(false);
      spyOn(svc, 'isRetentionCollection').and.returnValue(false);
      spyOn(svc, 'resolveAutomatedPrepaid').and.stub();
      spyOn(service, 'syncAddPaymentMethodDisabledState').and.stub();
      spyOn(svc, 'syncCollectionDetailsIgtfAmounts').and.stub();
      spyOn(svc, 'syncCollectionIgtfFields').and.stub();
      spyOn(svc, 'applyCollectionIgtfAmountFields').and.stub();
    }

    function setupEditableCollection(details: CollectionDetail[]): void {
      stubPaymentSideEffects();
      service.coTypeModule = '0';
      service.isOpen = false;
      service.isChangePaymentPartialPersistence = false;
      service.isRateChangeInProgress = false;
      service.montoTotalPagado = 0;
      service.documentSales = [] as DocumentSale[];
      service.documentSalesBackup = [] as DocumentSale[];
      service.collection = {
        coCurrency: 'USD',
        nuValueLocal: 1,
        stDelivery: service.COLLECT_STATUS_NEW,
        stCollection: service.COLLECT_STATUS_NEW,
        collectionDetails: details,
        collectionPayments: [],
        nuAmountIgtf: 0,
      } as any;
    }

    it('DM-COB-008: two full documents sum into montoTotalPagar', async () => {
      setupEditableCollection([
        makeDetail({
          idDocument: 10,
          coDocument: 'FAC-10',
          nuBalanceDoc: 100,
          nuBalanceDocOriginal: 100,
          nuAmountPaid: 100,
          nuAmountPaidConversion: 100,
        }),
        makeDetail({
          idDocument: 20,
          coDocument: 'FAC-20',
          nuBalanceDoc: 250,
          nuBalanceDocOriginal: 250,
          nuAmountPaid: 250,
          nuAmountPaidConversion: 250,
        }),
      ]);

      await service.calculatePayment('', 0, true, true);

      expect(service.montoTotalPagar).toBe(350);
    });

    it('COB-DOCS-001: partials from all details even if documentSales has only current page', async () => {
      setupEditableCollection([
        makeDetail({
          idDocument: 1,
          coDocument: 'FAC-P1',
          inPaymentPartial: true,
          nuAmountPaid: 100,
          nuAmountPaidConversion: 100,
          nuBalanceDoc: 500,
        }),
        makeDetail({
          idDocument: 2,
          coDocument: 'FAC-P2',
          inPaymentPartial: true,
          nuAmountPaid: 50,
          nuAmountPaidConversion: 50,
          nuBalanceDoc: 500,
        }),
      ]);

      // Simula página 2: solo el segundo documento está en documentSales.
      service.documentSales = [{
        idDocument: 2,
        coDocument: 'FAC-P2',
        isSelected: true,
        isSave: true,
        inPaymentPartial: true,
        nuAmountPaid: 50,
        positionCollecDetails: 1,
      } as DocumentSale];
      service.documentSalesBackup = [{
        idDocument: 2,
        nuBalance: 500,
        nuAmountPaid: 50,
      } as DocumentSale];

      await service.calculatePayment('', 0, true, true);

      expect(service.montoTotalPagar).toBe(150);
      expect(service.montoTotalPagar).not.toBe(50);
    });

    it('DM-COB-046: partial payment amount is used instead of full balance', async () => {
      setupEditableCollection([
        makeDetail({
          idDocument: 99,
          coDocument: 'FAC-99',
          inPaymentPartial: true,
          nuAmountPaid: 40,
          nuAmountPaidConversion: 40,
          nuBalanceDoc: 100,
          nuBalanceDocOriginal: 100,
        }),
      ]);

      await service.calculatePayment('', 0, true, true);

      expect(service.montoTotalPagar).toBe(40);
      expect(service.montoTotalPagar).not.toBe(100);
    });

    it('DM-COB-041: document retentions reduce montoTotalPagar (gross - IVA - ISLR)', async () => {
      setupEditableCollection([
        makeDetail({
          idDocument: 51,
          coDocument: 'FAC-51',
          nuBalanceDoc: 51,
          nuBalanceDocOriginal: 51,
          nuAmountPaid: 51,
          nuAmountPaidConversion: 51,
          nuAmountRetention: 10,
          nuAmountRetention2: 1,
          isSave: true,
        }),
      ]);

      expect(service.getDetailRetentionTotal(service.collection.collectionDetails[0])).toBe(11);

      await service.calculatePayment('', 0, true, true);

      expect(service.montoTotalPagar).toBe(40);
      expect(service.montoTotalPagar).not.toBe(51);
    });
  });

  describe('COB module type flags (DM-COB-028 / 029 / 037)', () => {
    /** Espejo del switch de cobros-container.goToNuevoCobro (contrato de tabs). */
    function applyHomeModuleType(type: 0 | 1 | 2 | 3 | 4): void {
      service.cobro25 = false;
      service.isAnticipo = false;
      service.isRetention = false;
      service.hideDocuments = false;
      service.hidePayments = false;
      service.coTypeModule = String(type);

      if (type === 1) {
        service.isAnticipo = true;
        service.hideDocuments = true;
        service.hidePayments = false;
      } else if (type === 2) {
        service.isRetention = true;
        service.hideDocuments = false;
        service.hidePayments = true;
      } else if (type === 4) {
        service.cobro25 = true;
      }
    }

    it('DM-COB-028: Anticipo hides Documents and keeps Payments', () => {
      applyHomeModuleType(1);
      expect(service.coTypeModule).toBe('1');
      expect(service.hideDocuments).toBeTrue();
      expect(service.hidePayments).toBeFalse();
      expect(service.isAnticipo).toBeTrue();
    });

    it('DM-COB-029: Retención keeps Documents and hides Payments', () => {
      applyHomeModuleType(2);
      expect(service.coTypeModule).toBe('2');
      expect(service.hideDocuments).toBeFalse();
      expect(service.hidePayments).toBeTrue();
      expect(service.isRetention).toBeTrue();
    });

    it('DM-COB-037: Cobro 25% keeps both tabs and sets cobro25', () => {
      applyHomeModuleType(4);
      expect(service.coTypeModule).toBe('4');
      expect(service.cobro25).toBeTrue();
      expect(service.hideDocuments).toBeFalse();
      expect(service.hidePayments).toBeFalse();
    });

    it('DM-COB-029: retention module totals use retention sum not document balance', async () => {
      const svc = service as any;
      spyOn(service, 'convertirMonto').and.callFake((amount: number) => Number(amount) || 0);
      spyOn(svc.currencyService, 'formatNumber').and.callFake((n: number) => String(n ?? 0));
      spyOn(service, 'cleanFormattedNumber').and.callFake((value: string | number) => Number(value) || 0);
      spyOn(svc, 'shouldApplyIgtfToCollection').and.returnValue(false);
      spyOn(svc, 'shouldCalculateEmbeddedIgtf').and.returnValue(false);
      spyOn(svc, 'syncCollectionDetailsRetentionConversions').and.stub();
      spyOn(svc, 'resolveAutomatedPrepaid').and.stub();
      spyOn(service, 'syncAddPaymentMethodDisabledState').and.stub();
      spyOn(svc, 'syncCollectionDetailsIgtfAmounts').and.stub();
      spyOn(svc, 'syncCollectionIgtfFields').and.stub();
      spyOn(svc, 'applyCollectionIgtfAmountFields').and.stub();

      service.coTypeModule = '2';
      service.isOpen = false;
      service.documentSales = [];
      service.documentSalesBackup = [];
      service.collection = {
        coType: '2',
        coCurrency: 'USD',
        nuValueLocal: 1,
        stDelivery: service.COLLECT_STATUS_NEW,
        stCollection: service.COLLECT_STATUS_NEW,
        collectionDetails: [{
          idDocument: 1,
          coDocument: 'FAC-R',
          nuBalanceDoc: 51,
          nuAmountPaid: 51,
          nuAmountRetention: 10,
          nuAmountRetention2: 1,
          nuAmountDiscount: 0,
          nuAmountCollectDiscount: 0,
          isSave: true,
          inPaymentPartial: false,
        } as CollectionDetail],
        collectionPayments: [],
        nuAmountIgtf: 0,
      } as any;

      await service.calculatePayment('', 0, true, true);

      expect(service.montoTotalPagar).toBe(11);
      expect(service.collection.nuDifference).toBe(0);
    });
  });

  describe('COB payment methods completeness (DM-COB-010 / 040 / TR)', () => {
    beforeEach(() => {
      service.tipoPagoEfectivo = false;
      service.tipoPagoCheque = false;
      service.tipoPagoDeposito = false;
      service.tipoPagoTransferencia = false;
      service.tipoPagoPagoMovil = false;
      service.tipoPagoOtros = false;
      service.pagoEfectivo = [];
      service.pagoCheque = [];
      service.pagoDeposito = [];
      service.pagoTransferencia = [];
      service.pagoMovil = [];
      service.clientBankAccount = false;
    });

    it('DM-COB-010: efectivo is complete with positive amount only', () => {
      service.tipoPagoEfectivo = true;
      service.pagoEfectivo = [{ monto: 100 } as any];
      expect(service.isIndexedPaymentMethodComplete('ef', 0)).toBeTrue();
      expect(service.hasIncompletePaymentMethods()).toBeFalse();

      service.pagoEfectivo = [{ monto: 0 } as any];
      expect(service.hasIncompletePaymentMethods()).toBeTrue();
    });

    it('blocks empty collectionPayment without payment method', () => {
      service.collection = {
        collectionPayments: [
          { coPaymentMethod: 'pm', coType: 'pm', nuAmountPartial: 10, idBank: 9 } as any,
          { coPaymentMethod: '', coType: '', nuAmountPartial: 0, idBank: 0 } as any,
        ],
      } as any;

      expect(service.hasEmptyCollectionPayments()).toBeTrue();
      expect(service.hasIncompletePaymentMethods()).toBeTrue();
      expect(service.getNonEmptyCollectionPayments(service.collection.collectionPayments).length).toBe(1);
      expect(service.blockSaveAndSendForInvalidPayments()).toBeTrue();
      expect(service.disableSavedButton).toBeTrue();
      expect(service.disableSendButton).toBeTrue();
    });

    it('allows save/send when all collectionPayments have method', () => {
      service.collection = {
        collectionPayments: [
          { coPaymentMethod: 'pm', coType: 'pm', nuAmountPartial: 10, idBank: 9 } as any,
        ],
      } as any;
      service.tipoPagoPagoMovil = false;

      expect(service.hasEmptyCollectionPayments()).toBeFalse();
      expect(service.hasIncompletePaymentMethods()).toBeFalse();
    });

    it('DM-COB-040: deposito requires bank, account, number, date and amount', () => {
      service.tipoPagoDeposito = true;
      service.pagoDeposito = [{
        monto: 350,
        fecha: '2026-08-04',
        nombreBanco: 'Banco QA',
        numeroCuenta: '0102-001',
        numeroDeposito: 'TEST-DEP-040',
      } as any];
      expect(service.isIndexedPaymentMethodComplete('de', 0)).toBeTrue();
      expect(service.hasIncompletePaymentMethods()).toBeFalse();

      service.pagoDeposito[0].numeroDeposito = '';
      expect(service.hasIncompletePaymentMethods()).toBeTrue();
    });

    it('COB-TR-001: transferencia complete without clientBankAccount', () => {
      service.tipoPagoTransferencia = true;
      service.clientBankAccount = false;
      service.pagoTransferencia = [{
        monto: 100,
        fecha: '2026-08-04',
        nombreBanco: 'Banco Receptor',
        numeroCuenta: '0102-999',
        numeroTransferencia: 'REF-001',
        showNuevaCuenta: false,
        numeroCuentaCliente: '',
        nuevaCuenta: '',
      } as any];

      expect(service.isIndexedPaymentMethodComplete('tr', 0)).toBeTrue();
      expect(service.hasIncompletePaymentMethods()).toBeFalse();
    });

    it('COB-TR-001: transferencia with clientBankAccount requires existing client account', () => {
      service.tipoPagoTransferencia = true;
      service.clientBankAccount = true;
      service.pagoTransferencia = [{
        monto: 100,
        fecha: '2026-08-04',
        nombreBanco: 'Banco Receptor',
        numeroCuenta: '0102-999',
        numeroTransferencia: 'REF-001',
        showNuevaCuenta: false,
        numeroCuentaCliente: '',
        nuevaCuenta: '',
      } as any];

      expect(service.isIndexedPaymentMethodComplete('tr', 0)).toBeFalse();
      expect(service.hasIncompletePaymentMethods()).toBeTrue();

      service.pagoTransferencia[0].numeroCuentaCliente = '0102-CLIENTE';
      expect(service.isIndexedPaymentMethodComplete('tr', 0)).toBeTrue();
      expect(service.hasIncompletePaymentMethods()).toBeFalse();
    });

    it('COB-TR-001: transferencia nueva cuenta requires nuevaCuenta text', () => {
      service.tipoPagoTransferencia = true;
      service.clientBankAccount = true;
      service.pagoTransferencia = [{
        monto: 100,
        fecha: '2026-08-04',
        nombreBanco: 'Banco Receptor',
        numeroCuenta: '0102-999',
        numeroTransferencia: 'REF-001',
        showNuevaCuenta: true,
        numeroCuentaCliente: 'Nueva Cuenta',
        nuevaCuenta: '',
      } as any];

      expect(service.isIndexedPaymentMethodComplete('tr', 0)).toBeFalse();

      service.pagoTransferencia[0].nuevaCuenta = '0123-456789';
      expect(service.isIndexedPaymentMethodComplete('tr', 0)).toBeTrue();
    });

    it('DM-COB-011: cheque requires amount, dates, bank and cheque number', () => {
      service.tipoPagoCheque = true;
      service.pagoCheque = [{
        monto: 250,
        fecha: '2026-08-04',
        fechaValor: '2026-08-10',
        nombreBanco: 'Banco Cheque',
        numeroCheque: 'CHQ-001',
      } as any];
      expect(service.isIndexedPaymentMethodComplete('ch', 0)).toBeTrue();
      expect(service.hasIncompletePaymentMethods()).toBeFalse();

      service.pagoCheque[0].numeroCheque = '';
      expect(service.hasIncompletePaymentMethods()).toBeTrue();
    });

    it('DM-COB-039: pago movil requires amount, date, banks, document and reference', () => {
      service.tipoPagoPagoMovil = true;
      service.pagoMovil = [{
        monto: 80,
        fecha: '2026-08-04',
        nombreBancoEmisor: 'Banco Emisor',
        nombreBancoDestino: 'Banco Destino',
        numeroDocumento: '12345678',
        numeroReferencia: 'PM-REF-001',
      } as any];
      expect(service.isIndexedPaymentMethodComplete('pm', 0)).toBeTrue();
      expect(service.hasIncompletePaymentMethods()).toBeFalse();

      service.pagoMovil[0].numeroReferencia = '';
      expect(service.hasIncompletePaymentMethods()).toBeTrue();
    });
  });

  describe('COB tolerancia / diferencia (DM-COB-012 / 043)', () => {
    function setupToleranceBase(): jasmine.Spy {
      service.collection = { coCurrency: 'USD' } as any;
      service.MonedaTolerancia = 'USD';
      service.TipoTolerancia = 0;
      service.RangoToleranciaPositiva = 10;
      service.RangoToleranciaNegativa = 100000;
      service.alwaysPartialPayment = false;
      service.enablePartialPayment = true;
      service.existPartialPayment = false;
      service.montoTotalPagar = 100;
      return spyOn(service, 'onCollectionValidToSend');
    }

    it('DM-COB-012: underpayment within negative tolerance enables send', () => {
      const spy = setupToleranceBase();
      service.montoTotalPagado = 0.1;

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(true);
    });

    it('DM-COB-012: underpayment beyond negative tolerance disables send', () => {
      const spy = setupToleranceBase();
      service.RangoToleranciaNegativa = 5;
      service.montoTotalPagado = 90;

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('DM-COB-043: exact payment enables send', () => {
      const spy = setupToleranceBase();
      service.montoTotalPagado = 100;

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(true);
    });

    it('DM-COB-012: zero paid disables send', () => {
      const spy = setupToleranceBase();
      service.montoTotalPagado = 0;

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('DM-COB-012: overpayment within positive absolute tolerance enables send', () => {
      const spy = setupToleranceBase();
      // amount = 5 < RangoToleranciaPositiva(10) → Enviar ON
      service.montoTotalPagado = 105;

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(true);
    });

    it('DM-COB-012: overpayment at or beyond positive absolute tolerance disables send', () => {
      const spy = setupToleranceBase();
      // amount = 10 is NOT < 10 → Enviar OFF (comparación estricta)
      service.montoTotalPagado = 110;

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(false);
    });
  });

  describe('COB tolerancia porcentual (TipoTolerancia != 0)', () => {
    function setupPercentToleranceBase(): jasmine.Spy {
      service.collection = { coCurrency: 'USD' } as any;
      service.MonedaTolerancia = 'USD';
      service.TipoTolerancia = 1;
      service.parteDecimal = 2;
      // 5% positivo / 10% negativo sobre monto a pagar
      service.RangoToleranciaPositiva = 5;
      service.RangoToleranciaNegativa = 10;
      service.alwaysPartialPayment = false;
      service.enablePartialPayment = true;
      service.existPartialPayment = false;
      service.montoTotalPagar = 100;
      return spyOn(service, 'onCollectionValidToSend');
    }

    it('DM-COB-012-%: overpayment within positive percent enables send', () => {
      const spy = setupPercentToleranceBase();
      // allowedPositive = 100 * 5% = 5; delta 5 <= 5 → ON
      service.montoTotalPagado = 105;

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(true);
    });

    it('DM-COB-012-%: overpayment beyond positive percent disables send', () => {
      const spy = setupPercentToleranceBase();
      // delta 6 > 5 → OFF
      service.montoTotalPagado = 106;

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('DM-COB-012-%: underpayment within negative percent enables send', () => {
      const spy = setupPercentToleranceBase();
      // allowedNegative = 100 * 10% = 10; |delta| 10 <= 10 → ON
      service.montoTotalPagado = 90;

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(true);
    });

    it('DM-COB-012-%: underpayment beyond negative percent disables send', () => {
      const spy = setupPercentToleranceBase();
      // |delta| 11 > 10 → OFF
      service.montoTotalPagado = 89;

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('DM-COB-012: tolerancia0=false requires exact amount (validateToSend)', async () => {
      service.tolerancia0 = false;
      service.alwaysPartialPayment = false;
      service.enablePartialPayment = true;
      service.existPartialPayment = false;
      service.coTypeModule = '0';
      service.montoTotalPagar = 100;
      service.montoTotalPagado = 95;
      service.collection = {
        coType: '0',
        coCurrency: 'USD',
        collectionDetails: [{
          idDocument: 1,
          coDocument: 'FAC-1',
          isSave: true,
          inPaymentPartial: false,
        }],
        collectionPayments: [{ coType: 'ef', coPaymentMethod: 'ef', nuAmountPartial: 95 }],
      } as any;
      service.documentSales = [{
        idDocument: 1,
        coDocument: 'FAC-1',
        isSelected: true,
        isSave: true,
        positionCollecDetails: 0,
      } as DocumentSale];

      spyOn(service, 'hasIncompletePaymentMethods').and.returnValue(false);
      spyOn(service, 'validateReferencePayment').and.resolveTo(true);
      (service as any).currencyService = {
        formatNumber: (n: number) => String(n ?? 0),
      };
      spyOn(service, 'cleanFormattedNumber').and.callFake((v: string | number) => Number(v) || 0);
      const spy = spyOn(service, 'onCollectionValidToSend');

      await service.validateToSend();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('DM-COB-012: cross-currency absolute tolerance uses converted positive range', () => {
      service.collection = { coCurrency: 'USD' } as any;
      service.MonedaTolerancia = 'VES';
      service.MonedaToleranciaIsLocal = true;
      service.TipoTolerancia = 0;
      service.RangoToleranciaPositiva = 10;
      service.RangoToleranciaNegativa = 100;
      service.alwaysPartialPayment = false;
      service.enablePartialPayment = true;
      service.existPartialPayment = false;
      service.montoTotalPagar = 100;
      service.montoTotalPagado = 105;
      spyOn(service, 'convertirMonto').and.callFake((amount: number) => Number(amount) || 0);
      const spy = spyOn(service, 'onCollectionValidToSend');

      service.checkTolerancia();

      expect(spy).toHaveBeenCalledWith(true);
    });
  });

  describe('COB hardening P0/P1 (send gates / money)', () => {
    beforeEach(() => {
      service.tipoPagoEfectivo = false;
      service.tipoPagoCheque = false;
      service.tipoPagoDeposito = false;
      service.tipoPagoTransferencia = false;
      service.tipoPagoPagoMovil = false;
      service.tipoPagoOtros = false;
      service.pagoEfectivo = [];
      service.pagoDeposito = [];
      service.pagoOtros = [];
    });

    it('P0: multi-method incomplete when deposito missing fields even if efectivo ok', () => {
      service.tipoPagoEfectivo = true;
      service.tipoPagoDeposito = true;
      service.pagoEfectivo = [{ monto: 50 } as any];
      service.pagoDeposito = [{
        monto: 50,
        fecha: '2026-08-04',
        nombreBanco: 'Banco',
        numeroCuenta: '0102',
        numeroDeposito: '',
      } as any];

      expect(service.hasIncompletePaymentMethods()).toBeTrue();
    });

    it('COB-DOCS-001: applyExistingSelection restores partial flag and paid amount', () => {
      spyOn(service, 'convertirMonto').and.callFake((amount: number) => Number(amount) || 0);
      service.collection = {
        coCurrency: 'USD',
        nuValueLocal: 1,
        stDelivery: service.COLLECT_STATUS_NEW,
        stCollection: service.COLLECT_STATUS_NEW,
        isSave: 0,
        collectionDetails: [{
          idDocument: 7,
          coDocument: 'FAC-7',
          inPaymentPartial: true,
          nuAmountPaid: 40,
          isSave: true,
          daVoucher: '',
          nuAmountRetention: 0,
          nuAmountRetention2: 0,
          nuValueLocal: 1,
          nuVoucherRetention: 0,
        }],
      } as any;
      service.documentSales = [{
        idDocument: 7,
        coDocument: 'FAC-7',
        nuBalance: 100,
        isSelected: false,
        inPaymentPartial: false,
        nuAmountPaid: 0,
        isSave: false,
      } as DocumentSale];
      service.documentSalesBackup = [{ ...service.documentSales[0] } as DocumentSale];

      (service as any).applyExistingSelection(0, service.documentSales[0], service.documentSalesBackup[0]);

      expect(service.documentSales[0].isSelected).toBeTrue();
      expect(service.documentSales[0].inPaymentPartial).toBeTrue();
      expect(service.documentSales[0].nuAmountPaid).toBe(40);
      expect(service.documentSales[0].positionCollecDetails).toBe(0);
    });

    it('DM-COB-042: Otros is complete with positive amount and name', () => {
      service.tipoPagoOtros = true;
      service.pagoOtros = [{ monto: 25, nombre: 'Ajuste QA' } as any];
      expect(service.isIndexedPaymentMethodComplete('ot', 0)).toBeTrue();
      expect(service.hasIncompletePaymentMethods()).toBeFalse();

      service.pagoOtros[0].nombre = '';
      expect(service.hasIncompletePaymentMethods()).toBeTrue();
    });

    it('P1: enableDifferenceCodes blocks send when Otros lacks difference code', async () => {
      service.enableDifferenceCodes = true;
      service.tolerancia0 = false;
      service.alwaysPartialPayment = false;
      service.enablePartialPayment = true;
      service.existPartialPayment = false;
      service.montoTotalPagar = 25;
      service.montoTotalPagado = 25;
      service.collection = {
        coType: '0',
        coCurrency: 'USD',
        collectionDetails: [{
          idDocument: 1,
          coDocument: 'FAC-1',
          isSave: true,
          inPaymentPartial: false,
        }],
        collectionPayments: [{
          coType: 'ot',
          coPaymentMethod: 'ot',
          nuAmountPartial: 25,
          idDifferenceCode: null,
          coDifferenceCode: '',
        }],
      } as any;
      service.documentSales = [{
        idDocument: 1,
        coDocument: 'FAC-1',
        isSelected: true,
        isSave: true,
        positionCollecDetails: 0,
      } as DocumentSale];
      (service as any).currencyService = {
        formatNumber: (n: number) => String(n ?? 0),
      };
      spyOn(service, 'cleanFormattedNumber').and.callFake((v: string | number) => Number(v) || 0);
      spyOn(service, 'hasIncompletePaymentMethods').and.returnValue(false);
      spyOn(service, 'validateReferencePayment').and.resolveTo(true);
      const spy = spyOn(service, 'onCollectionValidToSend');

      await service.validateToSend();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('P1: IGTF embedded increases montoTotalPagar', async () => {
      const svc = service as any;
      spyOn(service, 'convertirMonto').and.callFake((amount: number) => Number(amount) || 0);
      spyOn(svc.currencyService, 'formatNumber').and.callFake((n: number) => String(n ?? 0));
      spyOn(service, 'cleanFormattedNumber').and.callFake((value: string | number) => Number(value) || 0);
      spyOn(svc, 'resolveAutomatedPrepaid').and.stub();
      spyOn(service, 'syncAddPaymentMethodDisabledState').and.stub();
      spyOn(svc, 'syncCollectionDetailsIgtfAmounts').and.stub();
      spyOn(svc, 'syncCollectionIgtfFields').and.stub();
      spyOn(svc, 'applyCollectionIgtfAmountFields').and.stub();

      service.userCanSelectIGTF = true;
      service.multiCurrency = false;
      service.separateIgtf = false;
      service.coTypeModule = '0';
      service.isOpen = false;
      service.isChangePaymentPartialPersistence = false;
      service.isRateChangeInProgress = false;
      service.montoTotalPagado = 0;
      service.igtfSelected = { price: 3 } as any;
      service.documentSales = [] as DocumentSale[];
      service.documentSalesBackup = [] as DocumentSale[];
      service.collection = {
        coType: '0',
        coCurrency: 'USD',
        nuValueLocal: 1,
        stDelivery: service.COLLECT_STATUS_NEW,
        stCollection: service.COLLECT_STATUS_NEW,
        collectionDetails: [{
          idDocument: 10,
          coDocument: 'FAC-10',
          inPaymentPartial: false,
          nuAmountPaid: 100,
          nuAmountPaidConversion: 100,
          nuBalanceDoc: 100,
          nuBalanceDocOriginal: 100,
          nuAmountDoc: 100,
          nuAmountDiscount: 0,
          nuAmountCollectDiscount: 0,
          nuAmountRetention: 0,
          nuAmountRetention2: 0,
          nuAmountIgtf: 0,
          isSave: true,
        }],
        collectionPayments: [],
        nuAmountIgtf: 0,
      } as any;

      await service.calculatePayment('', 0, true, true);

      expect(service.montoIgtf).toBe(3);
      expect(service.montoTotalPagar).toBe(103);
    });

    it('P1: shouldCreateAutomatedPrepaidOnSend requires excess >= prepaid range', () => {
      service.automatedPrepaid = true;
      service.coTypeModule = '0';
      service.existPartialPayment = false;
      service.createAutomatedPrepaid = true;
      service.anticipoAutomatico = [{ type: 'ef' } as any];
      service.prepaidRangeAmount = 10;
      spyOn(service as any, 'getPrepaidExcessAmount').and.returnValue(50);

      expect(service.shouldCreateAutomatedPrepaidOnSend()).toBeTrue();

      (service as any).getPrepaidExcessAmount.and.returnValue(10);
      expect(service.shouldCreateAutomatedPrepaidOnSend()).toBeTrue();

      (service as any).getPrepaidExcessAmount.and.returnValue(5);
      expect(service.shouldCreateAutomatedPrepaidOnSend()).toBeFalse();
    });

    describe('COB-PREPAID-001 automated prepaid vs tolerancia', () => {
      function setupUsdPrepaidScenario(excess: number): void {
        service.automatedPrepaid = true;
        service.coTypeModule = '0';
        service.existPartialPayment = false;
        service.prepaidRangeAmount = 1;
        service.prepaidRangeCurrency = 'USD';
        service.tolerancia0 = true;
        service.TipoTolerancia = 0;
        service.RangoToleranciaPositiva = 100000;
        service.MonedaTolerancia = 'USD';
        service.collection = { coCurrency: 'USD' } as any;
        spyOn(service as any, 'syncPrepaidDifferenceAmounts').and.returnValue(excess);
        spyOn(service as any, 'syncExchangeRateToCollectionHeader').and.stub();
        spyOn(service as any, 'checkTiposPago').and.stub();
        spyOn(service as any, 'setAutomatedPrepaid').and.callFake(() => {
          service.anticipoAutomatico = [{ type: 'ef' }];
        });
        spyOn(service, 'validateToSend').and.stub();
        spyOn(service as any, 'syncAddPaymentMethodDisabledState').and.stub();
      }

      it('USD: exceso 1.54 con rango+ tolerancia alto sigue contando para anticipo', () => {
        setupUsdPrepaidScenario(1.54);

        const prepaidExcess = (service as any).getPrepaidExcessAmount();
        expect(prepaidExcess).toBeCloseTo(1.54, 2);

        (service as any).resolveAutomatedPrepaid('ef', 0);
        expect(service.createAutomatedPrepaid).toBeTrue();
      });

      it('umbral exacto: exceso = prepaidRangeAmount crea anticipo', () => {
        setupUsdPrepaidScenario(1);

        (service as any).resolveAutomatedPrepaid('ef', 0);
        expect(service.createAutomatedPrepaid).toBeTrue();
      });

      it('bajo umbral: exceso 0.5 con mínimo 1 no crea anticipo', () => {
        setupUsdPrepaidScenario(0.5);

        (service as any).resolveAutomatedPrepaid('ef', 0);
        expect(service.createAutomatedPrepaid).toBeFalse();
      });
    });

    describe('COB-PREPAID-002 createAnticipo enqueuePending + batch', () => {
      function buildSourceCollection(): any {
        return {
          nuDifference: 25,
          collectionPayments: [{
            idCollectionDetail: 1,
            coPaymentMethod: 'ef',
            idBank: 0,
            nuPaymentDoc: '',
            naBank: '',
            coClientBankAccount: '',
            nuClientBankAccount: '',
            daValue: '2026-01-01',
            daCollectionPayment: '2026-01-01',
            nuCollectionPayment: 1,
            idDifferenceCode: 0,
            coDifferenceCode: '',
            nuBankAccount: '',
            idTypeDocument: 0,
            nuDocument: '',
            idCodePhoneNumber: 0,
            nuPhoneNumber: '',
          }],
        };
      }

      it('enqueuePending=false no emite saveSend y retorna coCollection', async () => {
        service.anticipoAutomatico = [{ type: 'ef', posCollectionPayment: 0 }];
        const collection = buildSourceCollection();
        const db = { executeSql: jasmine.createSpy('executeSql').and.resolveTo({}) } as any;
        spyOn(service, 'saveSendCollection');

        const result = await service.createAnticipoCollectionPayment(
          db,
          collection,
          'ANT-NEW-1',
          25,
          25,
          false,
        );

        expect(result).toBe('ANT-NEW-1');
        expect(service.saveSendCollection).not.toHaveBeenCalled();
      });

      it('enqueuePending default true emite saveSend', async () => {
        service.anticipoAutomatico = [{ type: 'ef', posCollectionPayment: 0 }];
        const collection = buildSourceCollection();
        const db = { executeSql: jasmine.createSpy('executeSql').and.resolveTo({}) } as any;
        spyOn(service, 'saveSendCollection');

        const result = await service.createAnticipoCollectionPayment(
          db,
          collection,
          'ANT-NEW-2',
          25,
          25,
        );

        expect(result).toBe('ANT-NEW-2');
        expect(service.saveSendCollection).toHaveBeenCalledWith('ANT-NEW-2');
      });

      it('buildCollectPendingBatch ordena cobro → anticipo', () => {
        const onlyCobro = service.buildCollectPendingBatch('COB-1');
        expect(onlyCobro.length).toBe(1);
        expect(onlyCobro[0].coTransaction).toBe('COB-1');
        expect(onlyCobro[0].type).toBe('collect');

        const withAnticipo = service.buildCollectPendingBatch('COB-1', 'ANT-1');
        expect(withAnticipo.map((t) => t.coTransaction)).toEqual(['COB-1', 'ANT-1']);
        expect(withAnticipo.every((t) => t.type === 'collect')).toBeTrue();
      });
    });

    it('P1: isRetentionInvalid when sum exceeds balance or both zero', () => {
      expect(service.isRetentionInvalid(10, 1, 5)).toBeTrue();
      expect(service.isRetentionInvalid(0, 0, 100)).toBeTrue();
      expect(service.isRetentionInvalid(10, 1, 20)).toBeFalse();
    });

    it('P1: syncAddPaymentMethodDisabledState blocks add when difference >= 0', () => {
      service.coTypeModule = '0';
      service.createAutomatedPrepaid = false;
      service.disabledSelectCollectMethodDisabled = false;
      (service as any).currencyService = {
        formatNumber: (n: number) => String(n ?? 0),
      };
      spyOn(service, 'cleanFormattedNumber').and.callFake((v: string | number) => Number(v) || 0);
      service.collection = {
        collectionDetails: [{ idDocument: 1 }],
        nuDifference: 0,
      } as any;

      service.syncAddPaymentMethodDisabledState();

      expect(service.isAddPaymentMethodDisabled()).toBeTrue();

      service.collection.nuDifference = -15;
      service.syncAddPaymentMethodDisabledState();
      expect(service.isAddPaymentMethodDisabled()).toBeFalse();
    });

    it('P1: hasValidDocumentSalesForSend requires selected ready document', () => {
      service.isOpen = false;
      service.collection = {
        stDelivery: service.COLLECT_STATUS_NEW,
        stCollection: service.COLLECT_STATUS_NEW,
        isSave: 0,
        collectionDetails: [{
          idDocument: 1,
          coDocument: 'FAC-1',
          isSave: true,
          nuAmountCollectDiscount: 0,
        }],
      } as any;
      service.documentSales = [] as DocumentSale[];

      expect((service as any).hasValidDocumentSalesForSend()).toBeFalse();

      service.documentSales = [{
        idDocument: 1,
        coDocument: 'FAC-1',
        isSelected: true,
        isSave: true,
        positionCollecDetails: 0,
      } as DocumentSale];

      expect((service as any).hasValidDocumentSalesForSend()).toBeTrue();
    });
  });

  describe('COB hardening wave 2', () => {
    function stubMoneyFormatters(): void {
      const svc = service as any;
      spyOn(service, 'convertirMonto').and.callFake((amount: number) => Number(amount) || 0);
      spyOn(svc.currencyService, 'formatNumber').and.callFake((n: number) => String(n ?? 0));
      spyOn(service, 'cleanFormattedNumber').and.callFake((value: string | number) => Number(value) || 0);
    }

    it('COB-DOCS-001: addSelectedDocumentsSalesFromMemory reinjects off-page selected docs', async () => {
      stubMoneyFormatters();
      const pageDoc = {
        idDocument: 1,
        coDocument: 'FAC-1',
        nuBalance: 200,
        isSelected: true,
        inPaymentPartial: false,
        isSave: true,
      } as DocumentSale;

      service.mapDocumentsSales = new Map<number, DocumentSale>([[1, pageDoc]]);
      service.documentSales = [pageDoc];
      service.documentSalesBackup = [{ ...pageDoc } as DocumentSale];
      service.documentSalesPageIds = new Set<number>([1]);
      service.collection = {
        coCurrency: 'USD',
        nuValueLocal: 1,
        stDelivery: service.COLLECT_STATUS_NEW,
        stCollection: service.COLLECT_STATUS_NEW,
        isSave: 0,
        collectionDetails: [
          {
            idDocument: 1,
            coDocument: 'FAC-1',
            inPaymentPartial: false,
            nuAmountPaid: 200,
            isSave: true,
            daVoucher: '',
            nuAmountRetention: 0,
            nuAmountRetention2: 0,
            nuValueLocal: 1,
            nuVoucherRetention: 0,
          },
          {
            idDocument: 2,
            coDocument: 'FAC-2',
            inPaymentPartial: true,
            nuAmountPaid: 40,
            isSave: true,
            daVoucher: '',
            nuAmountRetention: 0,
            nuAmountRetention2: 0,
            nuValueLocal: 1,
            nuVoucherRetention: 0,
          },
        ],
      } as any;

      const dbMock = {
        executeSql: jasmine.createSpy('executeSql').and.resolveTo({
          rows: {
            length: 1,
            item: () => ({
              id_document: 2,
              id_client: 1,
              co_client: 'C1',
              id_document_sale_type: 1,
              co_document_sale_type: 'FAC',
              da_document: '2026-08-01',
              da_due_date: '2026-08-15',
              nu_amount_base: 100,
              nu_amount_discount: 0,
              nu_amount_tax: 0,
              nu_amount_total: 100,
              nu_amount_paid: 0,
              nu_balance: 100,
              co_currency: 'USD',
              id_currency: 1,
              nu_document: '2',
              tx_comment: '',
              co_document: 'FAC-2',
              co_collection: '',
              nu_value_local: 1,
              st_document_sale: 0,
              co_enterprise: 'E1',
              id_enterprise: 1,
              naType: 'FAC',
            }),
          },
        }),
      };

      await (service as any).addSelectedDocumentsSalesFromMemory(dbMock, false);

      expect(dbMock.executeSql).toHaveBeenCalled();
      expect(service.documentSales.length).toBe(2);
      expect(service.documentSales[1].idDocument).toBe(2);
      expect(service.documentSales[1].isSelected).toBeTrue();
      expect(service.documentSales[1].inPaymentPartial).toBeTrue();
      expect(service.documentSales[1].nuAmountPaid).toBe(40);
      expect(service.documentSalesPageIds.has(2)).toBeFalse();
    });

    it('P1: separateIgtf keeps montoTotalPagar as net (IGTF not embedded)', async () => {
      const svc = service as any;
      stubMoneyFormatters();
      spyOn(svc, 'resolveAutomatedPrepaid').and.stub();
      spyOn(service, 'syncAddPaymentMethodDisabledState').and.stub();
      spyOn(svc, 'syncCollectionDetailsIgtfAmounts').and.stub();
      spyOn(svc, 'syncCollectionIgtfFields').and.stub();
      spyOn(svc, 'applyCollectionIgtfAmountFields').and.stub();

      service.userCanSelectIGTF = true;
      service.multiCurrency = false;
      service.separateIgtf = true;
      service.coTypeModule = '0';
      service.isOpen = false;
      service.isChangePaymentPartialPersistence = false;
      service.isRateChangeInProgress = false;
      service.montoTotalPagado = 0;
      service.igtfSelected = { price: 3 } as any;
      service.documentSales = [] as DocumentSale[];
      service.documentSalesBackup = [] as DocumentSale[];
      service.collection = {
        coType: '0',
        coCurrency: 'USD',
        nuValueLocal: 1,
        stDelivery: service.COLLECT_STATUS_NEW,
        stCollection: service.COLLECT_STATUS_NEW,
        collectionDetails: [{
          idDocument: 10,
          coDocument: 'FAC-10',
          inPaymentPartial: false,
          nuAmountPaid: 100,
          nuAmountPaidConversion: 100,
          nuBalanceDoc: 100,
          nuBalanceDocOriginal: 100,
          nuAmountDoc: 100,
          nuAmountDiscount: 0,
          nuAmountCollectDiscount: 0,
          nuAmountRetention: 0,
          nuAmountRetention2: 0,
          nuAmountIgtf: 0,
          isSave: true,
        }],
        collectionPayments: [],
        nuAmountIgtf: 0,
      } as any;

      await service.calculatePayment('', 0, true, true);

      expect(service.montoIgtf).toBe(3);
      expect(service.montoTotalPagar).toBe(100);
      expect(service.montoTotalPagar).not.toBe(103);
    });

    it('P1: validateReferencePayment rejects non-cash without reference', async () => {
      const spy = spyOn(service, 'onCollectionValidToSend');
      service.collection = {
        collectionPayments: [{
          coType: 'tr',
          coPaymentMethod: 'tr',
          nuAmountPartial: 50,
          nuPaymentDoc: '',
          nuCollectionPayment: '',
          nuClientBankAccount: '',
        }],
      } as any;

      await expectAsync(service.validateReferencePayment()).toBeResolvedTo(false);
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('P1: validateReferencePayment allows cash without reference and valid amount', async () => {
      service.collection = {
        collectionPayments: [{
          coType: 'ef',
          coPaymentMethod: 'ef',
          nuAmountPartial: 50,
          nuPaymentDoc: '',
        }],
      } as any;

      await expectAsync(service.validateReferencePayment()).toBeResolvedTo(true);
    });

    it('P1: validateReferencePayment rejects zero partial amount', async () => {
      const spy = spyOn(service, 'onCollectionValidToSend');
      service.collection = {
        collectionPayments: [{
          coType: 'ef',
          coPaymentMethod: 'ef',
          nuAmountPartial: 0,
        }],
      } as any;

      await expectAsync(service.validateReferencePayment()).toBeResolvedTo(false);
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('DM-COB-028: anticipo validateToSend enables when payment partial amount > 0', async () => {
      (service as any).currencyService = {
        formatNumber: (n: number) => String(n ?? 0),
      };
      spyOn(service, 'cleanFormattedNumber').and.callFake((v: string | number) => Number(v) || 0);
      spyOn(service, 'hasIncompletePaymentMethods').and.returnValue(false);
      const spy = spyOn(service, 'onCollectionValidToSend');

      service.montoTotalPagar = 0;
      service.montoTotalPagado = 80;
      service.collection = {
        coType: '1',
        collectionDetails: [],
        collectionPayments: [{
          coType: 'ef',
          coPaymentMethod: 'ef',
          nuAmountPartial: 80,
        }],
      } as any;

      await service.validateToSend();

      expect(spy).toHaveBeenCalledWith(true);
    });

    it('DM-COB-028: anticipo validateToSend disables when payments lack partial amount', async () => {
      (service as any).currencyService = {
        formatNumber: (n: number) => String(n ?? 0),
      };
      spyOn(service, 'cleanFormattedNumber').and.callFake((v: string | number) => Number(v) || 0);
      spyOn(service, 'hasIncompletePaymentMethods').and.returnValue(false);
      const spy = spyOn(service, 'onCollectionValidToSend');

      service.collection = {
        coType: '1',
        collectionDetails: [],
        collectionPayments: [{
          coType: 'ef',
          coPaymentMethod: 'ef',
          nuAmountPartial: 0,
        }],
      } as any;

      await service.validateToSend();

      expect(spy).toHaveBeenCalledWith(false);
    });
  });

  describe('COB-RET-001 multi-document retention completeness', () => {
    function legacyCompleteDetail(overrides: Partial<CollectionDetail> = {}): CollectionDetail {
      return {
        coDocument: 'FAC-A',
        nuAmountRetention: 10,
        nuAmountRetention2: 0,
        nuVoucherRetention: '1234567890',
        daVoucher: '2026-08-05',
        ...overrides,
      } as CollectionDetail;
    }

    beforeEach(() => {
      service.dynamicRetentions = false;
      service.sizeRetention = 0;
      service.collectRetentions = [];
    });

    it('COB-RET-001: validateToSend OFF when one selected doc has zero retention', async () => {
      const spy = spyOn(service, 'onCollectionValidToSend');
      service.collection = {
        coType: '2',
        collectionDetails: [
          legacyCompleteDetail({ coDocument: 'FAC-A' }),
          legacyCompleteDetail({
            coDocument: 'FAC-B',
            nuAmountRetention: 0,
            nuAmountRetention2: 0,
            nuVoucherRetention: '',
            daVoucher: '',
          }),
        ],
      } as any;

      await service.validateToSend();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('COB-RET-002: validateToSend ON when all selected docs are complete', async () => {
      const spy = spyOn(service, 'onCollectionValidToSend');
      service.collection = {
        coType: '2',
        collectionDetails: [
          legacyCompleteDetail({ coDocument: 'FAC-A' }),
          legacyCompleteDetail({
            coDocument: 'FAC-B',
            nuAmountRetention: 5,
            nuVoucherRetention: 'ABC',
            daVoucher: '2026-08-04',
          }),
        ],
      } as any;

      await service.validateToSend();

      expect(spy).toHaveBeenCalledWith(true);
    });

    it('COB-RET-003: validateToSend ON for single complete retention detail', async () => {
      const spy = spyOn(service, 'onCollectionValidToSend');
      service.collection = {
        coType: '2',
        collectionDetails: [legacyCompleteDetail()],
      } as any;

      await service.validateToSend();

      expect(spy).toHaveBeenCalledWith(true);
    });

    it('COB-RET-004: validateToSend OFF when dynamic retention line is incomplete', async () => {
      const spy = spyOn(service, 'onCollectionValidToSend');
      service.dynamicRetentions = true;
      service.collectRetentions = [{
        idCollectRetention: 1,
        requireInput: true,
        nuVoucherLength: 10,
      } as any];
      service.collection = {
        coType: '2',
        collectionDetails: [{
          coDocument: 'FAC-A',
          nuAmountRetention: 0,
          nuAmountRetention2: 0,
          collectionDetailRetentions: [{
            idCollectRetention: 1,
            nuAmountRetention: 15,
            nuVoucherRetention: '',
            daVoucherRetention: '2026-08-05',
          }],
        }],
      } as any;

      await service.validateToSend();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('COB-RET-005: isRetentionDetailComplete / areAllRetentionDetailsComplete unit cases', () => {
      expect(service.areAllRetentionDetailsComplete([])).toBeFalse();
      expect(service.areAllRetentionDetailsComplete(undefined)).toBeFalse();
      expect(service.isRetentionDetailComplete(null)).toBeFalse();

      const complete = legacyCompleteDetail();
      expect(service.isRetentionDetailComplete(complete)).toBeTrue();
      expect(service.areAllRetentionDetailsComplete([complete])).toBeTrue();

      const zeroAmount = legacyCompleteDetail({ nuAmountRetention: 0, nuAmountRetention2: 0 });
      expect(service.isRetentionDetailComplete(zeroAmount)).toBeFalse();

      const missingVoucher = legacyCompleteDetail({ nuVoucherRetention: '   ' });
      expect(service.isRetentionDetailComplete(missingVoucher)).toBeFalse();

      const missingDate = legacyCompleteDetail({ daVoucher: '' });
      expect(service.isRetentionDetailComplete(missingDate)).toBeFalse();

      service.sizeRetention = 10;
      expect(service.isRetentionDetailComplete(legacyCompleteDetail({ nuVoucherRetention: '123' }))).toBeFalse();
      expect(service.isRetentionDetailComplete(legacyCompleteDetail({ nuVoucherRetention: '1234567890' }))).toBeTrue();

      service.dynamicRetentions = true;
      service.collectRetentions = [{
        idCollectRetention: 7,
        requireInput: true,
        nuVoucherLength: 5,
      } as any];
      const dynamicOk = {
        coDocument: 'FAC-D',
        collectionDetailRetentions: [{
          idCollectRetention: 7,
          nuAmountRetention: 3,
          nuVoucherRetention: '12345',
          daVoucherRetention: '2026-01-01',
        }],
      } as CollectionDetail;
      expect(service.isRetentionDetailComplete(dynamicOk)).toBeTrue();

      const dynamicNoId = {
        coDocument: 'FAC-D2',
        collectionDetailRetentions: [{
          idCollectRetention: 0,
          nuAmountRetention: 3,
          nuVoucherRetention: '12345',
          daVoucherRetention: '2026-01-01',
        }],
      } as CollectionDetail;
      expect(service.isRetentionDetailComplete(dynamicNoId)).toBeFalse();

      expect(service.areAllRetentionDetailsComplete([complete, zeroAmount])).toBeFalse();
    });
  });

  describe('COB-TOTAL-001 Total General nuAmountTotal on reopen/persist', () => {
    function stubTotalSideEffects(): void {
      const svc = service as any;
      spyOn(service, 'convertirMonto').and.callFake((amount: number) => Number(amount) || 0);
      spyOn(svc.currencyService, 'formatNumber').and.callFake((n: number) => String(n ?? 0));
      spyOn(service, 'cleanFormattedNumber').and.callFake((value: string | number) => Number(value) || 0);
      spyOn(svc, 'shouldApplyIgtfToCollection').and.returnValue(false);
      spyOn(svc, 'shouldCalculateEmbeddedIgtf').and.returnValue(false);
      spyOn(svc, 'isRetentionCollection').and.returnValue(false);
      spyOn(svc, 'resolveAutomatedPrepaid').and.stub();
      spyOn(service, 'syncAddPaymentMethodDisabledState').and.stub();
      spyOn(svc, 'syncCollectionDetailsIgtfAmounts').and.stub();
      spyOn(svc, 'syncCollectionIgtfFields').and.stub();
      spyOn(svc, 'applyCollectionIgtfAmountFields').and.stub();
      spyOn(svc, 'restoreCollectionIgtfFields').and.stub();
      spyOn(svc, 'restorePersistedIgtfDisplayAmounts').and.stub();
    }

    function setupSavedHardCollection(): void {
      stubTotalSideEffects();
      service.coTypeModule = '0';
      service.isOpen = false;
      service.isChangePaymentPartialPersistence = false;
      service.isRateChangeInProgress = false;
      service.tipoPagoTransferencia = true;
      service.tipoPagoEfectivo = false;
      service.tipoPagoCheque = false;
      service.tipoPagoDeposito = false;
      service.tipoPagoPagoMovil = false;
      service.tipoPagoOtros = false;
      service.pagoTransferencia = [] as any[];
      service.pagoEfectivo = [] as any[];
      service.pagoCheque = [] as any[];
      service.pagoDeposito = [] as any[];
      service.pagoMovil = [] as any[];
      service.pagoOtros = [] as any[];
      service.montoTotalPagado = 0;
      service.montoTotalPagar = 0;
      service.documentSales = [] as DocumentSale[];
      service.documentSalesBackup = [] as DocumentSale[];
      service.collection = {
        coCurrency: 'USD',
        nuValueLocal: 36.5,
        stDelivery: service.COLLECT_STATUS_SAVED,
        stCollection: service.COLLECT_STATUS_SAVED,
        coType: '0',
        nuAmountFinal: 2000.94,
        nuAmountFinalConversion: 73034.31,
        nuAmountTotal: 2000.94,
        nuAmountTotalConversion: 73034.31,
        nuAmountPaid: 2000.94,
        nuAmountPaidConversion: 73034.31,
        nuAmountIgtf: 0,
        collectionDetails: [{
          idDocument: 10,
          coDocument: 'FAC-10',
          inPaymentPartial: false,
          nuAmountPaid: 2000.94,
          nuAmountPaidConversion: 2000.94,
          nuBalanceDoc: 2000.94,
          nuBalanceDocOriginal: 2000.94,
          nuAmountDoc: 2000.94,
          nuAmountDiscount: 0,
          nuAmountCollectDiscount: 0,
          nuAmountRetention: 0,
          nuAmountRetention2: 0,
          nuAmountIgtf: 0,
          isSave: true,
        }] as CollectionDetail[],
        collectionPayments: [{
          coPaymentMethod: 'tr',
          nuAmountPartial: 2000.94,
          nuAmountPartialConversion: 73034.31,
        }],
      } as any;
    }

    it('forceRecalc with empty UI arrays keeps nuAmountTotal from collectionPayments', async () => {
      setupSavedHardCollection();

      await service.calculatePayment('', 0, true, true);

      expect(service.montoTotalPagado).toBe(2000.94);
      expect(service.collection.nuAmountTotal).toBe(2000.94);
      expect(service.collection.nuAmountTotal).not.toBe(0);
    });

    it('preserve path after UI hydrate syncs nuAmountTotal to montoTotalPagado', async () => {
      setupSavedHardCollection();
      service.collection.nuAmountTotal = 0;
      service.collection.nuAmountTotalConversion = 0;
      service.pagoTransferencia = [{
        monto: 2000.94,
        montoConversion: 73034.31,
        type: 'tr',
        posCollectionPayment: 0,
      }] as any[];

      await service.calculatePayment('', 0, false, true);

      expect(service.montoTotalPagar).toBe(2000.94);
      expect(service.montoTotalPagado).toBe(2000.94);
      expect(service.collection.nuAmountTotal).toBe(2000.94);
    });

    it('syncNuAmountTotalFromPaidAmounts aligns header before persist (normal cobro)', () => {
      stubTotalSideEffects();
      service.coTypeModule = '0';
      service.montoTotalPagado = 150.5;
      service.collection = {
        coCurrency: 'USD',
        coType: '0',
        nuAmountTotal: 0,
        nuAmountTotalConversion: 0,
        collectionPayments: [],
      } as any;

      (service as any).syncNuAmountTotalFromPaidAmounts();

      expect(service.collection.nuAmountTotal).toBe(150.5);
      expect(service.collection.nuAmountTotalConversion).toBe(150.5);
    });

    it('retention syncNuAmountTotalFromPaidAmounts does not overwrite retention totals', () => {
      stubTotalSideEffects();
      (service as any).isRetentionCollection.and.returnValue(true);
      service.coTypeModule = '2';
      service.montoTotalPagado = 99;
      service.collection = {
        coCurrency: 'USD',
        coType: '2',
        nuAmountTotal: 40,
        nuAmountTotalConversion: 40,
        collectionPayments: [],
      } as any;

      (service as any).syncNuAmountTotalFromPaidAmounts();

      expect(service.collection.nuAmountTotal).toBe(40);
    });

    it('SENT forceRecalc with empty UI also restores paid from collectionPayments', async () => {
      setupSavedHardCollection();
      service.collection.stDelivery = service.COLLECT_STATUS_SENT;
      service.collection.nuAmountTotal = 2000.94;

      await service.calculatePayment('', 0, true, true);

      expect(service.montoTotalPagado).toBe(2000.94);
      expect(service.collection.nuAmountTotal).toBe(2000.94);
    });
  });

  describe('COB-DISC-001 attachCollectionDetailDiscountsToDetails', () => {
    it('attaches manual discount only to matching coDocument', () => {
      const details = [
        { coDocument: 'FF081402', coCollection: 'COB-1', collectionDetailDiscounts: [] },
        { coDocument: 'FF082165', coCollection: 'COB-1', collectionDetailDiscounts: [] },
      ] as any[];
      const discounts = [{
        coCollection: 'COB-1',
        coDocument: 'FF081402',
        idCollectDiscount: -1,
        naCollectDiscountOther: 'Descuento manual',
        nuAmountCollectDiscountOther: 8,
      }] as any[];

      service.attachCollectionDetailDiscountsToDetails(details, discounts);

      expect(details[0].collectionDetailDiscounts.length).toBe(1);
      expect(details[0].collectionDetailDiscounts[0].nuAmountCollectDiscountOther).toBe(8);
      expect(details[1].collectionDetailDiscounts).toEqual([]);
    });

    it('keeps distinct discounts per document without cross-leak', () => {
      const details = [
        { coDocument: 'DOC-A', collectionDetailDiscounts: [] },
        { coDocument: 'DOC-B', collectionDetailDiscounts: [] },
      ] as any[];
      const discounts = [
        {
          coDocument: 'DOC-A',
          idCollectDiscount: -1,
          nuAmountCollectDiscountOther: 8,
        },
        {
          coDocument: 'DOC-B',
          idCollectDiscount: 12,
          nuAmountCollectDiscountOther: 3,
        },
      ] as any[];

      service.attachCollectionDetailDiscountsToDetails(details, discounts);

      expect(details[0].collectionDetailDiscounts.map((d: any) => d.idCollectDiscount)).toEqual([-1]);
      expect(details[1].collectionDetailDiscounts.map((d: any) => d.idCollectDiscount)).toEqual([12]);
    });

    it('matches coDocument after normalizeCoDocument trims spaces', () => {
      const details = [
        { coDocument: 'FF081402', collectionDetailDiscounts: [] },
      ] as any[];
      const discounts = [{
        coDocument: '  FF081402  ',
        idCollectDiscount: -1,
        nuAmountCollectDiscountOther: 8,
      }] as any[];

      service.attachCollectionDetailDiscountsToDetails(details, discounts);

      expect(details[0].collectionDetailDiscounts.length).toBe(1);
      expect(details[0].collectionDetailDiscounts[0].nuAmountCollectDiscountOther).toBe(8);
    });
  });

  describe('COB-FALT-001 faltante→0 refreshes montoTotalPagar on SAVED', () => {
    function makeDetail(partial: Partial<CollectionDetail>): CollectionDetail {
      return {
        idDocument: 1,
        coDocument: 'FAC-1',
        inPaymentPartial: false,
        nuAmountPaid: 0,
        nuAmountPaidConversion: 0,
        nuBalanceDoc: 0,
        nuBalanceDocConversion: 0,
        nuBalanceDocOriginal: 0,
        nuAmountDoc: 0,
        nuAmountDiscount: 0,
        nuAmountDiscountConversion: 0,
        nuAmountCollectDiscount: 0,
        nuAmountRetention: 0,
        nuAmountRetention2: 0,
        nuAmountIgtf: 0,
        isSave: true,
        ...partial,
      } as CollectionDetail;
    }

    function stubPaymentSideEffects(): void {
      const svc = service as any;
      spyOn(service, 'convertirMonto').and.callFake((amount: number) => Number(amount) || 0);
      spyOn(svc.currencyService, 'formatNumber').and.callFake((n: number) => String(n ?? 0));
      spyOn(service, 'cleanFormattedNumber').and.callFake((value: string | number) => Number(value) || 0);
      spyOn(svc, 'shouldApplyIgtfToCollection').and.returnValue(false);
      spyOn(svc, 'shouldCalculateEmbeddedIgtf').and.returnValue(false);
      spyOn(svc, 'isRetentionCollection').and.returnValue(false);
      spyOn(svc, 'resolveAutomatedPrepaid').and.stub();
      spyOn(service, 'syncAddPaymentMethodDisabledState').and.stub();
      spyOn(svc, 'syncCollectionDetailsIgtfAmounts').and.stub();
      spyOn(svc, 'syncCollectionIgtfFields').and.stub();
      spyOn(svc, 'applyCollectionIgtfAmountFields').and.stub();
      spyOn(svc, 'restoreCollectionIgtfFields').and.stub();
      spyOn(svc, 'restorePersistedIgtfDisplayAmounts').and.stub();
    }

    it('SAVED: clearing faltante + syncing nuAmountPaid lifts montoTotalPagar to full balance', async () => {
      stubPaymentSideEffects();
      service.coTypeModule = '0';
      service.isOpen = false;
      service.isChangePaymentPartialPersistence = false;
      service.isRateChangeInProgress = false;
      service.montoTotalPagado = 400;
      service.documentSales = [{
        idDocument: 10,
        coDocument: 'FAC-10',
        isSelected: true,
        isSave: true,
        inPaymentPartial: false,
        nuAmountPaid: 400,
        positionCollecDetails: 0,
      } as DocumentSale];
      service.documentSalesBackup = [{
        idDocument: 10,
        nuBalance: 500,
        nuAmountPaid: 400,
        isSave: true,
      } as DocumentSale];
      service.collection = {
        coCurrency: 'USD',
        nuValueLocal: 1,
        stDelivery: service.COLLECT_STATUS_SAVED,
        stCollection: service.COLLECT_STATUS_SAVED,
        coType: '0',
        nuAmountFinal: 400,
        nuAmountPaid: 400,
        nuAmountTotal: 400,
        nuAmountIgtf: 0,
        collectionDetails: [
          makeDetail({
            idDocument: 10,
            coDocument: 'FAC-10',
            nuBalanceDoc: 500,
            nuBalanceDocOriginal: 500,
            nuAmountDoc: 500,
            nuAmountDiscount: 0,
            nuAmountPaid: 500,
            nuAmountPaidConversion: 500,
            isSave: true,
          }),
        ],
        collectionPayments: [{
          coPaymentMethod: 'ef',
          nuAmountPartial: 400,
        }],
      } as any;
      service.tipoPagoEfectivo = true;
      service.pagoEfectivo = [{ monto: 400, type: 'ef', posCollectionPayment: 0 }] as any[];

      await service.calculatePayment('', 0, true, true);

      expect(service.montoTotalPagar).toBe(500);
      expect(service.montoTotalPagar).not.toBe(400);
    });

    it('SAVED preserve: stale paid < expectedNet after faltante 0 does not freeze montoTotalPagar', async () => {
      stubPaymentSideEffects();
      service.coTypeModule = '0';
      service.isOpen = false;
      service.isChangePaymentPartialPersistence = false;
      service.isRateChangeInProgress = false;
      service.montoTotalPagado = 400;
      service.documentSales = [{
        idDocument: 10,
        coDocument: 'FAC-10',
        isSelected: true,
        isSave: true,
        inPaymentPartial: false,
        nuAmountPaid: 400,
        positionCollecDetails: 0,
      } as DocumentSale];
      service.documentSalesBackup = [{
        idDocument: 10,
        nuBalance: 500,
        nuAmountPaid: 400,
        isSave: true,
      } as DocumentSale];
      service.collection = {
        coCurrency: 'USD',
        nuValueLocal: 1,
        stDelivery: service.COLLECT_STATUS_SAVED,
        stCollection: service.COLLECT_STATUS_SAVED,
        coType: '0',
        nuAmountFinal: 400,
        nuAmountPaid: 400,
        nuAmountTotal: 400,
        nuAmountIgtf: 0,
        collectionDetails: [
          makeDetail({
            idDocument: 10,
            coDocument: 'FAC-10',
            nuBalanceDoc: 500,
            nuBalanceDocOriginal: 500,
            nuAmountDoc: 500,
            nuAmountDiscount: 0,
            // Neto viejo aún en detail (antes del sync de amountPaid)
            nuAmountPaid: 400,
            nuAmountPaidConversion: 400,
            isSave: true,
          }),
        ],
        collectionPayments: [{
          coPaymentMethod: 'tr',
          nuAmountPartial: 400,
        }],
      } as any;
      service.tipoPagoTransferencia = true;
      service.pagoTransferencia = [{ monto: 400, type: 'tr', posCollectionPayment: 0 }] as any[];

      await service.calculatePayment('', 0, false, true);

      expect(service.montoTotalPagar).toBe(500);
    });

    it('restoreDocumentSaleState restores faltante snapshot on cancel', () => {
      stubPaymentSideEffects();
      service.documentSales = [{
        idDocument: 10,
        coDocument: 'FAC-10',
        positionCollecDetails: 0,
        isSave: true,
        nuAmountPaid: 400,
      } as DocumentSale];
      service.documentSalesBackup = [{
        idDocument: 10,
        coDocument: 'FAC-10',
        positionCollecDetails: 0,
        isSave: true,
        nuBalance: 500,
        nuAmountPaid: 400,
      } as DocumentSale];
      service.collection = {
        coCurrency: 'USD',
        nuValueLocal: 1,
        stDelivery: service.COLLECT_STATUS_SAVED,
        collectionDetails: [
          makeDetail({
            idDocument: 10,
            coDocument: 'FAC-10',
            nuBalanceDoc: 500,
            nuAmountDiscount: 100,
            nuAmountDiscountConversion: 100,
            nuAmountPaid: 400,
            isSave: true,
          }),
        ],
        collectionPayments: [],
      } as any;

      service.captureOpenDetailFaltanteBackup(0);
      service.collection.collectionDetails[0].nuAmountDiscount = 0;
      service.collection.collectionDetails[0].nuAmountDiscountConversion = 0;

      service.restoreDocumentSaleState(0);

      expect(service.collection.collectionDetails[0].nuAmountDiscount).toBe(100);
      expect(service.collection.collectionDetails[0].nuAmountDiscountConversion).toBe(100);
    });

    it('partial payment still uses nuAmountPaid (not full balance) after faltante 0', async () => {
      stubPaymentSideEffects();
      service.coTypeModule = '0';
      service.isOpen = false;
      service.collection = {
        coCurrency: 'USD',
        nuValueLocal: 1,
        stDelivery: service.COLLECT_STATUS_SAVED,
        collectionDetails: [
          makeDetail({
            idDocument: 99,
            coDocument: 'FAC-99',
            inPaymentPartial: true,
            nuAmountPaid: 40,
            nuAmountPaidConversion: 40,
            nuBalanceDoc: 100,
            nuBalanceDocOriginal: 100,
            nuAmountDiscount: 0,
            isSave: true,
          }),
        ],
        collectionPayments: [],
        nuAmountIgtf: 0,
      } as any;
      service.documentSales = [] as DocumentSale[];
      service.documentSalesBackup = [] as DocumentSale[];

      await service.calculatePayment('', 0, true, true);

      expect(service.montoTotalPagar).toBe(40);
    });
  });

  describe('syncCollectionDetailDiscountConversion', () => {
    it('clears stale conversion when faltante local is set to 0', () => {
      service.collection = {
        coCurrency: 'VES',
        nuValueLocal: 36.5,
      } as any;

      const detail = {
        nuAmountDiscount: 0,
        nuAmountDiscountConversion: 13.5887,
      } as CollectionDetail;

      service.syncCollectionDetailDiscountConversion(detail);

      expect(detail.nuAmountDiscountConversion).toBe(0);
    });

    it('recalculates conversion when faltante local is positive', () => {
      service.collection = {
        coCurrency: 'VES',
        nuValueLocal: 2,
      } as any;
      spyOn(service, 'convertirMonto').and.returnValue(50);

      const detail = {
        nuAmountDiscount: 100,
        nuAmountDiscountConversion: 0,
      } as CollectionDetail;

      service.syncCollectionDetailDiscountConversion(detail);

      expect(service.convertirMonto).toHaveBeenCalled();
      expect(detail.nuAmountDiscountConversion).toBe(50);
    });

    it('does not throw when this.collection is undefined (batch/sync path)', () => {
      (service as any).collection = undefined;
      spyOn(service, 'convertirMonto').and.returnValue(12);

      const detail = {
        nuAmountDiscount: 100,
        nuAmountDiscountConversion: 5,
        nuValueLocal: 36,
        coOriginal: 'USD',
      } as unknown as CollectionDetail;

      expect(() =>
        service.syncCollectionDetailDiscountConversion(detail, 36, 'USD'),
      ).not.toThrow();
      expect(service.convertirMonto).toHaveBeenCalledWith(100, 36, 'USD');
      expect(detail.nuAmountDiscountConversion).toBe(12);
    });
  });

  describe('COB-INV-COMMENT-001 cleanString', () => {
    it('preserves trailing and internal spaces (no trim on ionInput path)', () => {
      expect(service.cleanString('hola ')).toBe('hola ');
      expect(service.cleanString('hola mundo')).toBe('hola mundo');
      expect(service.cleanString('  hola')).toBe('  hola');
    });

    it('still strips ; \' " characters', () => {
      expect(service.cleanString(`hola;"'mundo"`)).toBe('holamundo');
    });
  });
});
