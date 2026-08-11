import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { ProductStructure } from 'src/app/modelos/tables/productStructure';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ProductReportsService } from 'src/app/services/products/product-reports.service';
import {
  ProductReportExportFormat,
  ProductReportFilterType,
  ProductReportOptions,
  ProductReportSortField,
  ProductReportType,
} from '../product-report.models';

@Component({
  selector: 'productos-reports',
  templateUrl: './productos-reports.component.html',
  styleUrls: ['./productos-reports.component.scss'],
  standalone: false,
})
export class ProductosReportsComponent implements OnInit {
  @Input() empresaSeleccionada!: Enterprise;
  @Input() productTags = new Map<string, string>();
  @Output() backClicked = new EventEmitter<void>();

  private readonly reportsService = inject(ProductReportsService);
  private readonly messageService = inject(MessageService);

  reportType: ProductReportType = 'priceList';
  filterType: ProductReportFilterType = 'all';
  sortField: ProductReportSortField = 'description';
  structureId: number | null = null;
  filterStructures: ProductStructure[] = [];
  isGenerating = false;

  ngOnInit(): void {
    void this.reloadFilterStructures();
  }

  get reportTypes(): Array<{ value: ProductReportType; label: string }> {
    return [
      { value: 'priceList', label: this.tag('PROD_REPORT_TYPE_PRICE_LIST', 'Lista de precios') },
      { value: 'catalog', label: this.tag('PROD_REPORT_TYPE_CATALOG', 'Catálogo de productos') },
    ];
  }

  get filterTypes(): Array<{ value: ProductReportFilterType; label: string }> {
    return [
      { value: 'all', label: this.tag('PROD_REPORT_FILTER_ALL', 'Todos los productos') },
      { value: 'category', label: this.tag('PROD_REPORT_FILTER_CATEGORY', 'Categoría') },
      { value: 'brand', label: this.tag('PROD_REPORT_FILTER_BRAND', 'Marca') },
      { value: 'tag', label: this.tag('PROD_REPORT_FILTER_TAG', 'Etiqueta') },
    ];
  }

  get sortFields(): Array<{ value: ProductReportSortField; label: string }> {
    return [
      { value: 'code', label: this.tag('PROD_COD_PROD', 'Código') },
      { value: 'description', label: this.tag('PROD_DESC_PROD', 'Descripción') },
    ];
  }

  tag(key: string, fallback: string): string {
    return this.productTags.get(key) ?? fallback;
  }

  async onFilterTypeChanged(): Promise<void> {
    this.structureId = null;
    await this.reloadFilterStructures();
  }

  async reloadFilterStructures(): Promise<void> {
    if (!this.empresaSeleccionada?.idEnterprise || this.filterType === 'all') {
      this.filterStructures = [];
      this.structureId = null;
      return;
    }

    this.filterStructures = await this.reportsService.loadFilterStructures(
      this.empresaSeleccionada.idEnterprise,
      this.filterType,
    );
  }

  canGenerateExcel(): boolean {
    return this.reportType === 'priceList';
  }

  async generateReport(exportFormat: ProductReportExportFormat): Promise<void> {
    if (!this.empresaSeleccionada?.idEnterprise || this.isGenerating) {
      return;
    }

    if (this.filterType !== 'all' && !this.structureId) {
      await this.messageService.transaccionMsjModalNB(
        this.tag('PROD_REPORT_MSG_SELECT_FILTER', 'Seleccione un valor para el filtro elegido.'),
      );
      return;
    }

    const options = this.buildReportOptions(exportFormat);
    this.isGenerating = true;

    try {
      await this.messageService.showLoading();
      await this.reportsService.generateAndShareReport(options);
    } catch (error) {
      console.error('[ProductosReportsComponent] Error generating report', error);
      await this.messageService.transaccionMsjModalNB(
        this.tag('PROD_REPORT_MSG_GENERATE_ERROR', 'No se pudo generar el reporte. Intente nuevamente.'),
      );
    } finally {
      this.isGenerating = false;
      await this.messageService.hideLoading();
    }
  }

  onBack(): void {
    this.backClicked.emit();
  }

  private buildReportOptions(exportFormat: ProductReportExportFormat): ProductReportOptions {
    return {
      reportType: this.reportType,
      filterType: this.filterType,
      structureId: this.structureId,
      sortField: this.sortField,
      exportFormat,
      idEnterprise: this.empresaSeleccionada.idEnterprise,
      enterpriseLabel: this.empresaSeleccionada.lbEnterprise,
      coEnterprise: this.empresaSeleccionada.coEnterprise,
      tags: this.productTags,
    };
  }
}
