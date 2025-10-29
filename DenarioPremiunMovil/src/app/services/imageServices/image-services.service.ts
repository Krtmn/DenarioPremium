import { ChangeDetectorRef, Injectable, inject } from '@angular/core';
import { ServicesService } from '../services.service';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Imagenes, ResponseFiles, ResponseImages } from 'src/app/modelos/imagenes';
import { Directory, DownloadFileResult, Filesystem } from '@capacitor/filesystem';
import { SynchronizationDBService } from '../synchronization/synchronization-db.service';
import { DateServiceService } from '../dates/date-service.service';
import { Subject, Subscription } from 'rxjs';
import { BehaviorSubject, Observable, of } from 'rxjs';


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

  public pendingLoads: Map<string, Promise<string>> = new Map(); // evita duplicados
  private imageSubjects: Map<string, BehaviorSubject<string | null>> = new Map(); // por imgName
  public mapImagesFilesByFilename: Map<string, string> = new Map(); // caché en memoria filename -> base64

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
        // centralize download URL construction
        url = this.buildDownloadUrl(imgName);
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

    /*  setTimeout(() => {
       this.uploadPhotos();
     }, 0); */
  }


  async deleteImages(listImagesDelete: string[]) {
    // Carga mapImages si está vacío (comportamiento conservado)
    if (this.mapImages.size === 0 && localStorage.getItem("mapImages") != null) {
      this.mapImages = new Map(JSON.parse(localStorage.getItem("mapImages")!));
    }

    if (!listImagesDelete || listImagesDelete.length === 0) {
      return Promise.resolve();
    }

    const toDelete = new Set(listImagesDelete);

    // Preparar promesas de borrado en disco
    const fsDeletes: Promise<void>[] = [];

    // Procesar cada filename a eliminar (evita bucles anidados)
    for (const filename of toDelete) {
      // borrar del filesystem (si no es db/ini)
      const ext = filename.split('.').pop()?.toLowerCase();
      if (ext && ext !== 'db' && ext !== 'ini') {
        const p = Filesystem.deleteFile({
          path: filename,
          directory: Directory.Cache
        }).catch(err => {
          // Logueamos pero no abortamos todo el proceso
          console.warn('[deleteImages] deleteFile error for', filename, err);
        });
        fsDeletes.push(p);
      }

      // Determinar key en mapImages (misma regla que en downloadWithConcurrency)
      const base = filename.split('.')[0];
      const key = base.split('_')[0];

      // Actualizar mapImages: eliminar las rutas que coincidan con filename
      if (this.mapImages.has(key)) {
        const prev = this.mapImages.get(key) || [];
        const updated = prev.filter(path => (path.split('/').pop() !== filename));
        if (updated.length > 0) {
          this.mapImages.set(key, updated);
        } else {
          this.mapImages.delete(key);
        }
      }

      // Actualizar mapImagesFiles (base64) acorde a mapImages:
      // Si ya no existe key en mapImages, remueve tambián de mapImagesFiles.
      // Si sigue existiendo, intenta mantener la longitud sincronizada recortando si hace falta.
      if (!this.mapImages.has(key)) {
        if (this.mapImagesFiles.has(key)) {
          this.mapImagesFiles.delete(key);
        }
      } else {
        const updatedPaths = this.mapImages.get(key) || [];
        if (this.mapImagesFiles.has(key)) {
          const existingBase64 = this.mapImagesFiles.get(key) || [];
          if (existingBase64.length > updatedPaths.length) {
            this.mapImagesFiles.set(key, existingBase64.slice(0, updatedPaths.length));
          }
          // si existingBase64.length <= updatedPaths.length mantenemos tal cual
        }
      }

      // Actualizar allFileList filtrando por filename (compara el segmento final de path)
      this.allFileList = this.allFileList.filter(it => (it.path.split('/').pop() !== filename));
    }

    // Actualizar listFilesImages eliminando los borrados
    this.listFilesImages = this.listFilesImages.filter(f => !toDelete.has(f));

    // Persistir cambios en localStorage
    try {
      localStorage.setItem("listFilesImages", JSON.stringify(this.listFilesImages));
      if (this.mapImages.size !== 0) {
        localStorage.setItem("mapImages", JSON.stringify(Array.from(this.mapImages.entries())));
      } else {
        localStorage.removeItem("mapImages");
      }
      if (this.mapImagesFiles.size !== 0) {
        localStorage.setItem("mapImagesFiles", JSON.stringify(Array.from(this.mapImagesFiles.entries())));
      } else {
        localStorage.removeItem("mapImagesFiles");
      }
    } catch (e) {
      console.warn('[deleteImages] error saving to localStorage', e);
    }

    // Esperar a que terminen los borrados de disco
    await Promise.all(fsDeletes);

    return Promise.resolve();
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

  // Centralized download URL builder for product images
  private buildDownloadUrl(imgName: string): string {
    // imgName expected like '12345.png' or '12345_1.png' -> id is segment before first '.'
    const id = imgName.split('.')[0];
    return this.services.getURLService() + 'download?type=products&id=' + id;
  }

  private getLocalImagePath(imgName: string): string | null {
    const filePath = this.listFilesImages.find(name => name === imgName);
    if (filePath) {
      return filePath;
    }
    return null;
  }

  // Promise que hace lazy read/download y retorna base64 (memoizado en pendingLoads)
  async getImageBase64(imgName: string): Promise<string> {
    // 1) retorno rápido si ya está en caché de memoria
    if (this.mapImagesFilesByFilename.has(imgName)) {
      return this.mapImagesFilesByFilename.get(imgName)!;
    }
    // 2) si ya hay una carga en progreso, reutilizarla
    if (this.pendingLoads.has(imgName)) {
      return this.pendingLoads.get(imgName)!;
    }

    const loadPromise = (async () => {
      try {
        // 3) intenta encontrar una ruta local ya conocida (allFileList guarda path)
        const fileEntry = this.allFileList.find(it => (it.path.split('/').pop() === imgName));
        let readResultData: string | null = null;

        if (fileEntry && fileEntry.path) {
          try {
            // normalizamos el resultado a base64 string independientemente de si Filesystem devuelve string o Blob
            readResultData = await this.readFileResultToBase64('file://' + fileEntry.path);
          } catch (e) {
            // la ruta local falló, procedemos a descargar
            console.warn('[getImageBase64] readFile failed, will download', imgName, e);
          }
        }

        // 4) si no se leyó desde disco, descargar y luego leer
        if (!readResultData) {
          // use centralized URL builder (same as downloadWithConcurrency)
          const url = this.buildDownloadUrl(imgName);
          try {
            const res = await Filesystem.downloadFile({ url, path: imgName, directory: Directory.Cache });
            // registrar en estructuras locales
            this.allFileList.push({
              name: imgName.split('.')[0],
              date: Date.now(),
              path: res.path!,
              fechaCreacion: Date.now().toString(),
            });
            this.listFilesImages.push(imgName);
            const productKey = imgName.split('.')[0].split('_')[0];
            if (!this.mapImages.get(productKey)) this.mapImages.set(productKey, [res.path!]);
            else this.mapImages.get(productKey)?.push(res.path!);

            // persistir meta info (NO persistir base64)
            localStorage.setItem('listFilesImages', JSON.stringify(this.listFilesImages));
            if (this.mapImages.size !== 0) localStorage.setItem('mapImages', JSON.stringify(Array.from(this.mapImages.entries())));

            // leer archivo recien descargado
            // normalizamos el resultado a base64 string independientemente de si Filesystem devuelve string o Blob
            readResultData = await this.readFileResultToBase64('file://' + res.path!);
          } catch (err) {
            // console.error('[getImageBase64] download/read failed for', imgName, err);
            throw err;
          }
        }

        // 5) construir base64 y guardar en caché en memoria
        const base64 = 'data:image/png;base64,' + readResultData;
        this.mapImagesFilesByFilename.set(imgName, base64);

        // 6) también emitir event global para compatibilidad con consumidores existentes
        this.imageLoaded$.next({ imgName, imgSrc: base64 });

        // 7) notificar subscribers interesados por ese imgName (si existen)
        const subj = this.imageSubjects.get(imgName);
        if (subj) subj.next(base64);

        return base64;
      } finally {
        // limpiar pendingLoads al finalizar o fallar
        this.pendingLoads.delete(imgName);
      }
    })();

    this.pendingLoads.set(imgName, loadPromise);
    return loadPromise;
  }

  getImageObservable(imgName?: string): Observable<string | null> {
    if (!imgName) return of(null);
    if (this.mapImagesFilesByFilename.has(imgName)) {
      return of(this.mapImagesFilesByFilename.get(imgName)!);
    }
    // Si ya existe subject, lo devolvemos
    if (this.imageSubjects.has(imgName)) {
      const s = this.imageSubjects.get(imgName)!;
      // kick off load si no hay nada en curso
      if (!this.pendingLoads.has(imgName)) {
        this.getImageBase64(imgName).catch(() => {/* swallow, handled elsewhere */ });
      }
      return s.asObservable();
    }

    // crear subject, lanzar carga y devolver observable
    const subject = new BehaviorSubject<string | null>(null);
    this.imageSubjects.set(imgName, subject);

    // lanzar carga (getImageBase64 actualizará el subject cuando termine)
    this.getImageBase64(imgName).catch(err => {
      // en caso de error dejamos el subject con null (podrías setear un placeholder)
      console.warn('[getImageObservable] load failed for', imgName, err);
    });

    return subject.asObservable();
  }

  // Helper para leer y normalizar el resultado de Filesystem.readFile a base64 string
  private async readFileResultToBase64(path: string): Promise<string> {
    const fileResult = await Filesystem.readFile({ path });
    // fileResult.data puede ser string (base64) o Blob dependiendo de la plataforma / lib
    const data: any = (fileResult as any).data;
    if (typeof data === 'string') {
      return data;
    }
    // Si es Blob, convertir a base64 (sin el prefijo data:.../, retornamos solo la parte base64)
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return await this.blobToBase64(data);
    }
    // Fallback: intentar stringify
    return String(data);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('blobToBase64: FileReader error'));
      reader.onload = () => {
        const result = reader.result as string;
        // result es "data:<mime>;base64,<base64data>" -> devolvemos solo la parte base64
        const commaIndex = result.indexOf(',');
        if (commaIndex >= 0) {
          resolve(result.substring(commaIndex + 1));
        } else {
          resolve(result);
        }
      };
      reader.readAsDataURL(blob);
    });
  }

  clearMemoryCache() {
    this.mapImagesFilesByFilename.clear();
    // opcional: también limpiar subjects
    this.imageSubjects.forEach(s => s.complete());
    this.imageSubjects.clear();
    this.pendingLoads.clear();

  }

  public emitCachedImages(): void {
    // 1) si tenemos cache por filename (mapImagesFilesByFilename), emite cada entry
    try {
      if (this.mapImagesFilesByFilename && this.mapImagesFilesByFilename.size > 0) {
        for (const [imgName, base64] of this.mapImagesFilesByFilename.entries()) {
          if (base64) {
            this.imageLoaded$.next({ imgName, imgSrc: base64 });
          }
        }
      }

      // 2) si tienes la estructura antigua mapImagesFiles: Map<productKey, base64[]>
      // y mapImages: Map<productKey, paths[]>, intenta casar índices para emitir filename->base64
      if (this.mapImagesFiles && this.mapImagesFiles.size > 0 && this.mapImages && this.mapImages.size > 0) {
        for (const [productKey, base64Array] of this.mapImagesFiles.entries()) {
          const paths = this.mapImages.get(productKey) || [];
          for (let i = 0; i < base64Array.length; i++) {
            const b64 = base64Array[i];
            const path = paths[i];
            const filename = path ? path.split('/').pop() : null;
            if (filename && b64) {
              this.imageLoaded$.next({ imgName: filename!, imgSrc: b64 });
            }
          }
        }
      }

      // 3) fallback: si solo tienes mapImages (rutas) y no base64, puedes optar por iniciar lecturas lazy:
      // (descomentá si querés forzar lectura inmediata - cuidado con I/O)
      // for (const [productKey, paths] of this.mapImages.entries()) {
      //   for (const p of paths) {
      //     const filename = p.split('/').pop();
      //     if (filename) this.getImageBase64(filename).catch(()=>{});
      //   }
      // }

    } catch (err) {
      console.warn('[emitCachedImages] failed', err);
    }
  }


  public getImgForProduct(productId: string): string | null {
    if (!productId) return null;

    try {
      // 1) Buscar en cache por nombre de archivo (mapImagesFilesByFilename: filename -> base64)
      for (const [filename, base64] of this.mapImagesFilesByFilename.entries()) {
        if (filename.startsWith(productId) && base64) {
          return base64;
        }
      }

      // 2) Compatibilidad con estructura antigua: mapImagesFiles: Map<productKey, base64[]>
      if (this.mapImagesFiles && this.mapImagesFiles.has(productId)) {
        const arr = this.mapImagesFiles.get(productId) || [];
        if (arr.length > 0 && arr[0]) return arr[0];
      }

      // 3) Si hay rutas locales conocidas en mapImages (Map<productKey, path[]>), intentar casar con mapImagesFilesByFilename
      if (this.mapImages.has(productId)) {
        const paths = this.mapImages.get(productId) || [];
        for (const p of paths) {
          const filename = p.split('/').pop();
          if (filename && this.mapImagesFilesByFilename.has(filename)) {
            return this.mapImagesFilesByFilename.get(filename)!;
          }
        }

        // Si no hay base64 en caché, disparar carga asíncrona de la primera ruta disponible para llenar la caché
        const firstPath = paths[0];
        const filename = firstPath?.split('/').pop();
        if (filename) {
          // arrancamos la carga en background; no await para que la llamada sea síncrona
          this.getImageBase64(filename).catch(err => {
            console.warn('[getImgForProduct] background load failed for', filename, err);
          });
        }
      }

      // 4) Fallback: buscar en allFileList por nombre (allFileList guarda objetos con name y path)
      const fl = this.allFileList.find(it => it.name === productId || it.name.startsWith(productId + '_'));
      if (fl && fl.path) {
        const filename = fl.path.split('/').pop();
        if (filename) {
          if (this.mapImagesFilesByFilename.has(filename)) {
            return this.mapImagesFilesByFilename.get(filename)!;
          }
          // disparar carga en background si no estaba en caché
          this.getImageBase64(filename).catch(err => {
            console.warn('[getImgForProduct] background load failed for', filename, err);
          });
        }
      }
    } catch (err) {
      console.warn('[getImgForProduct] unexpected error', err);
    }

    // Si llegamos aquí, no hay imagen lista; retornar null (puede usarse placeholder en la UI)
    return '../../../assets/images/nodisponible.png';
  }
}