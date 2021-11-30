/// <reference types="node" />
import { GenerateOptions, GenericSong, Platform } from "./types";
/**
 * Generates a spotify card
 */
export declare const generate: (options: GenerateOptions) => Promise<Buffer>;
export { GenerateOptions, Platform, GenericSong };
