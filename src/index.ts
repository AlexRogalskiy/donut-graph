import {Bubble, BubbleDonut, BubbleDonutPixiRenderer} from "./lib/index";
import {getRandomBubbles} from "./utils/random.utils";
import {BubbleWithCoordsAndRadius, Section} from "./lib/core/models/models";

import {Graphics} from "@pixi/graphics";
import {Text} from "@pixi/text";
import {Circle, Point, Rectangle} from "@pixi/math";
import {DonutSectionHitArea} from "./lib/rendering/utils/pixi.utils";
import {TweenMax} from "gsap";
import * as mesh from "@pixi/mesh-extras";

(function() {
    const labelOffset = 100;
    const bubbles = getRandomBubbles();

    const htmlContainer = document.getElementById('data-view');
    const {innerRadius, outerRadius} = getDonutRadius(htmlContainer, labelOffset);

    console.time('Bubble Donut drawing time');
    const bubbleDonut = new BubbleDonut(innerRadius, outerRadius, bubbles);

    const bubbleDonutRenderer: BubbleDonutPixiRenderer = new BubbleDonutPixiRenderer({
        bubbleDonut,
        htmlContainer,
        drawBubble,
        drawSection
    });

    bubbleDonutRenderer.init();
    bubbleDonutRenderer.draw();

    console.timeEnd('Bubble Donut drawing time');

    bubbleDonutRenderer.app.stage.interactive = true;
    bubbleDonutRenderer.app.stage.hitArea = new Rectangle(0, 0, bubbleDonutRenderer.app.screen.width, bubbleDonutRenderer.app.screen.height);
    bubbleDonutRenderer.app.stage.cursor = 'pointer';

    bubbleDonutRenderer.app.stage.on('pointertap', () => {
        activeBubble = null;
        clearOldActiveBubbleDisplay();
        makeSectionsNormal();

        const newScale = bubbleDonutRenderer.graphScale;
        TweenMax.to(bubbleDonutRenderer.mainContainer, 0.300, {pixi:{ scale: newScale, x: bubbleDonutRenderer.app.screen.width/2, y: bubbleDonutRenderer.app.screen.height/2 }});
    });

    const animate = () => {
        requestAnimationFrame(animate);
        bubbleDonutRenderer.app.render();
    };

    requestAnimationFrame(animate);

    const toolbarBtn = document.getElementById('toolbar--btn');

    toolbarBtn.onclick = () => {
        const newBubbles = getRandomBubbles();

        console.time('Bubble Donut drawing time');
        bubbleDonut.loadBubbles(newBubbles);
        bubbleDonutRenderer.clear();
        bubbleDonutRenderer.draw();
        console.timeEnd('Bubble Donut drawing time');
    };

    window.addEventListener('resize', () => {
        const {width, height, innerRadius, outerRadius} = getDonutRadius(htmlContainer, labelOffset);
        bubbleDonut.updateRadius(innerRadius, outerRadius);

        bubbleDonutRenderer.app.renderer.resize(width, height);
        bubbleDonutRenderer.app.stage.hitArea = new Rectangle(0, 0, bubbleDonutRenderer.app.screen.width, bubbleDonutRenderer.app.screen.height);

        bubbleDonutRenderer.draw();
        bubbleDonutRenderer.app.render();
    }, {
        passive: true
    });

    let activeSection: string = null;
    let activeBubble: Bubble = null;

    function drawBubble(bubble: BubbleWithCoordsAndRadius, sectionColor: number, bubbleShape: Graphics): Graphics {
        bubbleDonutRenderer.drawBubble(bubble, sectionColor, bubbleShape);
        bubbleShape.hitArea = new Circle(0, 0, bubble.r);
        bubbleShape.cursor = 'pointer';
        bubbleShape.interactive = true;

        bubbleShape.on('mouseover', () => {
            if (bubble.group !== activeSection) {
                makeSectionActive(bubble.group);
            }
        });

        bubbleShape.on('mouseout', (e) => {
            const sectionShape = bubbleDonutRenderer.getSectionShape(bubble.group);
            const localPosition = e.data.getLocalPosition(sectionShape);
            const pointerStillInsideSection = sectionShape.hitArea.contains(localPosition.x ,localPosition.y);
            if (false === pointerStillInsideSection && null === activeBubble) {
                makeSectionsNormal();
            }
        });

        bubbleShape.on('pointertap', (e) => {
            e.stopPropagation();
            activeBubble = bubble;
            makeSectionActive(bubble.group);

            const newScale = bubbleDonutRenderer.graphScale * 1.5;
            TweenMax.to(bubbleDonutRenderer.mainContainer, 0.300, {pixi:{ scale: newScale, x: this.app.screen.width/2 - bubble.x*newScale, y: this.app.screen.height/2 - bubble.y*newScale }});

            clearOldActiveBubbleDisplay();

            bubbleShape.clear();
            bubbleShape.beginFill(sectionColor);
            bubbleShape.lineStyle(bubbleShape.line.visible ? 0 : 2, 0x000000);
            bubbleShape.drawCircle(0, 0, bubble.r);
        });

        return bubbleShape;
    }

    function drawSection(section: Section, sectionColor: number, sectionShape: Graphics): Graphics {
        bubbleDonutRenderer.drawSection(section, sectionColor, sectionShape);
        sectionShape.alpha = 0;

        sectionShape.interactive = true;
        sectionShape.hitArea = new DonutSectionHitArea(section.startAngle, section.endAngle, bubbleDonut.innerRadius, bubbleDonut.outerRadius);
        sectionShape.on('mouseover', () => {
           if (section.id !== activeSection) {
               makeSectionActive(section.id);
           }
        });
        sectionShape.on('mouseout', (e) => {
            const localPosition = e.data.getLocalPosition(sectionShape);
            const pointerStillInside = sectionShape.hitArea.contains(localPosition.x,localPosition.y);
            if (false === pointerStillInside &&  null === activeBubble) {
                makeSectionsNormal();
            }
        });

        // draw section label
        const rectPaddingX = 50;
        const rectPaddingY = 20;

        const diffAngle = section.endAngle - section.startAngle;
        const sectionArcDistance = diffAngle * outerRadius;


        const nbRopePoints = 4;
        const ropePoints = [];

        const text = new Text(section.id, { fontSize: 16 } );
        text.resolution = window.devicePixelRatio;
        text.style.trim = true;

        const rectWidth = text.width + rectPaddingX;
        const rectHeight = text.height + rectPaddingY;
        const textStartAngle = (section.endAngle - (section.startAngle + rectWidth / sectionArcDistance * diffAngle)) / 2;
        const isTextreversed = (section.startAngle + textStartAngle + rectWidth / sectionArcDistance * diffAngle) < Math.PI && (section.startAngle + textStartAngle) > 0;

        if (isTextreversed) {
            text.pivot = new Point(text.width, text.height);
            text.scale.x = -1;
            text.scale.y = -1;
        }

        text.updateText();

        const rect = new Graphics();
        rect.beginFill(sectionColor);
        rect.drawRoundedRect(0, 0, rectWidth, rectHeight, rectHeight /2);
        rect.addChild(text);

        text.x = rectPaddingX/2;
        text.y = rectPaddingY/2;


        const rectTexture = bubbleDonutRenderer.app.renderer.generateTexture(rect, undefined, window.devicePixelRatio);

        for (let i = 0; i <= nbRopePoints; i++) {
            const gridPointDistanceWithCenter = outerRadius + (labelOffset - rect.height) / 2;
            const angle = section.startAngle + textStartAngle + (rectWidth / sectionArcDistance * diffAngle / nbRopePoints) * i;

            const ropePoint = new Point(gridPointDistanceWithCenter * Math.cos(angle),gridPointDistanceWithCenter * Math.sin(angle));
            ropePoints.push(ropePoint);
        }

        const rope = new mesh.SimpleRope( rectTexture, ropePoints, 0);
        bubbleDonutRenderer.mainContainer.addChild(rope);

        return sectionShape;
    }

    function clearOldActiveBubbleDisplay() {
        const sections = Array.from(bubbleDonut.sections);
        sections.forEach(section => {
            const [sectionKey,] = section;

            const sectionBubblesContainer = bubbleDonutRenderer.getSectionBubblesContainer(sectionKey);
            sectionBubblesContainer.children.forEach((bubbleShape: Graphics) => {
                if ((null === activeBubble || bubbleShape.name !== activeBubble.id) && bubbleShape.line.width > 0) {
                    const fillColor = bubbleShape.fill.color;
                    bubbleShape.clear();
                    bubbleShape.beginFill(fillColor);
                    bubbleShape.drawCircle(0, 0, (bubbleShape.hitArea as Circle).radius);
                    if (sectionKey !== activeSection) {
                        bubbleShape.alpha = 0.2;
                    }
                }
            });
        });
    }

    function makeSectionActive(sectionKey: string) {
        activeSection = sectionKey;
        const sectionBubblesContainer = bubbleDonutRenderer.getSectionBubblesContainer(sectionKey);
        sectionBubblesContainer.children.forEach((bubble: Graphics) => {
            bubble.alpha = 1;
        });

        bubbleDonutRenderer.getSectionShapes()
            .filter(section => section.key !== sectionKey)
            .forEach(section => {
            makeSectionInactive(section.key);
        });

        changeSectionBackgroundOpacity(sectionKey, 0.2);
    }

    function makeSectionNormal(sectionKey: string) {
        if (sectionKey === activeSection) {
            activeSection = null;
        }

        changeBubblesSectionOpacity(sectionKey, 1);
        changeSectionBackgroundOpacity(sectionKey, 0);
    }

    function makeSectionInactive(sectionKey: string) {
        changeSectionBackgroundOpacity(sectionKey, 0);
        changeBubblesSectionOpacity(sectionKey, 0.2);
    }

    function makeSectionsNormal() {
        bubbleDonutRenderer.getSectionShapes()
            .forEach(section => {
                makeSectionNormal(section.key);
            });
    }

    function changeBubblesSectionOpacity(sectionKey: string, alpha: number) {
        const sectionBubblesContainer = bubbleDonutRenderer.getSectionBubblesContainer(sectionKey);
        sectionBubblesContainer.children
            .filter((bubble: Graphics) => activeBubble === null ? true : bubble.name !== activeBubble.id)
            .forEach((bubble: Graphics) => {
            bubble.alpha = alpha;
        });
    }

    function changeSectionBackgroundOpacity(sectionKey: string, alpha: number) {
        const section = bubbleDonutRenderer.getSectionShape(sectionKey);
        section.alpha = alpha;
    }

    function getDonutRadius(htmlContainer: HTMLElement, labelOffset: number): {width: number; height: number; innerRadius: number; outerRadius: number} {
        const {width, height} = htmlContainer.getBoundingClientRect();

        const outerRadius = Math.min(Math.ceil(width/2), Math.ceil(height/2)) - labelOffset;
        const innerRadius = 0.2 * outerRadius;

        return {width, height, innerRadius, outerRadius};
    }
})();
