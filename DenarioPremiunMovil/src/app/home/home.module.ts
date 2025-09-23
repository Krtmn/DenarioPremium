import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';


import { HomePageRoutingModule } from './home-routing.module';
import { MessageModule } from '../message/message.module';
import { HomeSidebarComponent } from '../home-sidebar/home-sidebar.component';


@NgModule({
  
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    MessageModule,
    //HomeSidebarComponent, 
    
  ],
  exports: [
    HomePage
  ],
  declarations: [HomePage,
    HomeSidebarComponent
    
  ]
})
export class HomePageModule { }
