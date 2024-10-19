const express = require('express');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const sendEmail = require('./mailSend');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = 80;
const upload = multer({ dest: 'uploads/' });
ffmpeg.setFfmpegPath(ffmpegStatic);

async function mergeVideos(filePaths, outputFilePath) {
    return new Promise((resolve, reject) => {
        const ffmpegCommand = ffmpeg();

        filePaths.forEach((filePath) => {
            ffmpegCommand.input(filePath);
        });

        let filterInputs = '';
        for (let i = 0; i < filePaths.length; i++) {
            filterInputs += `[${i}:v:0][${i}:a:0]`;
        }
        const filterComplex = `${filterInputs}concat=n=${filePaths.length}:v=1:a=1[v][a]`;

        ffmpegCommand
            .complexFilter(filterComplex)
            .outputOptions('-map', '[v]', '-map', '[a]')
            .outputOptions('-c:v', 'libx264', '-c:a', 'aac')
            .on('end', resolve)
            .on('error', (err, stdout, stderr) => {
                console.error('ffmpeg stderr:', stderr);
                reject(err);
            })
            .save(outputFilePath);
    });
}

app.get('/', (req, res) => {
    res.send(`
    <form method="post" enctype="multipart/form-data">
       <input type="file" name="file" multiple />
       <br /><br />
       <input type="text" name="mail" placeholder="이메일 주소" />
       <br /><br />
       <input type="text" name="title" placeholder="영상 제목" />
       <br /><br />
       <button type="submit">파일 업로드</button>
    </form>`);
});

app.post('/', upload.array('file'), async (req, res) => {
    const mail = req.body.mail;
    let title = req.body.title;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).send('파일이 업로드되지 않았습니다.');
    }

    title = title.replace(/[<>:"/\\|?*]+/g, '') || 'output';
    const filePaths = files.map((file) => file.path);
    const outputFilePath = path.join('uploads', `${title}.mp4`);

    try {
        await mergeVideos(filePaths, outputFilePath);
        console.log('비디오 병합이 완료되었습니다.');

        const formData = new FormData();
        formData.append('file', fs.createReadStream(outputFilePath));
        formData.append('mail', mail);

        await sendEmail({ to: mail });

        const response = await axios.post('http://34.28.21.224:8000/files', formData, {
            headers: { ...formData.getHeaders() },
        });

        res.json({ success: '파일이 성공적으로 업로드 및 처리되었습니다.' });
    } catch (error) {
        console.error('비디오 처리 또는 전송 중 오류 발생:', error);
        res.status(500).send('파일 처리 중 오류가 발생했습니다.');
    } finally {
        fs.rmSync(outputFilePath, { force: true });
        files.forEach((file) => fs.rmSync(file.path, { force: true }));
    }
});

app.listen(PORT, () => {
    console.log(`Express 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
