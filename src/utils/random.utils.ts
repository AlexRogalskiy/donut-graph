import {Bubble} from "../lib";

export function getRandomBubbles(): Bubble[] {
    const sectionCount = getRandomInt(5, 8);

    const bubbles: Bubble[] = [];

    for(let i=0; i<sectionCount;i++) {
        const sectionBubbles: Bubble[] = [];
        const sectionBubblesCount = getRandomInt(3, 55);

        for (let j=0; j<sectionBubblesCount;j++) {
            const bubbleValue = getRandomInt(1, 100);
            sectionBubbles.push({
                group: `Category ${i + 1}`,
                weight: bubbleValue,
                id: `bubble_${i}-${j}`
            });
        }
        bubbles.push(...sectionBubbles);
    }

    console.log(`${bubbles.length} bubbles generated`);

    return bubbles;
}

export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * Math.floor(max-min)) + min;
}

export function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
