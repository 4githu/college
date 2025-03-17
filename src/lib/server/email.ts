import nodemailer from 'nodemailer';
import { GMAIL_USER, GMAIL_APP_PASSWORD } from '$env/static/private';

// 이메일 전송을 위한 설정
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false // 인증서 검증 비활성화
    }
});

export async function sendPasswordResetEmail(userEmail: string, resetToken: string) {
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    
    const mailOptions = {
        from: GMAIL_USER,
        to: userEmail,
        subject: '비밀번호 재설정 링크',
        html: `
            <h1>비밀번호 재설정</h1>
            <p>아래 링크를 클릭하여 비밀번호를 재설정하세요:</p>
            <a href="${resetLink}">비밀번호 재설정하기</a>
            <p>이 링크는 1시간 동안만 유효합니다.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('이메일 전송 실패:', error);
        return false;
    }
} 