import { Component, EventEmitter, OnInit, Output, ViewChild, inject } from '@angular/core';
import { IonModal } from '@ionic/angular';
import { ClienteSelectorService } from 'src/app/cliente-selector/cliente-selector.service';
import { Client } from 'src/app/modelos/tables/client';
import { Invoice } from 'src/app/modelos/tables/invoice';
import { ReturnLogicService } from 'src/app/services/returns/return-logic.service';

@Component({
    selector: 'invoice-selector',
    templateUrl: './invoice-selector.component.html',
    styleUrls: ['./invoice-selector.component.scss'],
    standalone: false
})
export class InvoiceSelectorComponent implements OnInit {

  private service = inject(ClienteSelectorService);
  returnLogic = inject(ReturnLogicService);

  public isModalOpen: boolean = false;
  public searchText: string = '';
  public colorModulo: string = 'fondoAmarillo';
  public nombreModulo: string = 'Devoluciones';

  @ViewChild(IonModal) modal!: IonModal;

  constructor() { }

  ngOnInit() { }

  @Output() invoiceSeleccionado: EventEmitter<Invoice> = new EventEmitter<Invoice>();
  selectInvoice(input: Invoice) {
    this.returnLogic.invoices.find(inv => {
      if (inv.idInvoice == input.idInvoice) {
        this.returnLogic.newReturn.coInvoice = inv.coInvoice;
        this.returnLogic.newReturn.idInvoice = inv.idInvoice;
      }
    });
    this.returnLogic.findInvoiceDetailUnits().then();
    this.returnLogic.onReturnValid(true);
    this.returnLogic.setChange(true, true);
    this.invoiceSeleccionado.emit(input);
    this.closeModal();
  }

  closeModal() {
    this.modal.dismiss(null, 'cancel');
    //console.log("cerre el modal de cliente");
  }

  handleInput(event: any) {
    this.searchText = event.target.value.toLowerCase();
  }

}

