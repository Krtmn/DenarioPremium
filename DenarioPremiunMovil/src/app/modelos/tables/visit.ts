import { Incidence } from "./incidence";

export class Visit {

    static visitJson(obj: Visit) {
        return new Visit(
            obj['idVisit'],
            obj['coVisit'],
            obj['stVisit'],
            obj['daVisit'],
            obj['coordenada'],
            obj['idClient'],
            obj['coClient'],
            obj['naClient'],
            obj['nuSequence'],
            obj['idUser'],
            obj['coUser'],
            obj['coEnterprise'],
            obj['idEnterprise'],
            obj['visitDetails'],
            obj['daInitial'],
            obj['daReal'],
            obj['idAddressClient'],
            obj['coAddressClient'],
            obj['coordenadaSaved'],
            obj['hasAttachments'],
            obj['nuAttachments'],
            obj['isDispatched'],
            obj['noDispatchedMotive'],
            obj['isReassigned'],
            obj['txReassignedMotive'],
            obj['daReassign'],
            obj['isVisited'],
            obj['coCycle'],
            obj['idCycle']


        );
    }

    constructor(
        public idVisit: number | null,
        public coVisit: string,
        public stVisit: number,
        public daVisit: string,
        public coordenada: string,
        public idClient: number,
        public coClient: string,
        public naClient: string,
        public nuSequence: number,
        public idUser: number,
        public coUser: string,
        public coEnterprise: string,
        public idEnterprise: number,
        public visitDetails: Incidence[],
        public daInitial: string,
        public daReal: string,
        public idAddressClient: number,
        public coAddressClient: string,
        public coordenadaSaved: boolean = false,
        public hasAttachments: boolean,
        public nuAttachments: number,
        public isDispatched: boolean = false,
        public noDispatchedMotive: string = '',
        public isReassigned: boolean = false,
        public txReassignedMotive: string = '',
        public daReassign: string = '',
        public isVisited: boolean = false,
        public coCycle: string = '',
        public idCycle: number | null = null


    ) { }
}