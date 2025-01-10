const express = require("express");
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const ytdl = require("@distube/ytdl-core");


const app = express();
app.use(cors());
app.use(express.json());

app.get("/download", async (req, res) => {
    const videoUrl = req.query.url;

    if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    try {
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
        const filePath = path.resolve(__dirname, `${title}.mp3`);

        const stream = ytdl(videoUrl, {
            quality: 'highestaudio',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                }
            }
        });
        

        ffmpeg(stream)
            .audioBitrate(128)
            .toFormat("mp3")
            .save(filePath)
            .on("end", () => {
                res.download(filePath, `${title}.mp3`, () => {
                    fs.unlinkSync(filePath); // Delete file after download
                });
            });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to process video" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
