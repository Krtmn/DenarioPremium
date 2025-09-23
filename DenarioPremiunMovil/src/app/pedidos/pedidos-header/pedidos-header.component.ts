import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PedidosService } from '../pedidos.service';

@Component({
    selector: 'app-pedidos-header',
    templateUrl: './pedidos-header.component.html',
    styleUrls: ['./pedidos-header.component.scss'],
    standalone: false
})
export class PedidosHeaderComponent implements OnInit {
  public orderServ = inject(PedidosService);
  constructor(
    private router: Router,

  ) { }

  ngOnInit() { }

  getTag(tagName: string){
    var tag = this.orderServ.tags.get(tagName);
    if(tag == undefined){
      console.log("Error al buscar tag "+tagName);
      tag = '' ;
  }
    return tag;
  }

  goBack() {
    this.router.navigate(['home']);
  }

}
