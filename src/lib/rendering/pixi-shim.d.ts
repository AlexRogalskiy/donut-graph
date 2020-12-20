declare module '@pixi/utils' {
    import { utils } from '@pixi/utils';
    export import string2hex = utils.string2hex;
}

declare module '@pixi/display' {
    export {Container, DisplayObject} from  "@pixi/display";
}

declare module '@pixi/math' {
    export {Point, Circle, Rectangle} from  "@pixi/math";
}

declare module '@pixi/app' {
    export {Application} from  "@pixi/app";
}

declare module '@pixi/graphics' {
    export {Graphics} from  "@pixi/graphics";
}

declare module '@pixi/core' {
    export {Renderer, BatchRenderer} from  "@pixi/core";
}

declare module '@pixi/interaction' {
    export {InteractionManager} from  "@pixi/interaction";
}

declare module '@pixi/ticker' {
    export {TickerPlugin} from  "@pixi/interaction";
}

declare module '@pixi/text' {
    export {Text} from  "@pixi/text";
}

declare module '@pixi/mesh' {
    export { mesh } from '@pixi/mesh';
}

declare module '@pixi/mesh-extras' {
    export { mesh } from '@pixi/mesh-extras';
}
