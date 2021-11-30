import { Platform } from "./types";
export declare const REGEXPS: {
    [platform in Exclude<Platform, "custom">]: RegExp;
};
export declare const defaultOptions: {
    width: number;
    height: number;
    margin: number;
    progressBarHeight: number;
    titleSize: number;
    albumTitleSize: number;
    imageRadius: number;
    cardRadius: number;
    progressFontSize: number;
};
