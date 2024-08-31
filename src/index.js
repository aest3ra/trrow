const express = require('express');
const path = require('path');
const multer = require("multer");
const axios = require('axios');
const fs = require("fs");
const FormData = require('form-data');
const sendEmail = require('./mailSend');

const app = express();
const PORT = 8080;

const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
    res.send('trrow');
});

app.get('/getVideos', (req, res) => {
    res.send(`
    <form method="post" enctype="multipart/form-data">
       <input type="file" name="userfiles" multiple />
       <br />
       <button type="submit">파일 업로드</button>
    </form>`);
});

app.post('/getVideos', upload.array('userfiles'), async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).send('파일이 업로드되지 않았습니다.');
    }
    const formData = new FormData();
    files.forEach(file => {
        formData.append('userfiles', fs.createReadStream(file.path));
    });

    try {
        // const response = await axios.post('http://127.0.0.1:7777', formData, {
        //     headers: {
        //         ...formData.getHeaders()
        //     }
        // });

        // const processedVideoPath = path.join(__dirname, 'upload', 'processedVideo.mp4');
        // fs.writeFileSync(processedVideoPath, response.data);

        res.send('파일이 성공적으로 업로드 및 처리되었습니다.');
    } catch (error) {
        console.error('파일 처리 중 오류 발생:', error);
        res.status(500).send('파일 처리 중 오류가 발생했습니다.');

    } finally {
        req.files.forEach(file => {
            console.log(file.path);  // 디버깅 용도로 파일 경로 출력
            if (fs.existsSync(file.path)) {  // 파일 존재 여부 확인
                try {
                    fs.unlinkSync(file.path);  // 파일 삭제
                    console.log(`파일 삭제 성공: ${file.path}`);
                } catch (err) {
                    console.error(`파일 삭제 중 오류 발생: ${file.path}`, err.message);
                }
            } else {
                console.warn(`파일이 이미 삭제되었거나 존재하지 않음: ${file.path}`);
            }
        });
    }
});


app.get('/sendMail', async (req, res) => {
    await sendEmail({to: 'kevin3709@naver.com'});
    res.send('mail send');
});


app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});