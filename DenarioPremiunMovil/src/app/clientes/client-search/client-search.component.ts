import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-client-search',
    templateUrl: './client-search.component.html',
    styleUrls: ['./client-search.component.scss'],
    standalone: false
})
export class ClientSearchComponent implements OnInit {
  @Output()
  searchTextEmit: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  ngOnInit() { }

  handleInput(searchText: any) {
    this.searchTextEmit.emit(searchText.target.value.toLowerCase());
  }
}
