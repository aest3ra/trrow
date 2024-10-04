const express = require('express');
const path = require('path');
const multer = require("multer");
const axios = require('axios');
const fs = require("fs");
const FormData = require('form-data');
const sendEmail = require('./mailSend');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: '*',
}));

app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

const PORT = 80;

const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
    res.send(`
    <form method="post" enctype="multipart/form-data">
       <input type="file" name="userfiles" multiple />
       <br />
       <br />
       <input type="text" name="mail" />
       <br />
       <br />
       <button type="submit">파일 업로드</button>
    </form>`);
});

app.post('/', upload.array('userfiles'), async (req, res) => {
    const mail = req.body.mail
    const files = req.files;

    if (!files || files.length === 0) {
        files == null
        return res.status(400).send('파일이 업로드되지 않았습니다.');
    }
    const formData = new FormData();
    files.forEach(file => {
        formData.append('userfiles', fs.createReadStream(file.path));
    });

    try {
        await sendEmail({to: mail});
        // const response = await axios.post('http://127.0.0.1:7777', formData, {
        //     headers: {
        //         ...formData.getHeaders()
        //     }
        // });

        // const processedVideoPath = path.join(__dirname, 'upload', 'processedVideo.mp4');
        // fs.writeFileSync(processedVideoPath, response.data);

        res.json({success: '파일이 성공적으로 업로드 및 처리되었습니다.'});
    } catch (error) {
        console.error('파일 처리 중 오류 발생:', error);
        res.status(500).send('파일 처리 중 오류가 발생했습니다.');

    } finally {
        
        req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                    console.log(`파일 삭제 성공: ${file.path}`);
                } catch (err) {
                    console.error(`파일 삭제 중 오류 발생: ${file.path}`, err.message);
                }
            } else {
                console.warn(`파일이 이미 삭제되었거나 존재하지 않음: ${file.path}`);
            }
    })
    }
    
});


app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});