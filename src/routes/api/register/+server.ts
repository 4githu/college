import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST({ request }) {
    const { email: studentId, name, password } = await request.json();
    
    // 이메일 주소 생성
    const email = studentId.includes('@') ? studentId : `${studentId}@djshs.djsch.kr`;

    try {
        // 이메일 중복 체크
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return json({ message: '이미 등록된 학번입니다.' }, { status: 400 });
        }

        // 인증 코드 생성 (6자리 숫자)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpiry = new Date(Date.now() + 1800000); // 30분 후 만료

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 임시 사용자 정보 저장
        await prisma.verificationCode.create({
            data: {
                email,
                name,
                password: hashedPassword,  // 해시된 비밀번호 저장
                code: verificationCode,
                expiresAt: codeExpiry
            }
        });

        // 이메일 전송 설정 수정
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            },
            tls: {
                rejectUnauthorized: false  // SSL 인증서 검증 비활성화
            }
        });

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: '대전고등학교 대학 진학 시스템 이메일 인증',
            html: `
                <h2>안녕하세요 ${name}님,</h2>
                <p>회원가입을 완료하려면 다음 인증 코드를 입력해주세요:</p>
                <h1 style="color: #007bff; font-size: 32px;">${verificationCode}</h1>
                <p>이 코드는 30분 동안 유효합니다.</p>
                <p>본인이 요청하지 않은 경우 이 메일을 무시하시면 됩니다.</p>
            `
        });

        return json({ message: '인증 코드가 이메일로 전송되었습니다.' });
    } catch (error) {
        console.error('Registration error:', error);
        return json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
} 