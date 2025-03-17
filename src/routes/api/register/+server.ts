import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// 이메일 전송을 위한 설정
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "your-email@gmail.com",  // 실제 이메일로 교체 필요
        pass: "your-app-password"      // 실제 앱 비밀번호로 교체 필요
    }
});

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email, password, name } = await request.json();

        // 이메일 도메인 검증
        if (!email.endsWith('@djshs.djsch.kr')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '학교 이메일(@djshs.djsch.kr)만 사용 가능합니다.'
                }),
                { status: 400 }
            );
        }

        // 기존 사용자 확인
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '이미 등록된 이메일입니다.'
                }),
                { status: 400 }
            );
        }

        // 인증 토큰 생성
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 유효

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 미인증 상태로 사용자 생성
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                verificationToken,
                verificationTokenExpiry: tokenExpiry,
                isVerified: false
            }
        });

        // 인증 이메일 전송
        const verificationLink = `http://your-domain.com/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
            from: '"대전과학고 지원시스템" <your-email@gmail.com>',
            to: email,
            subject: "이메일 인증을 완료해주세요",
            html: `
                <h2>대전과학고 지원시스템 이메일 인증</h2>
                <p>안녕하세요, ${name}님!</p>
                <p>아래 링크를 클릭하여 이메일 인증을 완료해주세요:</p>
                <a href="${verificationLink}">이메일 인증하기</a>
                <p>이 링크는 24시간 동안 유효합니다.</p>
            `
        });

        return json({
            success: true,
            message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: '서버 오류가 발생했습니다.'
            }),
            { status: 500 }
        );
    }
}; 