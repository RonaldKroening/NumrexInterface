const express = require('express');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req, res) => {
    try {

        const response = await fileToDict(req.file.path);
        res.json(response);
    } catch (error) {
        res.status(400).json({ error: error.toString() });
    }
});

const parquet = require('parquetjs-lite');

async function parquetToDict(filePath) {
    const reader = await parquet.ParquetReader.openFile(filePath);
    const cursor = reader.getCursor();
    let record = null;
    const results = {};

    // Read records one by one and convert to dictionary
    while ((record = await cursor.next())) {
        for (const key in record) {
            if (!results[key]) {
                results[key] = [];
            }
            results[key].push(record[key]);
        }
    }

    await reader.close();
    return results;
}


function fileToDict(filePath) {
    return new Promise((resolve, reject) => {
        const results = {};

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (headers) => {
                headers.forEach((header) => {
                    results[header] = [];
                });
            })
            .on('data', (data) => {
                for (const key in data) {
                    results[key].push(data[key]);
                }
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
