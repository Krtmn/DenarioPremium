import { Component, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { SynchronizationDBService } from '../services/synchronization/synchronization-db.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { Enterprise } from '../modelos/tables/enterprise';
import { EnterpriseService } from '../services/enterprise/enterprise.service';
import { ProductStructureUtil } from '../modelos/ProductStructureUtil';
import { TypeProductStructure } from '../modelos/tables/typeProductStructure';
import { ProductStructureCount } from '../modelos/tables/productStructureCount';
import { ProductStructureService } from '../services/productStructures/product-structure.service';
import { ProductListComponent } from './product-list/product-list.component';
import { Product } from '../modelos/tables/product';
import { ProductDetail } from '../modelos/ProductDetail';
import { ProductService } from '../services/products/product.service';
import { ImageServicesService } from '../services/imageServices/image-services.service';

@Component({
    selector: 'app-productos',
    templateUrl: './productos.component.html',
    styleUrls: ['./productos.component.scss'],
    standalone: false
})
export class ProductosComponent {

  tags = new Map<string, string>([]);
  services = inject(ServicesService);
  db = inject(SynchronizationDBService);
  message = inject(MessageService);
  enterpriseService = inject(EnterpriseService);
  productStructureService = inject(ProductStructureService);
  productService = inject(ProductService);
  imageServices = inject(ImageServicesService);

  showProducts: Boolean = false;
  showProductDetail: Boolean = false;
  showProductStructures: Boolean = true;
  showSearch: Boolean = true;
  psSelected: Boolean = false;
  productStructureList: ProductStructureCount[] = [];
  searchText: string = '';

  empresaSeleccionada!: Enterprise;
  tpsSeleccionada!: TypeProductStructure;
  psSeleccionada!: ProductStructureCount;
  selectedProduct!: ProductDetail;
  listaEmpresa: Enterprise[] = [];
  multiempresa: Boolean = false;


  constructor(private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.productService.productList = [];
    this.message.showLoading().then(() => {
      this.enterpriseService.setup(this.db.getDatabase()).then(() => {
        this.productService.listaEmpresa = this.enterpriseService.empresas;
        this.productService.empresaSeleccionada = this.productService.listaEmpresa[0];
        this.productService.multiempresa = this.enterpriseService.esMultiempresa();
      });
      this.getTags().then(() => {  //buscamos los tags
        this.imageServices.downloadWithConcurrency(this.imageServices.downloadFileList);
      });
    });
  }

  getTags(): Promise<void> {
    return this.services.getTags(this.db.getDatabase(), "PROD", "ESP").then(result => {
      for (var i = 0; i < result.length; i++) {
        this.tags.set(
          result[i].coApplicationTag, result[i].tag
        )
      }
      this.message.hideLoading();
    });
  }

  onSelectedProductStructure(psUtil: ProductStructureUtil) {
    this.psSeleccionada = psUtil.productStructure;
    this.tpsSeleccionada = psUtil.typeProductStructure;
    this.empresaSeleccionada = psUtil.enterprise;
    this.psSelected = true;
    this.showProducts = true;
    this.showProductStructures = false;
  }

  viewStructures(verEstructuras: Boolean) {
    this.showProducts = false;
    this.showProductStructures = true;
    this.psSelected = false;
    this.searchText = '';
    this.productService.productList = [];
    this.showSearch = true;
  }

  onSelectedProduct(product: ProductDetail) {
    this.selectedProduct = product;
    this.showProductDetail = true;
    this.showProducts = false;
  }

  onBackClicked(verListaProductos: Boolean) {
    this.showProductDetail = false;
    this.showProducts = true;
  }

  setSearchText(value: string) {
    this.searchText = value;
    this.showProductDetail = false;
    this.showProducts = true;
    this.showProductStructures = false;
    this.showSearch = true;
    // this.productService.getProductsSearchedByCoProductAndNaProduct(this.searchText, this.empresaSeleccionada.idEnterprise);
  }
}
