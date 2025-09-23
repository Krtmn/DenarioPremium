import { Component, inject, Input } from '@angular/core';
import { VisitasService } from '../visitas.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-modal',
  templateUrl: './visitaPdfModal.component.html',
  styleUrls: ['./visitaPdfModal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule /*, ...otros componentes si usas */],
})
export class VisitaPdfModalComponent {

  @Input() isOpen = false;
  @Input() pdfList: string[] = [];
  @Input() getTag: (tag: string) => string = () => '';
  @Input() openPdf: (pdf: string) => void = () => { };
  @Input() close: () => void = () => { };

  
}