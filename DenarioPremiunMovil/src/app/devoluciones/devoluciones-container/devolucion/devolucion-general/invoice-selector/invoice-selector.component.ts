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

  returnLogic = inject(ReturnLogicService);

  public isModalOpen: boolean = false;
  public searchText: string = '';
  public colorModulo: string = 'fondoAmarillo';
  public nombreModulo: string = 'Devoluciones';

  btnAceptar: string = '';
  btnCancelar: string = '';
  headerConfirm: string = '';
  mensajeInvoiceChange: string = '';
  public invoiceChangeOpen: boolean = false;

  invoiceACambiar!: Invoice;

  @ViewChild(IonModal) modal!: IonModal;

  constructor() { }

  ngOnInit() {
    this.btnAceptar = this.returnLogic.tags.get("DENARIO_BOTON_ACEPTAR") || "";
    this.btnCancelar = this.returnLogic.tags.get("DENARIO_BOTON_CANCELAR") || "";
    this.headerConfirm = this.returnLogic.tags.get("DEV_HEADER_ALERTA") || "";
    this.mensajeInvoiceChange = this.returnLogic.tags.get("DEV_RESET_CONFIRMA") || "";
    this.buttonsInvoiceChange = [

    {
      text: this.btnAceptar,
      role: 'confirm',
      handler: () => {
        this.returnLogic.invoiceChanged.next(this.invoiceACambiar);
        this.closeModal();

      },
    },
    {
      text: this.btnCancelar,
      role: 'cancel',
      handler: () => {
        this.closeModal()
      }
    }
  ];
  }
   

  @Output() invoiceSeleccionado: EventEmitter<Invoice> = new EventEmitter<Invoice>();
  selectInvoice(input: Invoice) {
    if (this.returnLogic.newReturn.idInvoice && this.returnLogic.newReturn.idInvoice != input.idInvoice) {
      //ya hay una factura asignada diferente, no podemos cambiarla sin resetear la devolucion.
      console.log("cambio de factura");
      this.invoiceACambiar = input;
      this.invoiceChangeOpen = true;

    } else {
      //podemos asignar la factura.
      this.returnLogic.invoices.find(inv => {
        if (inv.idInvoice == input.idInvoice) {
          this.returnLogic.newReturn.coInvoice = inv.coInvoice;
          this.returnLogic.newReturn.idInvoice = inv.idInvoice;
          //this.returnLogic.invoiceAnterior = inv;
        }
      });
      this.returnLogic.findInvoiceDetailUnits().then();
      this.returnLogic.onReturnValid(true);
      this.returnLogic.setChange(true, true);
      this.invoiceSeleccionado.emit(input);
      this.closeModal();
    }

  }

  closeModal() {
    this.invoiceChangeOpen = false;
    this.modal.dismiss(null, 'cancel');
    //console.log("cerre el modal de cliente");
  }

  handleInput(event: any) {
    this.searchText = event.target.value.toLowerCase();
  }
  setInvoiceChangeOpen(value: boolean) {
    this.invoiceChangeOpen = value;
  }

  public buttonsInvoiceChange = [

    {
      text: "Aceptar",
      role: 'confirm',
      handler: () => {
        this.returnLogic.invoiceChanged.next(this.invoiceACambiar);
        this.closeModal();

      },
    },
    {
      text: "Cancelar",
      role: 'cancel',
      handler: () => {
        this.closeModal()
      }
    }
  ];

}

