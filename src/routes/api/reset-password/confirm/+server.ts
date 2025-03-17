import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import bcrypt from 'bcrypt';

export const POST: RequestHandler = async ({ request }) => {
    const { token, newPassword } = await request.json();
    
    try {
        // 토큰 검증 로직 구현
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date() // 현재 시간보다 만료 시간이 더 나중인지 확인
                }
            }
        });

        if (!user) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '유효하지 않거나 만료된 토큰입니다.'
                }),
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null // 토큰 사용 후 초기화
            }
        });

        return json({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: '비밀번호 변경에 실패했습니다.'
            }),
            { status: 500 }
        );
    }
}; 