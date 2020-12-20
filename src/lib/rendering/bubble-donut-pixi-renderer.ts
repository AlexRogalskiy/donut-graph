import {BubbleDonut, BubbleWithCoordsAndRadius} from "../core/bubble-donut";

import {getRandomColor} from "../../utils/random.utils";

import * as utils from "@pixi/utils";
import {Container, DisplayObject} from "@pixi/display";
import {Application} from "@pixi/app";
import {Graphics} from "@pixi/graphics";
import {BatchRenderer, Renderer} from '@pixi/core'
import {InteractionManager} from "@pixi/interaction";
import { TickerPlugin } from '@pixi/ticker';
import '@pixi/mixin-get-child-by-name';
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

import Timeout = NodeJS.Timeout;
import {Section} from "../core/models/models";

Renderer.registerPlugin('batch', BatchRenderer);
Renderer.registerPlugin('interaction', InteractionManager);
Application.registerPlugin(TickerPlugin);
PixiPlugin.registerPIXI({
    DisplayObject,
    VERSION: "5"
});
gsap.registerPlugin(PixiPlugin);


type DrawOverride<T> = (model: T, sectionColor: number, sectionShape: Graphics) => Graphics;

export class BubbleDonutPixiRenderer {
    app: Application = null;
    bubbleDonut: BubbleDonut = null;
    mainContainer: Container = null;
    htmlContainer: HTMLElement;
    delayTimeouts: Timeout[] = [];
    graphScale = 1;

    private sectionColors: number[] = [];
    private drawBubbleOverride:DrawOverride<BubbleWithCoordsAndRadius>  = null;
    private drawSectionOverride: DrawOverride<Section> = null;


    constructor(init: {
        bubbleDonut: BubbleDonut;
        htmlContainer: HTMLElement;
        drawBubble?: DrawOverride<BubbleWithCoordsAndRadius>;
        drawSection?: DrawOverride<Section>;
    }) {
        this.bubbleDonut = init.bubbleDonut;
        this.drawBubbleOverride = (null != init.drawBubble ? init.drawBubble.bind(this) : this.drawBubble);
        this.drawSectionOverride = (null != init.drawSection ? init.drawSection.bind(this) : this.drawSection);
        this.htmlContainer = init.htmlContainer;
    }

    init() {
        this.initStage();
    }

    initStage() {
        const {width, height} = this.htmlContainer.getBoundingClientRect();

        this.app = new Application({
            width: width,
            height: height,
            antialias: true,
            // make screen flick
            //resizeTo: this.htmlContainer,
            backgroundColor: 0xFFFFFF,
            autoResize: true,
            resolution: window.devicePixelRatio
        });

        this.htmlContainer.appendChild(this.app.view);
    }

    drawBubble(bubble: BubbleWithCoordsAndRadius, sectionColor: number, bubbleShape: Graphics): Graphics {
        const {x, y, r} = bubble;

        bubbleShape.beginFill(sectionColor);
        bubbleShape.drawCircle(0, 0, r);
        bubbleShape.position = {x, y};
        bubbleShape.name = bubble.id;

        return bubbleShape;
    }

    drawSection(section: Section, sectionColor: number, sectionShape: Graphics): Graphics {
        sectionShape.beginFill(sectionColor);
        sectionShape.arc(0, 0, this.bubbleDonut.innerRadius, section.startAngle, section.endAngle);
        sectionShape.lineTo(this.bubbleDonut.outerRadius * Math.cos(section.endAngle), this.bubbleDonut.outerRadius * Math.sin(section.endAngle));
        sectionShape.arc(0, 0, this.bubbleDonut.outerRadius, section.endAngle, section.startAngle, true);
        sectionShape.lineTo(this.bubbleDonut.innerRadius * Math.cos(section.startAngle), this.bubbleDonut.innerRadius * Math.sin(section.startAngle));
        sectionShape.alpha = 0.2;
        sectionShape.name = section.id;

        return sectionShape;
    }

    generateSectionColors(nbSections: number) {
        for (let i = 0; i < nbSections; i++) {
            this.sectionColors.push(utils.string2hex(getRandomColor()));
        }
    }

    draw() {
        if (null === this.mainContainer) {
            this.mainContainer = new Container();
            this.mainContainer.interactiveChildren = true;
            this.mainContainer.x = this.app.screen.width / 2;
            this.mainContainer.y = this.app.screen.height / 2;

            const sections = Array.from(this.bubbleDonut.sections.entries());
            if (this.sectionColors.length === 0) {
                this.generateSectionColors(sections.length);
            }

            sections.forEach((section, i) => {
                const [sectionKey, sectionDetails] = section;

                const sectionContainer = new Container();

                const sectionBubblesContainer = new Container();
                sectionBubblesContainer.name = `section_bubbles_container_${sectionKey}`;

                const sectionShape = new Graphics();

                const donutSectionShape = this.drawSectionOverride(sectionDetails, this.sectionColors[i], sectionShape);
                sectionContainer.addChild(donutSectionShape);

                sectionDetails.bubbles.forEach((bubbleToAdd: BubbleWithCoordsAndRadius) => {
                    const bubbleShape = new Graphics();
                    const bubblePoint = this.drawBubbleOverride(bubbleToAdd, this.sectionColors[i], bubbleShape);
                    sectionBubblesContainer.addChild(bubblePoint);
                });

                sectionContainer.addChild(sectionBubblesContainer);
                this.mainContainer.addChild(sectionContainer);
            });

            this.app.stage.addChild(this.mainContainer);
        }
        // only update
        else {
            this.mainContainer.x = this.app.screen.width / 2;
            this.mainContainer.y = this.app.screen.height / 2;
            this.mainContainer.width = this.bubbleDonut.outerRadius * 2;
            this.mainContainer.height = this.bubbleDonut.outerRadius * 2;
            this.graphScale = this.mainContainer.scale.x;
        }
    }

    getSectionShape(sectionKey: string): Graphics {
        return this.app.stage.getChildByName(sectionKey, true);
    }

    getSectionShapes(): Graphics[] {
        return Array.from(this.bubbleDonut.sections).map(section => {
            const [sectionKey,] = section;

            return {key: sectionKey, shape: this.getSectionShape(sectionKey)};
        })
    }

    getSectionBubblesContainer(sectionKey: string): Graphics {
        return this.mainContainer.getChildByName(`section_bubbles_container_${sectionKey}`, true);
    }

    clear() {
        this.graphScale = 1;
        this.mainContainer = null;
        this.delayTimeouts.forEach(timeout => clearTimeout(timeout));
        this.app.stage.removeChildren();
        this.sectionColors = [];
    }
}
