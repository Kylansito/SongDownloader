const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const youtubeDl = require('youtube-dl-exec');

const app = express();
app.use(cors());
app.use(express.json());

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

app.get("/download", async (req, res) => {
    const videoUrl = req.query.url;
    
    if (!videoUrl) {
        return res.status(400).json({ error: "No URL provided" });
    }

    try {
        // Get video info first
        const info = await youtubeDl(videoUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            preferFreeFormats: true,
        });

        const title = info.title.replace(/[^\w\s]/gi, '');
        const outputPath = path.join(downloadsDir, `${title}.mp3`);

        // Download and convert to mp3 with best quality
        await youtubeDl(videoUrl, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '0', // Best quality
            output: outputPath,
            embedThumbnail: false,
            addMetadata: true,
            noCheckCertificates: true,
            preferFreeFormats: true,
            noWarnings: true,
            noCallHome: true,
        });

        res.download(outputPath, `${title}.mp3`, (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            // Delete the file after sending
            fs.unlink(outputPath, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            });
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ 
            error: "Failed to download video",
            details: error.message 
        });
    }
});

// Cleanup endpoint
app.get("/cleanup", (req, res) => {
    try {
        const files = fs.readdirSync(downloadsDir);
        files.forEach(file => {
            const filePath = path.join(downloadsDir, file);
            fs.unlinkSync(filePath);
        });
        res.json({ message: "Cleanup successful" });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: "Cleanup failed" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Cleaning up before exit...');
    try {
        const files = fs.readdirSync(downloadsDir);
        files.forEach(file => {
            fs.unlinkSync(path.join(downloadsDir, file));
        });
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
    process.exit(0);
});