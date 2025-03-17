import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import bcrypt from 'bcrypt';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email, password } = await request.json();
        
        // 이메일에 이미 도메인이 포함되어 있는지 확인
        const fullEmail = email.includes('@') ? email : `${email}@djshs.djsch.kr`;

        console.log('Login attempt for:', fullEmail);

        // Prisma를 사용하여 사용자 조회
        const user = await prisma.user.findUnique({
            where: {
                email: fullEmail
            }
        });

        if (!user) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '이메일 또는 비밀번호가 잘못되었습니다.'
                }),
                { status: 401 }
            );
        }

        // 비밀번호 확인
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '이메일 또는 비밀번호가 잘못되었습니다.'
                }),
                { status: 401 }
            );
        }

        // 비밀번호를 제외한 사용자 정보 반환
        const { password: _, ...userWithoutPassword } = user;

        return json({
            success: true,
            message: '로그인 성공',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: '서버 오류가 발생했습니다.'
            }),
            { status: 500 }
        );
    }
}; 