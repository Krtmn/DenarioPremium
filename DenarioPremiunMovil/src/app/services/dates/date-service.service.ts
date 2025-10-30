import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateServiceService {

  dateFormatComplete = new Intl.DateTimeFormat("es-VE", {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  public dateFormatOptionsShort: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }

  dateFormatShort = new Intl.DateTimeFormat("es-VE", this.dateFormatOptionsShort);



  constructor() { }

  now() {
    var r = new Date();

    return r.toLocaleString();
  }

  // ...existing code...
  dateFrom(input: string) {
    // Si no hay input, devuelve ahora
    if (!input) {
      return new Date();
    }

    // Detectamos formatos sin zona horaria explícita:
    // - "YYYY-MM-DD"
    // - "YYYY-MM-DD HH:mm"
    // - "YYYY-MM-DD HH:mm:ss"
    // - "YYYY-MM-DDTHH:mm"  (sin zona)
    // Si hay zona ('Z' o +hh:mm o -hh:mm) dejamos que Date.parse maneje la zona.
    const localDateRegex = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?(?:\.\d+)?$/;

    const m = input.match(localDateRegex);
    if (m) {
      const year = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      const day = parseInt(m[3], 10);
      const hour = m[4] ? parseInt(m[4], 10) : 0;
      const minute = m[5] ? parseInt(m[5], 10) : 0;
      const second = m[6] ? parseInt(m[6], 10) : 0;
      // Construimos en HORARIO LOCAL para evitar el desfase de zona (off-by-one día)
      return new Date(year, month - 1, day, hour, minute, second);
    }

    // Fallback: si el string contiene zona horaria o no coincide con el regex,
    // usamos Date.parse para respetar offsets y formatos complejos.
    const ts = Date.parse(input);
    if (!isNaN(ts)) {
      return new Date(ts);
    }

    // Último recurso: constructor directo (puede producir Invalid Date si es inválido)
    return new Date(input);
  }
  // ...existing code...

  hoyISO() {
    //devuelve un string ISO 8601 que representa la fecha de hoy, a la medianoche
    //para usar con componentes ion-datetime
    var r = new Date();
    r.setHours(0, 0, 0, 0);
    return r.toISOString().substring(0, 19);//.replace("T"," ");
  }
  toISOString(input: string) {
    // tranforma una fecha en un string ISO 8601
    //para usar con componentes ion-datetime
    var r = this.dateFrom(input);
    return r.toISOString().substring(0, 19);
  }

  futureDaysISO(days: number) {
    //devuelve un string ISO 8601 que representa la fecha de hoy + days, a la medianoche
    //para usar con componentes ion-datetime
    var r = new Date();
    r.setHours(0, 0, 0, 0);
    r.setDate(r.getDate() + days);
    return r.toISOString().substring(0, 19);//.replace("T"," ");
  }

  pastDaysISO(days: number) {
    //devuelve un string ISO 8601 que representa la fecha de hoy - days, a la medianoche
    //para usar con componentes ion-datetime
    var r = new Date();
    r.setHours(0, 0, 0, 0);
    r.setDate(r.getDate() - days);
    return r.toISOString().substring(0, 19);//.replace("T"," ");
  }

  onlyDateHoyISO() {
    //devuelve un string ISO 8601 que representa la fecha de hoy, a la medianoche
    //esta funcion remueve la hora
    var r = new Date();
    r.setHours(0, 0, 0, 0);
    return r.toISOString().substring(0, 10);
  }

  hoyISOFullTime() {
    //devuelve un string ISO 8601 que representa la fecha de hoy, hora actual
    //para usar en fechas de bd (da_visit, da_order, etc)
    var r = new Date();
    var s = r.getFullYear() + "-" +
      (r.getMonth() + 1).toString().padStart(2, '0') + "-" +
      r.getDate().toString().padStart(2, '0') + " " +
      r.getHours().toString().padStart(2, '0') + ":" +
      r.getMinutes().toString().padStart(2, '0') + ":" +
      r.getSeconds().toString().padStart(2, '0');
    return s;
    //return r.toISOString().substring(0,19).replace("T"," "); << esto da una hora UTC, o sea, 4 horas en el futuro (en vzla)

    //NOTA: con los cambios que se han hecho, ya no es ISO, 
    //pero si le cambio el nombre a estas alturas rompo todo el proyecto,
    // si lo vuelvo ISO, el webService no lo acepta.
  }




  toMidnight(input: string) {
    //devuelve la misma fecha, pero a la media noche
    var r = this.dateFrom(input);
    r.setHours(0, 0, 0, 0);
    return r.toISOString().substring(0, 19);
  }

  formatComplete(input: string) {
    var r = this.dateFrom(input);

    return this.dateFormatComplete.format(r);
  }

  formatShort(input: string) {
    var r = this.dateFrom(input);

    return this.dateFormatShort.format(r);
  }

  generateCO(i: number) {
    //genera un CO (coOrder, coVisit, etc)
    //el i se usa para evitar conflictos si se generan muchos en el mismo instante
    //resultado es algo como 123456789.i
    //recomiendo usar el i del for(...){} si estas generando muchos documentos. Si no, un 0 sirve.
    var co = new Date().getTime().toString() + "." + i.toString();
    //console.log("generateCO: "+co);
    return co;
  }

  compareDates(min: string, date: string) {
    //compara dos fechas, devuelve true si la fecha es mayor o igual a la minima
    //min y date son strings ISO 8601 (yyyy-mm-dd hh:mm:ss)
    //console.log("compareDates: "+min+" > "+date+" = "+(min>date));
    return min.substring(0, 10) <= date.substring(0, 10);
  }




}
