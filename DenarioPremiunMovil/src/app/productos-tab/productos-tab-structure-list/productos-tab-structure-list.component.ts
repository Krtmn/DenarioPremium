import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ProductStructureUtil } from 'src/app/modelos/ProductStructureUtil';
import { Enterprise } from 'src/app/modelos/tables/enterprise';
import { ProductStructure } from 'src/app/modelos/tables/productStructure';
import { TypeProductStructure } from 'src/app/modelos/tables/typeProductStructure';
import { PedidosService } from 'src/app/pedidos/pedidos.service';
import { ProductStructureService } from 'src/app/services/productStructures/product-structure.service';
import { ProductService } from 'src/app/services/products/product.service';
import { ReturnLogicService } from 'src/app/services/returns/return-logic.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
  selector: 'productos-tab-structure-list',
  templateUrl: './productos-tab-structure-list.component.html',
  styleUrls: ['./productos-tab-structure-list.component.scss'],
  standalone: false
})
export class ProductosTabStructureListComponent implements OnInit, OnDestroy {
  public cdr: ChangeDetectorRef;

  productStructureService = inject(ProductStructureService);
  productService = inject(ProductService);
  returnLogic = inject(ReturnLogicService);
  orderServ = inject(PedidosService);
  dbServ = inject(SynchronizationDBService);

  @Input()
  empresaSeleccionada!: Enterprise;
  @Input()
  showProductStructure: Boolean = false;
  @Input()
  productsTabTags = new Map<string, string>([]);
  @Input()
  devolucion: Boolean = false;
  @Input()
  pedido: Boolean = false;

  tpsSeleccionada!: TypeProductStructure;
  typeProductStructureList: TypeProductStructure[] = [];
  psSeleccionada!: ProductStructure;
  featuredButtonLabel = '';
  favoriteButtonLabel = '';

  productStructureList: ProductStructure[] = [];
  productStructures: Boolean = false;
  buttonSize = 6;
  sub: any;
  searchSub: any;
  validateReturnSub: any;

  constructor() {
    this.cdr = inject(ChangeDetectorRef);
  }


  ngOnInit() {

    if (this.showProductStructure) {
      this.productStructures = true;
      this.productService.showProductStructure = true;
      this.getTypeProductStructures();
    }
    this.sub = this.productStructureService.productStructures.subscribe((data) => {
      this.productStructures = data;
      if (this.productStructures) {
        this.getTypeProductStructures();
      }
    });

    this.searchSub = this.productService.onSearchClicked.subscribe((data) => {
      this.productStructures = false;
      this.productService.showProductStructure = false;
    });

    this.validateReturnSub = this.returnLogic.productsByInvoice.subscribe((data) => {
      this.productStructures = false;
      this.productService.showProductStructure = false;
    });


    if (this.pedido) {
      //hacemos espacio para el boton de carrito
      this.buttonSize = 5;
    }


  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.searchSub.unsubscribe();
    this.validateReturnSub.unsubscribe();
  }

  getTypeProductStructures() {
    this.productStructureService.getTypeProductStructuresByIdEnterprise(this.dbServ.getDatabase(), this.empresaSeleccionada.idEnterprise).then(() => {
      this.typeProductStructureList = this.productStructureService.typeProductStructureList;
      //this.tpsSeleccionada = this.typeProductStructureList[0];
      if (!this.tpsSeleccionada && this.typeProductStructureList.length > 0) {
        this.tpsSeleccionada = this.typeProductStructureList[0];
      }
      this.getProductStructures();
    });
  }

  getProductStructures() {
    this.productStructureService.getProductStructuresByIdTypeProductStructureAndIdEnterprise(this.dbServ.getDatabase(), this.tpsSeleccionada.idTypeProductStructure, this.empresaSeleccionada.idEnterprise).then(() => {
      this.productStructureList = [];

      if (this.pedido && this.orderServ.userCanSelectChannel) {
        // [userCanSelectChannel] hay que filtrar por orderType
        let structs = this.orderServ.orderTypeProductStructure.filter((s) => s.idOrderType === this.orderServ.tipoOrden.idOrderType)
        this.productStructureList = this.productStructureService.productStructureList.filter((ps) => structs.find((s) => s.coProductStructure === ps.coProductStructure));
        /* quizas innecesario
        //filtramos los productStructures que corresponden al orderType
        let idProductStructureList: number[] = [];
        structs.forEach((ps) => idProductStructureList.push(ps.idProductStructure));
        const set = new Set(idProductStructureList);
        this.productStructureService.idProductStructureList = this.productStructureService.idProductStructureList.filter(id => set.has(id));
        */
      } else {
        //caso regular
        this.productStructureList = this.productStructureService.productStructureList;
      }
      this.productService.getFavoriteProductCount(this.dbServ.getDatabase(), this.empresaSeleccionada.idEnterprise).then(count => {
        let favname = this.orderServ.tags.get("PED_FAVORITO");
        this.favoriteButtonLabel = (favname != undefined) ? favname : 'Favoritos';
        this.favoriteButtonLabel += ' (' + count + ')';
      })


      if (this.orderServ.featuredProducts) {
        this.productService.getFeaturedProductCount(this.dbServ.getDatabase(), this.empresaSeleccionada.idEnterprise).then(count => {
          this.featuredButtonLabel = this.orderServ.nameProductLine + ' (' + count + ')';
        })

      }


    });
  }

    tpsCompare(a: TypeProductStructure, b: TypeProductStructure) {
      return a && b ? a.idTypeProductStructure === b.idTypeProductStructure : a === b;
    }

  onTypeProductStructureChanged(ev: any) {
    this.tpsSeleccionada = ev.target.value;
    this.getProductStructures();
  }

  onProductStructureSelected(productStructure: ProductStructure) {
    this.psSeleccionada = productStructure;
    this.productStructureService.nombreProductStructureSeleccionada = productStructure.naProductStructure;

    let psu: ProductStructureUtil = new ProductStructureUtil(
      this.empresaSeleccionada,
      this.tpsSeleccionada,
      this.psSeleccionada,
    )
    this.productStructureService.getLowestsProductStructuresByCoProductStructuresAndIdEnterprise(this.dbServ.getDatabase(), this.psSeleccionada.coProductStructure, this.psSeleccionada.idEnterprise).then(() => {
      this.productStructures = false;
      this.productService.onProductStructureCLicked();
      this.cdr.detectChanges();
    });
    this.cdr.detectChanges();

  }

  onFeaturedProductSelected() {
    this.productStructures = false;
    this.productStructureService.nombreProductStructureSeleccionada = this.featuredButtonLabel.split('(')[0];;
    this.productService.onFeaturedStructureClicked();
  }

  onFavoriteProductSelected() {
    this.productStructures = false;
    this.productStructureService.nombreProductStructureSeleccionada = this.favoriteButtonLabel.split('(')[0];
    this.productService.onFavoriteStructureClicked();
  }

  onCartSelected() {
    this.productStructures = false;
    this.productService.onCarritoButtonClicked();
  }

  onReturnProductTab() {
    this.productStructures = false;
    this.productStructureService.onReturnProductTabClicked();
  }

}
