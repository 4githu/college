import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const token = url.searchParams.get('token');

        if (!token) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '유효하지 않은 토큰입니다.'
                }),
                { status: 400 }
            );
        }

        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiry: {
                    gt: new Date()
                },
                isVerified: false
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

        // 사용자 인증 상태 업데이트
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null
            }
        });

        return json({
            success: true,
            message: '이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: '서버 오류가 발생했습니다.'
            }),
            { status: 500 }
        );
    }
}; 