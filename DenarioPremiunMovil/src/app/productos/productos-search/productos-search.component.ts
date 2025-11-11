import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from 'src/app/services/products/product.service';

@Component({
    selector: 'productos-search',
    templateUrl: './productos-search.component.html',
    styleUrls: ['./productos-search.component.scss'],
    standalone: false
})
export class ProductosSearchComponent{
  @Input()
  searchTags = new Map<string, string>([]);
  router = inject(Router); 

  @Input()
  mostrarVolver: Boolean = false;
  @Input()
  searchText: string = '';
  @Input()
  showSearch!: Boolean;
  @Input()
  productStructureSelected!: Boolean;

  @Output()
  viewStructuresClicked: EventEmitter<Boolean> = new EventEmitter<Boolean>();
  @Output()
  searchTextChanged: EventEmitter<string> = new EventEmitter<string>();
  
  productoService = inject(ProductService);
  @ViewChild('searchInput') searchInputEL!: ElementRef;

  ngOnInit() {
    
  }

  onSearchClicked(){
    this.searchText = this.searchInputEL.nativeElement.value;    
    this.searchTextChanged.emit(this.searchText);    
    this.productoService.onProductSearch(this.searchText);

  }

  onReturnStructures(){
    this.viewStructuresClicked.emit(true);
  }

  onSearchTextChanged(){
    this.searchTextChanged.emit(this.searchText);
  }

}
