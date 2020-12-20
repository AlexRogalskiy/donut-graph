import {Bubble} from "../..";
import {Coord, Grid, GridEdges, Point} from "../models/models";
import {getGridPointPosition, getDistance, getMaxDistance, getMinDistance} from "./coords.utils";

/**
 * Return a bubble radius based on it's weight proportional to donutArea
 *
 * @param bubbleValue Bubble coefficient weight
 * @param donutArea Donut surface
 * @param totalBubbleValues Sum of all bubbles coefficient weight
 */
const getBubbleRadius = (bubbleValue: number, donutArea: number, totalBubbleValues: number): number => {
    const bubbleArea = ((bubbleValue * donutArea) / totalBubbleValues);
    return Math.sqrt(bubbleArea / Math.PI);
};

/**
 * Return sum of all bubble weight
 *
 * @param bubbles
 */
const getAllBubbleWeightSum = (bubbles: Bubble[]): number => {
    return bubbles.reduce((acc, bubble) => {
        return acc + bubble.weight;
    }, 0);
};

/**
 * Generate an array representing a donut section grid
 * Each item index is a grid coordinate
 * Each item value is equal to the minimum distance with an obstacle (edge or any other bubble)
 *
 * @param edges
 * @param gridLength
 * @param startAngle
 * @param endAngle
 * @param innerRadius
 * @param outerRadius
 * @param bubbleCoords
 */
const generateGrid = (edges: GridEdges, gridLength: number, startAngle: number, endAngle: number, innerRadius: number, outerRadius: number, grid: Grid = [], bubbleCoords: Array<Coord> = []): Grid => {
    for (let i = 0; i < Math.pow(gridLength, 2); i++) {
        const x = i % gridLength;
        const y = i / gridLength;

        const gridPointCoord = getGridPointPosition(x, y, startAngle, endAngle, gridLength, innerRadius, outerRadius);
        let minDistance = null != grid[i] ? grid[i] : null;

        // compute edge distance from grid point only for an empty grid
        if (null === minDistance) {
            // reduce edges list to potential closest edges
            const closestEdges: Point[] = [];

            if (y > Math.round(gridLength / 2)) {
                closestEdges.push(...edges.right);
            }
            else if (y <= Math.round(gridLength /2)) {
                closestEdges.push(...edges.left);
            }

            if (x > Math.round(gridLength / 2)) {
                closestEdges.push(...edges.top);
            }
            else if (x <= Math.round(gridLength /2)) {
                closestEdges.push(...edges.bottom);
            }

            minDistance = getMinDistance(closestEdges, gridPointCoord);
        }

        const bubbleDistances = bubbleCoords.map(bubbleCoord => getDistance(gridPointCoord, bubbleCoord) - bubbleCoord.r);

        grid[i] = Math.min(minDistance, ...bubbleDistances);
    }

    return grid;
};

/**
 * Return bubble coordinates and radius in pixels
 *
 * @param gridLength
 * @param startAngle
 * @param endAngle
 * @param value
 * @param grid
 * @param innerRadius
 * @param outerRadius
 * @param donutArea
 * @param totalBubbleValues
 */
const getBubblePositionAndRadius = (gridLength: number, startAngle: number, endAngle: number, value: number, grid: Grid, innerRadius: number, outerRadius: number, donutArea: number, totalBubbleValues: number) => {
    let {maxDistance, maxDistanceCoords} = getMaxDistance(grid, startAngle, endAngle, gridLength, innerRadius, outerRadius);
    let bubbleRadius = getBubbleRadius(value, donutArea, totalBubbleValues);


    if (maxDistance - bubbleRadius < 0) {
        bubbleRadius = maxDistance - 2;
    }

    const offset = (maxDistance - bubbleRadius) / 2;

    const offsetX = offset * (Math.random() < 0.5 ? -1 : 1);
    const offsetY = offset * (Math.random() < 0.5 ? -1 : 1);


    return {bubbleX: maxDistanceCoords.x + (offsetX * Math.random()), bubbleY: maxDistanceCoords.y + (offsetY * Math.random()), bubbleR: bubbleRadius};
};

export {
    generateGrid,
    getBubbleRadius,
    getAllBubbleWeightSum,
    getBubblePositionAndRadius
}
