import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const email = url.searchParams.get('email');

        if (!email) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '이메일이 필요합니다.'
                }),
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                applications: {
                    select: {
                        departmentId: true
                    }
                }
            }
        });

        if (!user) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                }),
                { status: 404 }
            );
        }

        return json(user.applications);
    } catch (error) {
        console.error('Get user applications error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: '서버 오류가 발생했습니다.'
            }),
            { status: 500 }
        );
    }
}; 