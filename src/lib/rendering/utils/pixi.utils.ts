import {getDistance} from "../../core/utils/coords.utils";

export class DonutSectionHitArea {
    startAngle: number = null;
    endAngle: number = null;
    innerRadius: number = null;
    outerRadius: number = null;

    constructor(startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) {
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
    }

    contains(x: number, y: number) {
        const d = getDistance({x, y}, {x: 0, y: 0});

        if (d < this.innerRadius || d > this.outerRadius) {
            return false;
        }

        let angle = Math.atan2(y, x);
        if (angle < 0) {
            angle += (2 * Math.PI);
        }

        const angle2Degrees = angle * 180 / Math.PI;
        const startAngle2Degrees = this.startAngle * 180 / Math.PI;
        const endAngle2Degrees = this.endAngle * 180 / Math.PI;

        if (angle2Degrees < startAngle2Degrees || angle2Degrees > endAngle2Degrees) {
            return false;
        }

        return true;
    }
}
