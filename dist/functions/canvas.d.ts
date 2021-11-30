import path from "path";
export declare const roundRect: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius?: number | {
    tl: number;
    tr: number;
    br: number;
    bl: number;
}, fill?: boolean, stroke?: boolean) => void;
export declare const roundedImage: (ctx: CanvasRenderingContext2D, image: any, x: number, y: number, width: number, height: number, radius: number) => void;
export declare const pSBC: (p: number, c0: string, c1?: string, l?: boolean) => string;
export declare const isLight: (color: string) => boolean;
export declare const fittingString: (c: CanvasRenderingContext2D, str: string, maxWidth: number, ellipsis?: string) => string;
export declare const progressBar: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, total: number, current: number, light: boolean) => void;
export declare const loadFonts: (FONTS: {
    path: string;
    name: string;
}[]) => void;
