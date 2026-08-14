import { InventarioGeneralComponent } from './inventario-general.component';

describe('InventarioGeneralComponent', () => {
  // cleanString no usa this; evitar TestBed (SQLite / sync DI).
  const cleanString = (str: string) =>
    InventarioGeneralComponent.prototype.cleanString.call({}, str);

  describe('COB-INV-COMMENT-001 cleanString', () => {
    it('preserves trailing spaces so ionInput does not eat Espacio', () => {
      expect(cleanString('hola ')).toBe('hola ');
      expect(cleanString('hola mundo')).toBe('hola mundo');
    });

    it('still strips ; \' " characters', () => {
      expect(cleanString(`hola;"'mundo"`)).toBe('holamundo');
    });
  });
});
