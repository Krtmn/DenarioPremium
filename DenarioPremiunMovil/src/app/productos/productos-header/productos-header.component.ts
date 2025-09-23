import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicesService } from 'src/app/services/services.service';
import { SynchronizationDBService } from 'src/app/services/synchronization/synchronization-db.service';

@Component({
    selector: 'productos-header',
    templateUrl: './productos-header.component.html',
    styleUrls: ['./productos-header.component.scss'],
    standalone: false
})
export class ProductosHeaderComponent  implements OnInit {

  router = inject(Router);
  
  @Input()
  headerTags = new Map<string, string>([]);
  @Input()
  showDetail!: Boolean;

  @Output()
  onBackClicked: EventEmitter<Boolean> = new EventEmitter<Boolean>();
  
  constructor( ) {}

  ngOnInit() {
    //console.log('header' + this.headerTags);
  }

  navigateToHome(){
    this.router.navigate(['Home']);
  }

  showProductList(){
    this.onBackClicked.emit(true);
  }

}
