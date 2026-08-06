import { TestBed } from '@angular/core/testing';

import { TextService } from './text.service';

describe('TextService', () => {
  let service: TextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('convertToSqliteAccentGlob', () => {
    it('generates the same pattern for calorias and calorías', () => {
      expect(service.convertToSqliteAccentGlob('calorias'))
        .toBe(service.convertToSqliteAccentGlob('calorías'));
    });

    it('generates the same pattern for azucar and azúcar', () => {
      expect(service.convertToSqliteAccentGlob('azucar'))
        .toBe(service.convertToSqliteAccentGlob('azúcar'));
    });

    it('includes uppercase accented variants for vowels', () => {
      expect(service.convertToSqliteAccentGlob('calorías')).toContain('Í');
      expect(service.convertToSqliteAccentGlob('azúcar')).toContain('Ú');
    });

    it('keeps n and ñ as distinct character classes', () => {
      const nPattern = service.convertToSqliteAccentGlob('n');
      const enyePattern = service.convertToSqliteAccentGlob('ñ');

      expect(nPattern).toBe('*[nN]*');
      expect(enyePattern).toBe('*[ñÑ]*');
      expect(nPattern).not.toContain('ñ');
      expect(enyePattern).not.toContain('nN');
    });
  });
});
