"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const skia_canvas_1 = require("skia-canvas");
const canvas_1 = require("./functions/canvas");
const functions_1 = require("./functions");
const constants_1 = require("./constants");
const index_1 = require("./functions/index");
const colorthief_1 = __importDefault(require("colorthief"));
(0, canvas_1.loadFonts)([{ path: "Noto_Sans_KR", name: "NS" }]);
/**
 * Generates a spotify card
 */
const generate = async (options) => {
    options = { ...constants_1.defaultOptions, ...options };
    if (options.blurImage && typeof options.blurProgress === "undefined")
        options.blurProgress = true;
    const canvas = new skia_canvas_1.Canvas(options.width, options.height);
    const ctx = canvas.getContext("2d");
    let song_data;
    if (typeof options.songData !== "undefined") {
        const valid_song_data = (0, index_1.isValidSongData)(options.songData);
        if (typeof valid_song_data === "string")
            throw new Error("Invalid song data: " + valid_song_data);
        song_data = {
            title: options.songData.title,
            album: options.songData.album || "",
            cover: options.songData.cover,
            dominantColor: options.songData.dominantColor ||
                (0, functions_1.rgbToHex)(await colorthief_1.default.getColor(options.songData.cover)),
            artist: options.songData.artist || "",
            platform: "custom",
        };
    }
    else {
        if (!options.url)
            throw new Error("Missing URL or song data");
        const song_type = options.platform || (0, functions_1.getSongType)(options.url);
        song_data = await (0, functions_1.getTrackData)(song_type, options.url);
    }
    song_data.dominantColor = options.background || (0, canvas_1.pSBC)(0.001, song_data.dominantColor);
    const image = await (0, skia_canvas_1.loadImage)(song_data.cover);
    const is_image_light = (0, canvas_1.isLight)(song_data.dominantColor);
    const text_color = options.adaptiveTextcolor
        ? (0, canvas_1.pSBC)(is_image_light ? -0.9 : 0.7, song_data.dominantColor)
        : options.coverBackground
            ? "#fff"
            : is_image_light
                ? "#000"
                : "#fff";
    const is_text_light = (0, canvas_1.isLight)(text_color);
    if (!options.coverBackground) {
        ctx.fillStyle = song_data.dominantColor;
        (0, canvas_1.roundRect)(ctx, 0, 0, canvas.width, canvas.height, options.cardRadius);
    }
    else {
        const width = canvas.width;
        const height = (canvas.width / image.width) * image.height;
        //Gradient to darken the image and make the text more readable
        const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, canvas.height);
        gradient.addColorStop(1, "#1e1e1e30");
        gradient.addColorStop(0, "#1e1e1e60");
        ctx.save();
        (0, canvas_1.roundRect)(ctx, 0, 0, canvas.width, canvas.height, options.cardRadius);
        ctx.clip();
        ctx.drawImage(image, 0, -height / 2, width, height);
        ctx.restore();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (options.blurImage) {
        ctx.filter = "blur(30px)";
        ctx.drawImage(image, options.margin, options.margin, canvas.height - options.margin * 2, canvas.height - options.margin * 2);
    }
    ctx.filter = "none";
    (0, canvas_1.roundedImage)(ctx, image, options.margin, options.margin, canvas.height - options.margin * 2, canvas.height - options.margin * 2, options.imageRadius);
    const second_part_x = canvas.height + options.margin;
    // Song title
    ctx.font = `bold ${options.titleSize}px NS`;
    ctx.fillStyle = text_color;
    const title_metrics = ctx.measureText(song_data.title);
    const middle_second_part = (canvas.height - options.margin * 2) / 2;
    const title_height = options.margin * 1.5 +
        title_metrics.actualBoundingBoxAscent +
        title_metrics.actualBoundingBoxDescent;
    if (song_data.platform === "youtube") {
        //Since we have no album for youtube, we can put the title on 2 lines
        const first_part = (0, canvas_1.fittingString)(ctx, song_data.title, canvas.width - (canvas.height + options.margin * 3), "-");
        if (first_part.endsWith("-")) {
            //If the text doesn't fit on one line, split it in 2 parts
            const second_part = (0, canvas_1.fittingString)(ctx, song_data.title.split(first_part.slice(0, -1))[1].trim(), canvas.width - (canvas.height + options.margin * 3));
            const album_metrics = ctx.measureText(second_part);
            const album_height = title_height +
                options.margin * 0.5 +
                album_metrics.actualBoundingBoxAscent +
                album_metrics.actualBoundingBoxDescent;
            ctx.fillText(second_part, second_part_x, options.progressBar
                ? album_height
                : middle_second_part +
                    album_metrics.actualBoundingBoxAscent +
                    album_metrics.actualBoundingBoxDescent +
                    options.margin);
        }
        ctx.fillText(first_part, second_part_x, options.progressBar ? title_height : middle_second_part + options.margin / 2);
    }
    else {
        //Just write the text normally for other platforms
        ctx.fillText((0, canvas_1.fittingString)(ctx, song_data.title, canvas.width - (canvas.height + options.margin * 3)), second_part_x, options.progressBar ? title_height : middle_second_part + options.margin / 2);
    }
    // Album title
    ctx.font = `${options.albumTitleSize}px NS`;
    ctx.fillStyle = options.coverBackground ? text_color : (0, canvas_1.pSBC)(-0.5, text_color);
    const album_metrics = ctx.measureText(song_data.album);
    const album_height = title_height +
        options.margin +
        album_metrics.actualBoundingBoxAscent +
        album_metrics.actualBoundingBoxDescent;
    ctx.fillText((0, canvas_1.fittingString)(ctx, song_data.album, canvas.width - (canvas.height + options.margin * 3)), second_part_x, options.progressBar
        ? album_height
        : middle_second_part +
            album_metrics.actualBoundingBoxAscent +
            album_metrics.actualBoundingBoxDescent +
            options.margin * 1.5);
    if (options.progressBar) {
        if (!options.currentTime || !options.totalTime)
            throw new Error("Progressbar is enabled but no totalTime or currentTime has been provided");
        // Progress text
        const progress_text_y = canvas.height - options.margin;
        const progress_bar = {
            x: second_part_x,
            y: progress_text_y - options.margin * 1.75,
            width: canvas.width - (second_part_x + options.margin * 2),
            height: 20,
        };
        ctx.font = `${options.progressFontSize}px NS`;
        ctx.fillStyle = text_color;
        //Get the current time in youtube-like format
        const current_formatted = (0, functions_1.formatMilliseconds)(options.currentTime);
        ctx.fillText(current_formatted, second_part_x - ctx.measureText(current_formatted).width / 3, progress_text_y);
        //Get the total time in youtube-like format
        const total_formatted = (0, functions_1.formatMilliseconds)(options.totalTime);
        ctx.fillText(total_formatted, second_part_x + progress_bar.width - (ctx.measureText(total_formatted).width / 3) * 2, progress_text_y);
        // Progress bar
        if (options.blurProgress) {
            // Set a wider spread for darker cards for a better result
            ctx.shadowBlur = is_text_light ? 30 : 80;
            ctx.shadowColor = (0, canvas_1.pSBC)(is_text_light ? -0.7 : 0.02, text_color);
        }
        //Draw the progress bar
        (0, canvas_1.progressBar)(ctx, progress_bar.x, progress_bar.y, progress_bar.width, progress_bar.height, options.totalTime, options.currentTime, is_image_light);
    }
    //Skia property directly returning the png Buffer
    return canvas.png;
};
exports.generate = generate;
