import { Component, OnInit, AfterViewInit, inject, ViewChild, } from '@angular/core';

import { MessageService } from 'src/app/services/messageService/message.service';
import { AdjuntoService } from '../adjunto.service';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Foto } from 'src/app/modelos/foto';
import { SignaturePad } from 'angular-signature-pad-v2';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Archivo } from 'src/app/modelos/archivo';
import { IonModal } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { Swiper } from 'swiper/types';




@Component({
  selector: 'app-adjunto',
  templateUrl: './adjunto.component.html',
  styleUrls: ['./adjunto.component.scss'],
  standalone: false
})
export class AdjuntoComponent implements OnInit {
  enableCarousel: boolean = false;
  enableSignature: boolean = false;

  disablePhotos: boolean = false;

  viewOnly: boolean = false;
  iHaveSignature: boolean = false;
  colorBoton = '';

  public message = inject(MessageService);
  public service = inject(AdjuntoService);


  @ViewChild(SignaturePad) signaturePad!: SignaturePad;
  signaturePadOptions: Object = { // passed through to szimek/signature_pad constructor
    'minWidth': 3,
    'canvasWidth': 280,
    'canvasHeight': 220
  };

  @ViewChild(IonModal) eventModal!: IonModal;


  constructor(


  ) { }

  ngOnInit() {
    this.viewOnly = this.service.viewOnly;
    this.colorBoton = this.service.colorBoton;
    this.checkCarousel();


  }

  ngAfterViewInit() {

    //window.dispatchEvent(new Event('resize'));
    //this.checkCarousel(); 
    //console.log('SignaturePad:', this.signaturePad); 
    this.signaturePad.set('minWidth', 3); // set szimek/signature_pad options at runtime
    if (this.service.firma.length > 0 && this.signaturePad != undefined) {
      this.reloadSignature() //recarga la firma
    }


    // Workaround: Add native pointer event listeners to the canvas
    setTimeout(() => {
      const canvas = document.querySelector('#signaturePad canvas');
      if (canvas) {
        canvas.addEventListener('pointerup', () => {
          console.log('Native pointerup detected');
          this.drawComplete();
        });
        canvas.addEventListener('pointerdown', () => {
          console.log('Native pointerdown detected');
          this.drawStart();
        });
      }
    }, 0);

    this.canvasResize();
  }

  canvasResize() {
    let sp = document.getElementById('signaturePad');
    let canvas = document.querySelector('canvas');
    if (sp) {
      console.log("Canvas Resize")
      //this.signaturePad.set('canvasWidth', sp.offsetWidth);
      //this.signaturePad.set('canvasHeight', sp.offsetHeight);
    }



  }

  onAccordionChange(ev: any) {
    let value = ev.detail.value;

    if (value === 'images') {
      window.dispatchEvent(new Event('resize'));
      //this.carouselOptions = { ...this.carouselOptions}
      this.checkCarousel();
    }

    if (value === 'signature') {
      this.reloadSignature();
    }

  }




  checkCarousel() {
    this.enableCarousel = (this.getFotos().length > 0);

  }

  onAttachmentChanged() {

    if (this.service.weightLimitExceeded) {
      this.service.AttachmentWeightExceeded.next(null);
    } else {
      this.service.AttachmentChanged.next(null);
    }

  }




  checkImgLimit() {
    if (this.service.fotos.length >= this.service.totalPhoto) {
      this.message.transaccionMsjModalNB(this.getTag("ADJ_MSJ_LIMITE") + this.service.totalPhoto);
      return false;
    } else {
      return true;
    }
  }

  getImgSrc(input: Foto) {
    var fp: String;
    fp = this.getImgURL(input.data);
    return fp
  }

  getImgURL(base64: string) {
    return 'data:image/jpeg;base64,' + base64;
  }

  deleteImg(pos: number) {
    this.service.deleteImg(pos);
    this.onAttachmentChanged();

  }

  deleteFile() {
    this.service.file = null;
    this.service.weightLimitExceeded = false;
    this.onAttachmentChanged();

  }

  printEvent(input: any) {
    console.log(input);
  }

  getFotos() {
    //console.log(this.service.fotos);
    return this.service.fotos;
  }

  enableSign() {
    this.enableSignature = true;

  }

