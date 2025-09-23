import { Injectable, inject } from '@angular/core';
import { ServicesService } from '../services.service';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Imagenes, ResponseFiles, ResponseImages } from 'src/app/modelos/imagenes';
import { Directory, DownloadFileResult, Filesystem } from '@capacitor/filesystem';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { DateServiceService } from '../dates/date-service.service';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ImageServicesService {

  private services = inject(ServicesService);
  public dateServ = inject(DateServiceService);
  public downloadFileList: string[] = [];
  public removeFileList: string[] = [];
  public downloadFileListPdf: string[] = [];
  public removeFileListPdf: string[] = [];
  public fechaCreacion: string = "2000-01-01 00:00:00";
  private allFileList: Imagenes[] = [];
  private listFilesImages: string[] = [];
  private listFilesPdf: string[] = [];

  public mapImages: Map<string, string[]> = new Map<string, string[]>();
  public mapImagesFiles: Map<string, string[]> = new Map<string, string[]>();
  public mapPdfFiles: Map<string, string[]> = new Map<string, string[]>();
  public imageLoaded$ = new Subject<{ imgName: string, imgSrc: string }>();

  constructor(
    private http: HttpClient,
  ) { }

  async getServerPdfList() {
    if (localStorage.getItem("lastLoginPdf") == null)
      localStorage.setItem("lastLoginPdf", "2000-01-01 00:00:00.000");

    if (localStorage.getItem("listFilesPdf") != null)
      this.listFilesPdf = JSON.parse(localStorage.getItem("listFilesPdf")!)

    this.mapPdfFiles = new Map(JSON.parse(localStorage.getItem("mapPdfFiles")!));

    return this.http.post<ResponseFiles>(this.services.getURLService() + "listfilespremiumdispatch", {
      type: 'files',
      coUser: localStorage.getItem("coUser")!,
      naFiles: this.listFilesPdf
    }, this.services.getHttpOptionsAuthorization())
      .pipe(
        map(resp => {
          if (resp.errorCode == "000") {

            this.downloadFileListPdf = resp.downloadFileListDispatch;
            this.removeFileListPdf = resp.removeFileListDispatch;
            return resp
          } else
            return "";
        })
      );
  }



  async getServerImageList() {
    if (localStorage.getItem("lastLoginImage") == null)
      localStorage.setItem("lastLoginImage", "2000-01-01 00:00:00.000");

    if (localStorage.getItem("listFilesImages") != null)
      this.listFilesImages = JSON.parse(localStorage.getItem("listFilesImages")!)

    this.mapImagesFiles = new Map(JSON.parse(localStorage.getItem("mapImagesFiles")!));


    return this.http.post<ResponseImages>(this.services.getURLService() + "listfilespremium", {
      type: 'productos',
      naImages: this.listFilesImages
    }, this.services.getHttpOptionsAuthorization())
      .pipe(
        map(resp => {
          if (resp.errorCode == "000") {
            for (let i = 0; i < resp.downloadFileList.length; i++) {
              if (resp.downloadFileList[i].split(".")[1] == "db" || resp.downloadFileList[i].split(".")[1] == "ini") {
                resp.downloadFileList.splice(i, 1);
                i--;
              }
            }

            for (var i = 0; i < resp.removeFileList.length; i++) {
              if (resp.removeFileList[i].split(".")[1] == "db" || resp.removeFileList[i].split(".")[1] == "ini") {
                resp.removeFileList.splice(i, 1);
                i--;
              }
            }

            this.downloadFileList = resp.downloadFileList;
            this.removeFileList = resp.removeFileList;
            return resp
          } else
            return "";
        })
      );
  }

  async downloadPdfFilesWithConcurrency(concurrency: number = 3) {
    if (!this.downloadFileListPdf || this.downloadFileListPdf.length === 0) {
      return;
    }

    const queue = [...this.downloadFileListPdf];
    const running: Promise<void>[] = [];

    const worker = async (pdfName: string) => {
      let url = "";
      try {
        url = this.services.getURLService() + "download/files?type=files&coUser=" + localStorage.getItem("coUser")! + "&nameFile=" + pdfName;
      } catch {
        console.log("error", pdfName);
        return;
      }
      let date = new Date();
      try {
        const res = await Filesystem.downloadFile({
          url: url,
          path: pdfName,
          directory: Directory.Cache
        });
        this.listFilesPdf.push(pdfName);
        let name = pdfName;
        if (!this.mapPdfFiles.get(name))
          this.mapPdfFiles.set(name, [res.path!]);
        else
          this.mapPdfFiles.get(name)?.push(res.path!);

        localStorage.setItem("listFilesPdf", JSON.stringify(this.listFilesPdf));
        if (this.mapPdfFiles.size != 0)
          localStorage.setItem("mapPdfFiles", JSON.stringify(Array.from(this.mapPdfFiles.entries())));
      } catch (e) {
        console.log(e);
      }
    };

    while (queue.length > 0 || running.length > 0) {
      while (queue.length > 0 && running.length < concurrency) {
        const pdfName = queue.shift()!;
        running.push(worker(pdfName));
      }
      await Promise.race(running).then(() => {
        running.splice(0, 1); // Elimina la promesa resuelta
      });
    }
  }

  async downloadWithConcurrency(imagenesDownload: string[], concurrency: number = 3) {
    if (this.mapImages.size == 0 && localStorage.getItem("mapImages") != null) {
      this.mapImages = new Map(JSON.parse(localStorage.getItem("mapImages")!));
    }

    const queue = [...imagenesDownload];
    const running: Promise<void>[] = [];

    const worker = async (imgName: string) => {
      let url = "";
      try {
        url = this.services.getURLService() + "download?type=products&id=" + imgName.split(".")[0];
      } catch {
        console.log("error", imgName);
        return;
      }
      let date = new Date();
      try {
        const res = await Filesystem.downloadFile({
          url: url,
          path: imgName,
          directory: Directory.Cache
        });
        this.allFileList.push({
          name: imgName.split(".")[0],
          date: date.getTime(),
          path: res.path!,
          fechaCreacion: date.getTime().toString(),
        });
        this.listFilesImages.push(imgName);
        let name = imgName.split(".")[0].split("_")[0];
        if (!this.mapImages.get(name))
          this.mapImages.set(name, [res.path!]);
        else
          this.mapImages.get(name)?.push(res.path!);

        localStorage.setItem("listFilesImages", JSON.stringify(this.listFilesImages));
        if (this.mapImages.size != 0)
          localStorage.setItem("mapImages", JSON.stringify(Array.from(this.mapImages.entries())));

        // Lee la imagen y emite el resultado para mostrarla en tiempo real
        const fileResult = await Filesystem.readFile({
          path: "file://" + res.path!,
        });
        const base64 = 'data:image/png;base64,' + fileResult.data;
        this.imageLoaded$.next({ imgName, imgSrc: base64 });
      } catch (e) {
        console.log(e);
      }
    };

    while (queue.length > 0 || running.length > 0) {
      while (queue.length > 0 && running.length < concurrency) {
        const imgName = queue.shift()!;
        running.push(worker(imgName));
      }
      await Promise.race(running).then(() => {
        running.splice(0, 1); // Elimina la promesa resuelta
      });
    }

    setTimeout(() => {
      this.uploadPhotos();
    }, 0);
  }

  /* async download(imagenesDownload: string[]) {
    if (this.mapImages.size == 0 && localStorage.getItem("mapImages") != null) {
      this.mapImages = new Map(JSON.parse(localStorage.getItem("mapImages")!));
    }

    if (imagenesDownload && imagenesDownload.length > 0) {
      // Descarga cada imagen en background SIN esperar a que todas terminen
      imagenesDownload.forEach((imgName) => {
        (async () => {
          let url = "";
          try {
            url = this.services.getURLService() + "download?type=products&id=" + imgName.split(".")[0];
          } catch {
            console.log("error", imgName);
            return;
          }

          let date = new Date();
          try {
            const res = await Filesystem.downloadFile({
              url: url,
              path: imgName,
              directory: Directory.Cache
            });
            this.allFileList.push({
              name: imgName.split(".")[0],
              date: date.getTime(),
              path: res.path!,
              fechaCreacion: date.getTime().toString(),
            });
            this.listFilesImages.push(imgName);
            let name = imgName.split(".")[0].split("_")[0];
            if (!this.mapImages.get(name))
              this.mapImages.set(name, [res.path!]);
            else
              this.mapImages.get(name)?.push(res.path!);

            // Actualiza localStorage después de cada descarga
            localStorage.setItem("listFilesImages", JSON.stringify(this.listFilesImages));
            if (this.mapImages.size != 0)
              localStorage.setItem("mapImages", JSON.stringify(Array.from(this.mapImages.entries())));
          } catch (e) {
            console.log(e);
          }
        })();
      });

      // Ejecuta uploadPhotos en background, no bloquea la UI
      setTimeout(() => {
        this.uploadPhotos();
      }, 0);

    } else {
      if (localStorage.getItem("mapImages") != null) {
        this.mapImages = new Map(JSON.parse(localStorage.getItem("mapImages")!));
        setTimeout(() => {
          this.uploadPhotos();
        }, 0);
      }
    }
  } */

  async uploadPhotos() {
    // Si ya tienes el mapa lleno y actualizado, no hagas nada
    if (
      this.mapImagesFiles.size > 0 &&
      this.mapImagesFiles.size === this.mapImages.size
    ) {
      // Opcional: verifica que cada clave tenga la misma cantidad de imágenes
      let allMatch = true;
      for (const [key, value] of this.mapImages.entries()) {
        if (
          !this.mapImagesFiles.has(key) ||
          this.mapImagesFiles.get(key)!.length !== value.length
        ) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        return; // No es necesario recorrer de nuevo
      }
    }

    // Si llegaste aquí, sí es necesario recorrer
    this.mapImagesFiles = new Map<string, string[]>();
    for (const [key, value] of this.mapImages.entries()) {
      for (let i = 0; i < value.length; i++) {
        try {
          const result = await Filesystem.readFile({
            path: "file://" + value[i],
          });
          if (!this.mapImagesFiles.has(key)) {
            this.mapImagesFiles.set(key, ['data:image/png;base64,' + result.data]);
          } else {
            this.mapImagesFiles.get(key)!.push('data:image/png;base64,' + result.data!);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  async deleteImages(listImagesDelete: string[]) {
    if (this.mapImages.size == 0) {
      if (localStorage.getItem("mapImages") != null)
        this.mapImages = new Map(JSON.parse(localStorage.getItem("mapImages")!));
    }
    for (var i = 0; i < listImagesDelete.length; i++) {
      for (var j = 0; j < this.listFilesImages.length; j++) {
        if (listImagesDelete[i] == this.listFilesImages[j]) {
          let values = this.mapImages.get(this.listFilesImages[j].split(".")[0].split("_")[0])

          for (var k = 0; k < values!.length; k++) {
            let name = values![k].split("/")[values![k].split("/").length - 1];
            if (name == this.listFilesImages[j]) {
              values?.splice(k, 1);
              k--;
            }
          }
          let extension = this.listFilesImages[j].split(".")[1]
          this.mapImages.delete(this.listFilesImages[j].split(".")[0].split("_")[0] + "." + extension);
          this.mapImages.set(this.listFilesImages[j], values!)

          this.listFilesImages.splice(j, 1);
          this.allFileList.splice(j, 1);
          j--;
        }
      }
      if (listImagesDelete[i].split(".")[1] != "db" && listImagesDelete[i].split(".")[1] != "ini") {
        await Filesystem.deleteFile({
          path: listImagesDelete[i],
          directory: Directory.Cache
        });
      }
    }

    localStorage.setItem("listFilesImages", JSON.stringify(this.listFilesImages));
    return Promise.resolve()
  }

  async getImageUrl(imgName: string): Promise<string> {
    // 1. Verifica si ya tienes la imagen localmente
    const localPath = this.getLocalImagePath(imgName);
    if (localPath) {
      return localPath;
    }

    // 2. Si no, descárgala bajo demanda
    await this.downloadWithConcurrency([imgName]);
    const downloadedPath = this.getLocalImagePath(imgName);
    // Si sigue sin estar, retorna un placeholder
    return downloadedPath ?? 'assets/img/placeholder.png';
  }

  private getLocalImagePath(imgName: string): string | null {
    const filePath = this.listFilesImages.find(name => name === imgName);
    if (filePath) {
      return filePath;
    }
    return null;
  }
}