import { Component, OnInit, Input, inject } from '@angular/core';
import { InventariosLogicService } from 'src/app/services/inventarios/inventarios-logic.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ServicesService } from 'src/app/services/services.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
    selector: 'app-inventario-inventario',
    templateUrl: './inventario-inventario.component.html',
    styleUrls: ['./inventario-inventario.component.scss'],
    standalone: false
})
export class InventarioInventarioComponent implements OnInit {

  public services = inject(ServicesService);
  public db = inject(SynchronizationDBService);
  public message = inject(MessageService);
  public inventariosLogicService = inject(InventariosLogicService);

  botonAgregar: Boolean = false;
  inventario: Boolean = true;

  constructor() { }

  ngOnInit() {

  }


}
