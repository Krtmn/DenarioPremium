import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MessageComponent } from './message.component';
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
    ],
  declarations: [
    MessageComponent,

  ],
  exports: [
    MessageComponent,
  ]
})
export class MessageModule { }