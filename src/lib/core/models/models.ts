interface Point {
    x: number;
    y: number;
}

interface Bubble {
    id: string;
    weight: number;
    group: string;
}

interface Section {
    id: string,
    ratio: number,
    bubbles: BubbleWithCoordsAndRadius[],
    startAngle: number,
    endAngle: number,
    gridLength: number,
    edges: GridEdges
}

interface GridEdges {
    top: Point[];
    right: Point[];
    bottom: Point[];
    left: Point[]
}

type Coord = Point & {r: number};
type BubbleWithCoordsAndRadius = Bubble & Coord;
type Grid = Array<number>;

export {
    Coord,
    BubbleWithCoordsAndRadius,
    Bubble,
    Section,
    Grid,
    GridEdges,
    Point
}
