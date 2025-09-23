import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateServiceService {

  dateFormatComplete =  new Intl.DateTimeFormat("es-VE", {
    day: 'numeric',
    month:'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  public dateFormatOptionsShort: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month:'numeric',
    year: 'numeric',
  }

  dateFormatShort =  new Intl.DateTimeFormat("es-VE", this.dateFormatOptionsShort);



  constructor() { }

  now() {
    var r = new Date();
    
    return r.toLocaleString();
}

  dateFrom(input: string) {
    var r = new Date();
    r.setTime(Date.parse(input));

    return r;
  }

  hoyISO() {
    //devuelve un string ISO 8601 que representa la fecha de hoy, a la medianoche
    //para usar con componentes ion-datetime
    var r = new Date();
    r.setUTCHours(0, 0, 0, 0);
    return r.toISOString().substring(0, 19);//.replace("T"," ");
  }
  toISOString(input: string){
    // tranforma una fecha en un string ISO 8601
    //para usar con componentes ion-datetime
    var r = this.dateFrom(input);
    return r.toISOString().substring(0, 19);
  }

  futureDaysISO(days: number) {
    //devuelve un string ISO 8601 que representa la fecha de hoy + days, a la medianoche
    //para usar con componentes ion-datetime
    var r = new Date();
    r.setUTCHours(0, 0, 0, 0);
    r.setDate(r.getDate() + days);
    return r.toISOString().substring(0, 19);//.replace("T"," ");
  }

  pastDaysISO(days: number) {
    //devuelve un string ISO 8601 que representa la fecha de hoy - days, a la medianoche
    //para usar con componentes ion-datetime
    var r = new Date();
    r.setUTCHours(0, 0, 0, 0);
    r.setDate(r.getDate() - days);
    return r.toISOString().substring(0, 19);//.replace("T"," ");
  }

  onlyDateHoyISO(){
    //devuelve un string ISO 8601 que representa la fecha de hoy, a la medianoche
    //esta funcion remueve la hora
    var r = new Date();
    r.setUTCHours(0,0,0,0);
    return r.toISOString().substring(0,10);
  }

  hoyISOFullTime(){
    //devuelve un string ISO 8601 que representa la fecha de hoy, hora actual
    //para usar en fechas de bd (da_visit, da_order, etc)
    var r = new Date();
    var s = r.getFullYear() + "-" + 
     (r.getMonth() + 1).toString().padStart(2,'0') + "-" +
      r.getDate().toString().padStart(2,'0') + " " +
      r.getHours().toString().padStart(2,'0') + ":" +
      r.getMinutes().toString().padStart(2,'0') + ":" +
      r.getSeconds().toString().padStart(2,'0');
    return s;
    //return r.toISOString().substring(0,19).replace("T"," "); << esto da una hora UTC, o sea, 4 horas en el futuro (en vzla)
    
    //NOTA: con los cambios que se han hecho, ya no es ISO, 
    //pero si le cambio el nombre a estas alturas rompo todo el proyecto,
    // si lo vuelvo ISO, el webService no lo acepta.
  }




  toMidnight(input: string){
    //devuelve la misma fecha, pero a la media noche
    var r = this.dateFrom(input);
    r.setUTCHours(0,0,0,0);
    return r.toISOString().substring(0,19);
  }

  formatComplete(input: string){
    var r =  this.dateFrom(input);

    return this.dateFormatComplete.format(r);
  }

  formatShort(input: string){
    var r =  this.dateFrom(input);

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
    return min.substring(0,9) > date.substring(0,9);
  }




}
