import { IncidenceType } from "./tables/incidenceType";
import { IncidenceMotive } from "./tables/incidenceMotive";

export class  EventoVisita {
    /* Un pequeño objeto para mostrar las actividades de una visita en una lista
    no tiene otro uso. */
    constructor(
        public pos: number,
        public coIncid: number,
        public actividad: IncidenceType,
        public evento: IncidenceMotive,
        public comentario: string,
        public saved: boolean,

    ){}
}
