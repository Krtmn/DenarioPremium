import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { CameraWeb } from '@capacitor/camera/dist/esm/web';

import { AdjuntoComponent } from './adjunto.component';
import { AdjuntoService } from '../adjunto.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { Foto } from 'src/app/modelos/foto';

describe('AdjuntoComponent', () => {
  let component: AdjuntoComponent;
  let fixture: ComponentFixture<AdjuntoComponent>;
  let adjuntoServiceMock: jasmine.SpyObj<AdjuntoService>;
  let messageServiceMock: jasmine.SpyObj<MessageService>;
  let checkPermissionsSpy: jasmine.Spy;
  let getPhotoSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    adjuntoServiceMock = jasmine.createSpyObj('AdjuntoService', [
      'addPhotoFromCamera',
    ], {
      fotos: [],
      quAttach: 5,
      imageWeightLimit: 30,
      weightLimitExceeded: false,
      cameraCaptureQuality: 75,
      cameraCaptureMaxWidth: 1280,
      tags: new Map<string, string>(),
      viewOnly: false,
      signatureConfig: false,
      firma: '',
      files: [],
      userCanUploadFiles: true,
      showCamera: true,
      processingPhotos: 0,
      AttachmentChanged: { next: jasmine.createSpy('next') },
      AttachmentWeightExceeded: { next: jasmine.createSpy('next') },
      attachmentsLoaded: { subscribe: () => ({ unsubscribe: () => undefined }) },
    });

    messageServiceMock = jasmine.createSpyObj('MessageService', ['transaccionMsjModalNB']);

    TestBed.configureTestingModule({
      declarations: [AdjuntoComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AdjuntoService, useValue: adjuntoServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
      ],
    })
      .overrideComponent(AdjuntoComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(AdjuntoComponent);
    component = fixture.componentInstance;

    checkPermissionsSpy = spyOn(CameraWeb.prototype, 'checkPermissions').and.resolveTo({
      camera: 'granted',
      photos: 'granted',
    });
    spyOn(CameraWeb.prototype, 'requestPermissions').and.resolveTo({
      camera: 'granted',
      photos: 'granted',
    });
    getPhotoSpy = spyOn(CameraWeb.prototype, 'getPhoto');

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('tomarImg usa Uri y pipeline del servicio sin Base64', async () => {
    getPhotoSpy.and.resolveTo({
      path: '/data/photo.jpg',
      webPath: 'capacitor://localhost/_capacitor_file_/photo.jpg',
    });
    adjuntoServiceMock.addPhotoFromCamera.and.resolveTo(
      new Foto('jpeg', 'abc', '', false, 'capacitor://localhost/_capacitor_file_/photo.jpg'),
    );

    await component.tomarImg();

    expect(getPhotoSpy).toHaveBeenCalledWith(jasmine.objectContaining({
      source: CameraSource.Camera,
      resultType: CameraResultType.Uri,
      quality: 75,
      width: 1280,
      correctOrientation: true,
    }));
    expect(adjuntoServiceMock.addPhotoFromCamera).toHaveBeenCalled();
    expect(messageServiceMock.transaccionMsjModalNB).not.toHaveBeenCalled();
  });

  it('tomarImg no muestra error si el usuario cancela la cámara', async () => {
    getPhotoSpy.and.rejectWith(new Error('User cancelled photos app'));

    await component.tomarImg();

    expect(messageServiceMock.transaccionMsjModalNB).not.toHaveBeenCalled();
    expect(component.disablePhotos).toBeFalse();
  });

  it('getImgSrc usa previewSrc cuando está disponible', () => {
    const src = component.getImgSrc(
      new Foto('jpeg', 'base64data', '', false, 'capacitor://localhost/photo.jpg'),
    );
    expect(src).toBe('capacitor://localhost/photo.jpg');
  });
});
