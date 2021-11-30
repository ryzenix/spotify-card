"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidSongData = exports.getTrackData = exports.formatMilliseconds = exports.getSoundCloudTrack = exports.getSpotifyTrack = exports.getYoutubeTrack = exports.getDeezerTrack = exports.rgbToHex = exports.getSongType = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../constants");
const colorthief_1 = __importDefault(require("colorthief"));
const himalaya_1 = require("himalaya");
const cheerio_1 = require("cheerio");
const millify_1 = require("millify");
const getSongType = (url) => {
    for (let platform in constants_1.REGEXPS)
        if (constants_1.REGEXPS[platform].test(url))
            return platform;
    return null;
};
exports.getSongType = getSongType;
//From https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
const rgbToHex = (rgb) => {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
};
exports.rgbToHex = rgbToHex;
const getDeezerTrack = async (url) => {
    const [_, id] = url.match(constants_1.REGEXPS.deezer) || [];
    if (!id)
        throw new Error("Invalid Deezer URL provided");
    return (await (await (0, axios_1.default)({ url: `https://api.deezer.com/track/${id}`, method: "GET" })).data);
};
exports.getDeezerTrack = getDeezerTrack;
const getYoutubeTrack = async (url) => {
    const [_, id] = url.match(constants_1.REGEXPS.youtube) || [];
    if (!id)
        throw new Error("Invalid Youtube URL provided");
    return (await (0, axios_1.default)({
        url: "https://youtubei.googleapis.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
        method: "POST",
        data: {
            context: {
                client: {
                    hl: "en",
                    clientName: "WEB",
                    clientVersion: "2.20210721.00.00",
                    mainAppWebInfo: {
                        graftUrl: `/watch?v=${id}`,
                    },
                },
            },
            videoId: id,
        },
    })).data.videoDetails;
};
exports.getYoutubeTrack = getYoutubeTrack;
//From https://github.com/microlinkhq/spotify-url-info
const getSpotifyTrack = async (url) => {
    const [_, id] = url.match(constants_1.REGEXPS.spotify) || [];
    if (!id)
        throw new Error("Invalid Spotify URL provided");
    const uri = `spotify:track:${id}`;
    const embed = `https://embed.spotify.com/?uri=${uri}`;
    return (0, axios_1.default)(embed)
        .then((res) => res.data)
        .then(himalaya_1.parse)
        .then((embed) => {
        const scripts = embed
            .filter((e) => e.tagName === "html")[0]
            .children.filter((e) => e.tagName === "body")[0]
            .children.filter((e) => e.tagName === "script");
        const resourceScript = scripts.filter((e) => e.attributes.findIndex((a) => a.value === "resource") !== -1);
        const hydrateScript = scripts.filter((e) => e.children[0] && /%22data%22%|"data":/.test(e.children[0].content));
        if (resourceScript.length > 0) {
            // found data in the older embed style
            return JSON.parse(decodeURIComponent(resourceScript[0].children[0].content));
        }
        else if (hydrateScript.length > 0) {
            // found hydration data
            // parsing via looking for { to be a little bit resistant to code changes
            const scriptContent = hydrateScript[0].children[0].content.includes("%22data%22%")
                ? decodeURIComponent(hydrateScript[0].children[0].content)
                : hydrateScript[0].children[0].content;
            const data = JSON.parse("{" + scriptContent.split("{").slice(1).join("{").trim()).data;
            return data.entity ? data.entity : data;
        }
        else {
            return Promise.reject(new Error("Couldn't find any data in embed page that we know how to parse"));
        }
    })
        .then(sanityCheck);
};
exports.getSpotifyTrack = getSpotifyTrack;
const sanityCheck = (data) => {
    if (!data || !data.type || !data.name) {
        return Promise.reject(new Error("Data doesn't seem to be of the right shape to parse"));
    }
    return Promise.resolve(data);
};
//From https://github.com/DevSnowflake/soundcloud-scraper
const getSoundCloudTrack = async (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            const raw = (await (await (0, axios_1.default)(url)).data);
            if (!raw)
                return reject(new Error("Couldn't parse html!"));
            const $ = (0, cheerio_1.load)(raw);
            const duration = raw.split('<meta itemprop="duration" content="') &&
                raw.split('<meta itemprop="duration" content="')[1] &&
                raw.split('<meta itemprop="duration" content="')[1].split('" />')[0];
            const name = raw.split('<h1 itemprop="name">') &&
                raw.split('<h1 itemprop="name">')[1].split("by <a")[1] &&
                raw.split('<h1 itemprop="name">')[1].split("by <a")[1].split(">")[1] &&
                raw
                    .split('<h1 itemprop="name">')[1]
                    .split("by <a")[1]
                    .split(">")[1]
                    .split("</a>")[0]
                    .replace("</a", "");
            const trackURLBase = raw.split('},{"url":"')[1];
            let trackURL = null;
            if (trackURLBase)
                trackURL = trackURLBase.split('","')[0];
            const obj = {
                id: $('meta[property="al:ios:url"]').attr("content").split(":").pop(),
                title: $('meta[property="og:title"]').attr("content"),
                description: $('meta[property="og:description"]').attr("content"),
                thumbnail: $('meta[property="og:image"]').attr("content"),
                url: $('link[rel="canonical"]').attr("href"),
                duration,
                playCount: $('meta[property="soundcloud:play_count"]').attr("content"),
                commentsCount: $('meta[property="soundcloud:comments_count"]').attr("content"),
                likes: $('meta[property="soundcloud:like_count"]').attr("content"),
                genre: raw.split(',"genre":"')[1] &&
                    raw
                        .split(',"genre":"')[1]
                        .split('","')[0]
                        .replace(/\\u0026/g, "&"),
                author: {
                    name: name || null,
                    username: $('meta[property="soundcloud:user"]')
                        .attr("content")
                        .replace("https://soundcloud.com/", ""),
                    url: $('meta[property="soundcloud:user"]').attr("content"),
                    avatarURL: (raw.split('"avatar_url":"') &&
                        raw
                            .split('"avatar_url":"')[raw.split('"avatar_url":"').length - 1].split('"')[0]) ||
                        null,
                    verified: !raw.includes('","verified":false,"visuals"'),
                    followers: parseInt(raw.split(',"followers_count":') &&
                        raw.split(',"followers_count":')[1].split(",")[0]) || 0,
                    following: parseInt(raw.split(',"followings_count":') &&
                        raw.split(',"followings_count":')[1].split(",")[0]) || 0,
                },
                publishedAt: new Date(raw.split("<time pubdate>")[1] &&
                    raw.split("<time pubdate>")[1].split("</time>")[0]) || null,
                embedURL: $('link[type="text/json+oembed"]').attr("href"),
                track: {
                    hls: trackURL ? trackURL.replace("/progressive", "/hls") : null,
                    progressive: trackURL || null,
                },
                trackURL: trackURL || null,
            };
            return resolve(obj);
        }
        catch (e) {
            return reject(e);
        }
    });
};
exports.getSoundCloudTrack = getSoundCloudTrack;
// From https://stackoverflow.com/questions/19700283/how-to-convert-time-in-milliseconds-to-hours-min-sec-format-in-javascript/67462589#67462589
const formatMilliseconds = (milliseconds, padStart = false) => {
    return (0, millify_1.millify)(milliseconds);
};
exports.formatMilliseconds = formatMilliseconds;
const getTrackData = async (song_type, url) => {
    let song_data;
    switch (song_type) {
        case "soundcloud": {
            try {
                const soundcloud_res = await (0, exports.getSoundCloudTrack)(url);
                const color = (0, exports.rgbToHex)(await colorthief_1.default.getColor(soundcloud_res.thumbnail));
                song_data = {
                    artist: soundcloud_res.author.name,
                    title: soundcloud_res.title,
                    album: soundcloud_res.description,
                    cover: soundcloud_res.thumbnail,
                    platform: "soundcloud",
                    dominantColor: color,
                };
            }
            catch (e) {
                console.error("Error when fetching song from soundcloud, are you sure the link you provided is correct ?", e);
            }
            break;
        }
        case "spotify": {
            try {
                const spotify_res = await (0, exports.getSpotifyTrack)(url);
                song_data = {
                    artist: spotify_res.artists[0].name,
                    title: spotify_res.name,
                    album: spotify_res.album.name,
                    cover: spotify_res.album.images[0].url,
                    platform: "spotify",
                    dominantColor: spotify_res.dominantColor,
                };
            }
            catch (e) {
                console.error("Error when fetching song from spotify, are you sure the link you provided is correct ?", e);
            }
            break;
        }
        case "youtube": {
            try {
                const youtube_res = await (0, exports.getYoutubeTrack)(url);
                const cover = youtube_res.thumbnail.thumbnails[youtube_res.thumbnail.thumbnails.length - 1]
                    .url;
                const color = (0, exports.rgbToHex)(await colorthief_1.default.getColor(cover));
                song_data = {
                    artist: youtube_res.author,
                    title: youtube_res.title,
                    album: "",
                    cover,
                    platform: "youtube",
                    dominantColor: color,
                };
            }
            catch (e) {
                console.error("Error when fetching song from youtube, are you sure the link you provided is correct ?", e);
            }
            break;
        }
        case "deezer": {
            try {
                const deezer_res = await (0, exports.getDeezerTrack)(url);
                const color = (0, exports.rgbToHex)(await colorthief_1.default.getColor(deezer_res.album.cover_xl));
                song_data = {
                    artist: deezer_res.artist.name,
                    title: deezer_res.title,
                    album: deezer_res.album.title,
                    cover: deezer_res.album.cover_xl,
                    platform: "deezer",
                    dominantColor: color,
                };
            }
            catch (e) {
                console.error("Error when fetching song from deezer, are you sure the link you provided is correct ?", e);
            }
            break;
        }
        default:
            throw new Error('The URL provided did not match any platform, you can pass the "platform" parameter if you want to force the detection');
    }
    return song_data;
};
exports.getTrackData = getTrackData;
const isValidSongData = (songData) => {
    const keys = {
        cover: "string",
        title: "string",
        album: "string?",
        dominantColor: "string?",
        platform: "string?",
    };
    for (let key in keys) {
        if (!keys[key].endsWith("?")) {
            if (!songData[key])
                return key;
            if (typeof songData[key] !== keys[key].replace("?", ""))
                return key;
        }
    }
    return true;
};
exports.isValidSongData = isValidSongData;
