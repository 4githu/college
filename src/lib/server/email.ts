import nodemailer from 'nodemailer';
// Import 'env' object from the dynamic private environment module
import { env } from '$env/dynamic/private';

// 이메일 전송을 위한 설정
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    auth: {
        // Access variables as properties of the 'env' object
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false // 인증서 검증 비활성화 (주의: 프로덕션에서는 신중하게 사용)
    }
});

/**
 * Sends a password reset email to the specified user.
 * @param userEmail The email address of the user.
 * @param resetToken The unique token for password reset.
 * @returns True if the email was sent successfully, false otherwise.
 */
export async function sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
    // Consider using a dynamic base URL from environment variables for production
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    const mailOptions = {
        // Access variable as a property of the 'env' object
        from: env.GMAIL_USER,
        to: userEmail,
        subject: '비밀번호 재설정 링크', // Password Reset Link
        html: `
            <h1>비밀번호 재설정</h1> <!-- Password Reset -->
            <p>아래 링크를 클릭하여 비밀번호를 재설정하세요:</p> <!-- Click the link below to reset your password: -->
            <a href="${resetLink}">비밀번호 재설정하기</a> <!-- Reset Password -->
            <p>이 링크는 1시간 동안만 유효합니다.</p> <!-- This link is valid for 1 hour only. -->
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent successfully to ${userEmail}`);
        return true;
    } catch (error) {
        console.error('이메일 전송 실패: Failed to send email:', error);
        return false;
    }
}

// Ensure you have GMAIL_USER and GMAIL_APP_PASSWORD defined in your .env file
// Example .env content:
// GMAIL_USER=your_email@gmail.com
// GMAIL_APP_PASSWORD=your_generated_app_password
