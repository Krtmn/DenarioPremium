import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ReturnLogicService } from '../services/returns/return-logic.service';
import { Enterprise } from '../modelos/tables/enterprise';
import { ProductStructureService } from '../services/productStructures/product-structure.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { InventariosLogicService } from '../services/inventarios/inventarios-logic.service';
import { ServicesService } from '../services/services.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { MessageService } from '../services/messageService/message.service';
import { ProductService } from '../services/products/product.service';

@Component({
    selector: 'productos-tab',
    templateUrl: './productos-tab.component.html',
    styleUrls: ['./productos-tab.component.scss'],
    standalone: false
})
export class ProductosTabComponent implements OnInit, OnDestroy {

  returnLogic = inject(ReturnLogicService);
  productStructureService = inject(ProductStructureService);
  productService = inject(ProductService);
  orderServ = inject(PedidosService);
  inventariosLogicService = inject(InventariosLogicService)
  services = inject(ServicesService);
  db = inject(SynchronizationDBService);
  message = inject(MessageService);

  productsTabTags = new Map<string, string>([]);
  @Input()
  botonAgregar: Boolean = false;
  @Input()
  devolucion: Boolean = false;
  @Input()
  pedido: Boolean = false;
  @Input()
  inventario: Boolean = false;

  empresaSeleccionada!: Enterprise;
  showProductStructure: Boolean = false;
  showProductList: Boolean = false;

  sub: any;

  constructor() { }

  ngOnInit() {
    this.getTags();  //buscamos los tags

    if (this.devolucion) {
      this.empresaSeleccionada = this.returnLogic.enterpriseReturn;
      this.showProductStructure = false;
    }
    if (this.pedido) {
      this.empresaSeleccionada = this.orderServ.empresaSeleccionada
      this.showProductStructure = true;
      this.botonAgregar = false;
      this.productStructureService.onAddProductCLicked();
    }
    if (this.inventario) {
      this.empresaSeleccionada = this.inventariosLogicService.enterpriseClientStock;
      this.showProductStructure = true;
      this.botonAgregar = false;
      this.productStructureService.onAddProductCLicked();
    }

    this.sub = this.productStructureService.productStructures.subscribe((data) => {
      this.botonAgregar = !data;
    });
  }

  getTags() {
    this.services.getTags(this.db.getDatabase(), "PROD", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.productsTabTags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
    });
    this.services.getTags(this.db.getDatabase(), "DEN", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.productsTabTags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
    });
  }

  ngOnDestroy(): void {
    if (this.devolucion) {
      this.sub.unsubscribe();
    }
    if (this.inventario) {
      this.sub.unsubscribe();
    }
  }

  addProduct() {
    this.botonAgregar = false;
    this.productService.searchStructures = true;
    if (this.returnLogic.validateReturn) {
      this.returnLogic.findProductsByInvoice();
    }
    this.productStructureService.onAddProductCLicked();
  }

}
