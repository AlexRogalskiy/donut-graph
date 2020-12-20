import {Bubble, BubbleWithCoordsAndRadius, GridEdges, Point, Section} from "./models/models";
import {getGridPointPosition, getPointWithRatio} from "./utils/coords.utils";
import {generateGrid, getBubblePositionAndRadius, getAllBubbleWeightSum} from "./utils/bubble.utils";

class BubbleDonut {
    innerRadius: number = null;
    outerRadius: number = null;
    donutArea: number   = null;

    sections = new Map();

    private allBubbleWeightSum = 0;

    constructor(innerRadius: number, outerRadius: number, bubbles: Bubble[] = []) {
        this.updateRadius(innerRadius, outerRadius);

        if (bubbles.length > 0) {
            this.loadBubbles(bubbles);
        }
    }

    updateRadius(innerRadius: number, outerRadius: number) {
        let updateRatio = null;

        if (this.outerRadius != null) {
            updateRatio = outerRadius / this.outerRadius;
        }

        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;

        const externalCircleArea = Math.PI * Math.pow(outerRadius, 2);
        const innerCircleArea = Math.PI * Math.pow(innerRadius, 2);

        this.donutArea = externalCircleArea - innerCircleArea;

        if (updateRatio) {
            this.updateWithRatio(updateRatio);
        }
    }

    updateWithRatio(updateRatio: number) {
        Array.from(this.sections).forEach(section => {
            const [sectionKey, sectionDetails] = section;

            const updatedSection: Section = {
                ...sectionDetails,
                edges: {
                    top: sectionDetails.edges.top.map((edge: Point) => getPointWithRatio(edge, updateRatio)),
                    right: sectionDetails.edges.right.map((edge: Point) => getPointWithRatio(edge, updateRatio)),
                    bottom: sectionDetails.edges.bottom.map((edge: Point) => getPointWithRatio(edge, updateRatio)),
                    left: sectionDetails.edges.left.map((edge: Point) => getPointWithRatio(edge, updateRatio))
                },
                bubbles: sectionDetails.bubbles.map((bubble: BubbleWithCoordsAndRadius) => ({
                    ...bubble,
                    x: bubble.x * updateRatio,
                    y: bubble.y * updateRatio,
                    r: bubble.r * updateRatio
                }))
            };

            this.sections.set(sectionKey, updatedSection);
        });
    }

    loadBubbles(bubbles: Bubble[]) {
        this.allBubbleWeightSum = getAllBubbleWeightSum(bubbles);
        this.sections = new Map();

        const bubblesPerSection: {[key: string]: Array<Bubble>} = bubbles.reduce((acc: {[key: string]: Array<Bubble>}, bubble) => {
            if (undefined === acc[bubble.group]) {
                acc[bubble.group] = [];
            }

            acc[bubble.group].push(bubble);

            return acc;
        }, {});

        Object.keys(bubblesPerSection).forEach(sectionKey => {
            const sectionBubbles = bubblesPerSection[sectionKey];
            const sectionRatio = getAllBubbleWeightSum(sectionBubbles) / this.allBubbleWeightSum;
            this.addDonutSection(sectionKey, sectionRatio, sectionBubbles);
        });
    }

    private addDonutSection(sectionKey: string, ratio: number, bubbles: Array<Bubble>) {
        const previousSections = Array.from(this.sections);

        let startAngle = 0;

        if (previousSections.length > 0) {
            startAngle = previousSections[previousSections.length - 1][1].endAngle;
        }

        const endAngle = startAngle + ratio * 2 * Math.PI;

        const gridLength = Math.max(bubbles.length, 10);
        const gridEdges: GridEdges = {
            top: [],
            right: [],
            bottom: [],
            left: []
        };

        const innerRatio = Math.ceil(this.outerRadius / this.innerRadius);

        for (let i = 0; i <= gridLength; i++) {
            gridEdges.left.push(getGridPointPosition(i, 0, startAngle, endAngle, gridLength, this.innerRadius, this.outerRadius)); // side edge
            gridEdges.right.push(getGridPointPosition(i, gridLength, startAngle, endAngle, gridLength, this.innerRadius, this.outerRadius)); // side edge

            // reduce some edges to reduce compute time during grid generation
            if (0 === Math.round((i%innerRatio) / 2)) {
                gridEdges.bottom.push(getGridPointPosition(0, i, startAngle, endAngle, gridLength, this.innerRadius, this.outerRadius)); // inner edge
            }

            gridEdges.top.push(getGridPointPosition(gridLength, i, startAngle, endAngle, gridLength, this.innerRadius, this.outerRadius)); // outer edge
        }

        const bubblesWithCoordsAndRadius: BubbleWithCoordsAndRadius[] = [];

        // compute bubbles position and radius
        let grid = generateGrid(gridEdges, gridLength, startAngle, endAngle, this.innerRadius, this.outerRadius);

        bubbles.sort((a, b) => {
            if (a.weight === b.weight) return 0;
            return b.weight > a.weight ? 1 : -1;
        });

        bubbles.forEach(bubble => {
            const {bubbleX, bubbleY, bubbleR} = getBubblePositionAndRadius(gridLength, startAngle, endAngle, bubble.weight, grid, this.innerRadius, this.outerRadius, this.donutArea, this.allBubbleWeightSum);
            bubblesWithCoordsAndRadius.push({
                ...bubble,
                x: bubbleX,
                y: bubbleY,
                r: bubbleR
            });

            grid = generateGrid(gridEdges, gridLength, startAngle, endAngle, this.innerRadius, this.outerRadius, grid, bubblesWithCoordsAndRadius);
        });


        const section: Section = {
            id: sectionKey,
            ratio,
            bubbles: bubblesWithCoordsAndRadius,
            startAngle,
            endAngle,
            gridLength,
            edges: gridEdges
        };

        this.sections.set(sectionKey, section);

        return section;
    }
}

export {Bubble, BubbleDonut, BubbleWithCoordsAndRadius}
