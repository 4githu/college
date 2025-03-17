import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPasswordResetEmail } from '$lib/server/email';
import { prisma } from '$lib/prisma';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
    const { email } = await request.json();
    
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '등록되지 않은 이메일입니다.'
                }),
                { status: 404 }
            );
        }
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1시간 후 만료

        // 토큰을 데이터베이스에 저장
        await prisma.user.update({
            where: { email },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });
        
        const emailSent = await sendPasswordResetEmail(email, resetToken);
        
        if (emailSent) {
            return json({
                success: true,
                message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.'
            });
        } else {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '이메일 전송에 실패했습니다.'
                }),
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Reset password error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: '서버 오류가 발생했습니다.'
            }),
            { status: 500 }
        );
    }
}; 