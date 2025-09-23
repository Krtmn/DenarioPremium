import { Response } from 'src/app/modelos/response';

export class Imagenes {
    static imagenesJson(obj: Imagenes) {
        return new Imagenes(
            obj['date'],
            obj['name'],
            obj['path'],
            obj['fechaCreacion'],
        );
    }

    constructor(
        public date: number,
        public name: string = "",
        public path: string = "",
        public fechaCreacion: string = "",
    ) { }
}

export interface ResponseImages extends Response {
    downloadFileList: string[],
    removeFileList: string[],
    
}

export interface ResponseFiles extends Response {
    downloadFileListDispatch: string[],
    removeFileListDispatch: string[],
    
}