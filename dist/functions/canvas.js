"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFonts = exports.progressBar = exports.fittingString = exports.isLight = exports.pSBC = exports.roundedImage = exports.roundRect = void 0;
const skia_canvas_1 = require("skia-canvas");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
//From https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
const roundRect = (ctx, x, y, width, height, radius = 5, fill = true, stroke = false) => {
    if (typeof radius === "number") {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    else {
        let defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (let side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
};
exports.roundRect = roundRect;
const roundedImage = (ctx, image, x, y, width, height, radius) => {
    const ratio = height / image.height;
    const image_dims = {
        width: ratio * image.width,
        height: ratio * image.height,
    };
    ctx.save();
    (0, exports.roundRect)(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.drawImage(image, x + width / 2 - image_dims.width / 2, y, image_dims.width, image_dims.height);
    ctx.restore();
};
exports.roundedImage = roundedImage;
//https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
const pSBC = (p, c0, c1, l) => {
    let r, g, b, P, f, t, h, pSBCr, i = parseInt, m = Math.round, a = typeof c1 === "string";
    if (typeof p !== "number" ||
        p < -1 ||
        p > 1 ||
        typeof c0 !== "string" ||
        (c0[0] !== "r" && c0[0] !== "#") ||
        (c1 && !a))
        return null;
    if (!pSBCr)
        pSBCr = (d) => {
            let n = d.length, x = {};
            if (n > 9) {
                ([r, g, b, a] = d = d.split(",")), (n = d.length);
                if (n < 3 || n > 4)
                    return null;
                (x.r = i(r[3] == "a" ? r.slice(5) : r.slice(4))),
                    (x.g = i(g)),
                    (x.b = i(b)),
                    (x.a = a ? parseFloat(a) : -1);
            }
            else {
                if (n === 8 || n === 6 || n < 4)
                    return null;
                if (n < 6)
                    d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (n > 4 ? d[4] + d[4] : "");
                d = i(d.slice(1), 16);
                if (n === 9 || n === 5)
                    (x.r = (d >> 24) & 255),
                        (x.g = (d >> 16) & 255),
                        (x.b = (d >> 8) & 255),
                        (x.a = m((d & 255) / 0.255) / 1000);
                else
                    (x.r = d >> 16), (x.g = (d >> 8) & 255), (x.b = d & 255), (x.a = -1);
            }
            return x;
        };
    (h = c0.length > 9),
        (h = a ? (c1.length > 9 ? true : c1 === "c" ? !h : false) : h),
        (f = pSBCr(c0)),
        (P = p < 0),
        (t =
            c1 && c1 !== "c"
                ? pSBCr(c1)
                : P
                    ? { r: 0, g: 0, b: 0, a: -1 }
                    : { r: 255, g: 255, b: 255, a: -1 }),
        (p = P ? p * -1 : p),
        (P = 1 - p);
    if (!f || !t)
        return null;
    if (l)
        (r = m(P * f.r + p * t.r)), (g = m(P * f.g + p * t.g)), (b = m(P * f.b + p * t.b));
    else
        (r = m((P * f.r ** 2 + p * t.r ** 2) ** 0.5)),
            (g = m((P * f.g ** 2 + p * t.g ** 2) ** 0.5)),
            (b = m((P * f.b ** 2 + p * t.b ** 2) ** 0.5));
    (a = f.a),
        (t = t.a),
        (f = a >= 0 || t >= 0),
        (a = f ? (a < 0 ? t : t < 0 ? a : a * P + t * p) : 0);
    if (h)
        return ("rgb" +
            (f ? "a(" : "(") +
            r +
            "," +
            g +
            "," +
            b +
            (f ? "," + m(a * 1000) / 1000 : "") +
            ")");
    else
        return ("#" +
            (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0))
                .toString(16)
                .slice(1, f ? undefined : -2));
};
exports.pSBC = pSBC;
const isLight = (color) => {
    let r, g, b, color_match, hsp;
    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {
        // If HEX --> store the red, green, blue values in separate letiables
        color_match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        r = color_match[1];
        g = color_match[2];
        b = color_match[3];
    }
    else {
        // If RGB --> Convert it to HEX: http://gist.github.com/983661
        color_match = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));
        r = color_match >> 16;
        g = (color_match >> 8) & 255;
        b = color_match & 255;
    }
    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    // Using the HSP value, determine whether the color is light or dark
    return hsp > 127.5;
};
exports.isLight = isLight;
const fittingString = (c, str, maxWidth, ellipsis) => {
    let width = c.measureText(str).width;
    if (typeof ellipsis === "undefined")
        ellipsis = "…";
    let ellipsisWidth = c.measureText(ellipsis).width;
    if (width <= maxWidth || width <= ellipsisWidth) {
        return str;
    }
    else {
        let len = str.length;
        while (width >= maxWidth - ellipsisWidth && len-- > 0) {
            str = str.substring(0, len);
            width = c.measureText(str).width;
        }
        return str + ellipsis;
    }
};
exports.fittingString = fittingString;
const progressBar = (ctx, x, y, width, height, total, current, light) => {
    ctx.fillStyle = light ? "#2e2e2ebf" : "#bbb";
    (0, exports.roundRect)(ctx, x, y, width, height, 8);
    ctx.fillStyle = light ? "#1e1e1e" : "#fff";
    (0, exports.roundRect)(ctx, x, y, (width / total) * current, height, 8);
    ctx.beginPath();
    ctx.arc(x + (width / total) * current, y + height / 2, height * 1.25, 0, 360);
    ctx.fill();
    ctx.closePath();
};
exports.progressBar = progressBar;
const loadFonts = (FONTS) => {
    FONTS.forEach((f) => skia_canvas_1.FontLibrary.use(f.name, fs_1.default
        .readdirSync(path_1.default.join(__dirname, "..", "..", "fonts", f.path))
        .map((e) => `fonts/${f}/${e}`)));
};
exports.loadFonts = loadFonts;
