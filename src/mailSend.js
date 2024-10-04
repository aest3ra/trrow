const nodemailer = require('nodemailer');

async function sendEmail({ to }) {
    console.log(to)

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'trrowmail@gmail.com',
            pass: 'laub lqzw ccjf isds',
        },
    });

    const mailOptions = {
        from: 'trrowmail@gmail.com',
        to,
        subject: '테스트',
        text: 
        `안녕하세요,
        
        영상 처리가 완료되었습니다.
        저희 trrow를 이용해주셔서 대단히 감사합니다.`,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email Send Error : ", error);
        } else {
          console.log('Email Sent');
        }
    });
}

module.exports = sendEmail;