  drawComplete() {
    if (!this.signaturePad) {
      this.message.transaccionMsjModalNB('El panel de firma no está disponible. Asegúrate de que la firma esté visible antes de guardar.');
      return;
    }
    try {
      this.service.firma = this.signaturePad.toDataURL();
      this.onAttachmentChanged();
      if (this.service.moduleName == 'Visitas') {
        this.iHaveSignature = true;
      } else {
        this.iHaveSignature = false;
      }
      // Notifica a los suscriptores que hay una nueva firma
      this.service.signatureChanged.next(this.service.firma);
    } catch (e) {
      this.message.transaccionMsjModalNB('Ocurrió un error al capturar la firma.');
      console.error('Error en drawComplete:', e);
    }
  }

  testClick() {
    alert('¡Funciona!');
  }

  drawStart() {
    //se ejecuta cuando el usuario toca el panel de firma
    console.log('begin drawing');
  }

  drawClear() {
    this.signaturePad.clear();
    window.dispatchEvent(new Event('resize'));
    this.service.firma = '';
    this.onAttachmentChanged();
  }

  reloadSignature() {
    if (this.service.firma.substring(0, 4) != 'data') {
      //cuando carga directo de archivo, necesita un poco de ayuda.
      this.signaturePad.fromDataURL('data:image/png;base64,' + this.service.firma);
    } else {
      this.signaturePad.fromDataURL(this.service.firma);
    }


  }

  async tomarImg() {
    if (this.checkImgLimit()) {
      Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        quality: 100
      }).then(p => {
        if (p.base64String) {
          var muyPesado = this.service.getFileWeight(p.base64String) > this.service.imageWeightLimit
          var f = new Foto(
            ".jpg",
            p.base64String,
            '',
            muyPesado
          );
          if (muyPesado) {
            this.message.transaccionMsjModalNB(this.getTag("ADJ_EXCEDE_FOTO") + this.service.imageWeightLimit + " MB");
            this.service.weightLimitExceeded = true;
          } else {

          }
          this.service.fotos.push(f);
          this.checkCarousel();
          this.onAttachmentChanged();


        }

      });
    }
  }

  getTag(tagName: string) {
    var tag = this.service.tags.get(tagName);
    if (tag == undefined) { tag = ''; }
    return tag;
  }

  async buscarImg() {
    if (this.checkImgLimit()) {
      var remainingSlots = this.service.remainingFotos();
      this.disablePhotos = true; //deshabilita el boton de buscar fotos mientras se procesan las fotos

      //Buscamos las imagenes con el plugin
      const { photos } = await Camera.pickImages({
        limit: remainingSlots
      }).catch(err => {
        this.disablePhotos = false; //habilita el boton de buscar fotos en caso de error
        return { photos: [] };      //Ej: usuario cancela la seleccion
      });

      this.service.processingPhotos = photos.length; //actualiza la cantidad de fotos que se estan procesando actualmente

      //console.log(images);


      for (let i = 0; i < photos.length; i++) {
        const item = photos[i];
        this.service.addImg(item).then(() => {
          this.checkCarousel();
          this.service.processingPhotos--; //disminuye la cantidad de fotos que se estan procesando actualmente
          if (this.service.processingPhotos <= 0) {
            this.disablePhotos = false; //habilita el boton de buscar fotos cuando se han procesado todas las fotos
            if (this.service.weightLimitExceeded) {
              this.message.transaccionMsjModalNB(this.getTag("ADJ_EXCEDE_MULTIPLE") + this.service.imageWeightLimit + " MB");
              //this.service.weightLimitExceeded = false;
            }
          }

        });
      }


      if (photos.length > 0) {
        this.onAttachmentChanged();
      }



    }
  }

  closeSignModal() {
    this.eventModal.dismiss(null, 'cancel');
  }

  closeAndSaveSign() {
    this.drawComplete();
    this.closeSignModal();
  }

  async buscarFile() {
    if (this.service.file != null) {
      // ya existe un archivo. Revisar que se hace en este caso
    } else {
      const result = await FilePicker.pickFiles({
        types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        limit: 1,
        readData: true
      });
      //console.log(result);
      var file = result.files[0];
      var muyPesado = this.service.getFileWeight(file.data as string) > this.service.imageWeightLimit;
      if (muyPesado) {
        this.message.transaccionMsjModalNB(this.getTag("ADJ_EXCEDE_ARCHIVO") + this.service.imageWeightLimit + " MB");
      }
        this.service.file = new Archivo(
          file.mimeType,
          file.data as string,
          file.name as string,
          muyPesado
        )

        this.service.weightLimitExceeded = muyPesado;
        //console.log(this.service.file);

        this.onAttachmentChanged();
      


    }
  }


}
