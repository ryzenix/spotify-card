import { generate } from "./src/index";
import fs from "fs";
import path from "path";
import ColorThief from "colorthief";
import parse from "parse-color";

describe("spotify-card", () => {
    beforeAll(() => {
        if (!fs.existsSync(path.join(__dirname, "testing")))
            fs.mkdirSync(path.join(__dirname, "testing"));
    });
    // it("Generates correctly for Spotify", async () => {
    //     const image = await generate({
    //         url: "https://open.spotify.com/track/2shwfq9XQBHMnSnhPOJECa?si=82d3e13c789a4793",
    //     });
    //     fs.writeFileSync(path.join(__dirname, "testing", "spotify_card.png"), image);
    // });
    test("Generates correctly for Custom Song Data", async () => {
        const color = await ColorThief.getColor('https://cdn.discordapp.com/avatars/617777631257034783/e2bed3905d7b9200f1196dcd80cb93b0.png?size=4096');
        const image = await generate({
            songData: {
                title: "kiri#0000",
                cover: "https://cdn.discordapp.com/avatars/617777631257034783/e2bed3905d7b9200f1196dcd80cb93b0.png?size=4096",
                album: 'Level 1 | Ranked 5th'
            },
            currentTime: 1000,
            totalTime: 20430,
            background: parse(color).hex,
            blurImage: true,
            adaptiveTextcolor: true,
            progressBar: true,
            coverBackground: true
        });
        return fs.writeFileSync(path.join(__dirname, "testing", "custom_card.png"), image);
    });
});
