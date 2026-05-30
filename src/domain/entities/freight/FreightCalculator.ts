import { Freight, Shipment } from "./Freight";

export class FreightRoadCalculator implements Freight {
    calculate(shipment: Shipment): number {
        const taxBase = 12;

        const weight = shipment.weight * 2;
        const volume = shipment.volume * 150;
        const distance = shipment.distance * 0.05;
        
        return Math.round(
        (taxBase + weight + volume + distance) * 100
        );
    }
}