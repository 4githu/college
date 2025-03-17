import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

// GET: 프로필 정보 조회
export const GET: RequestHandler = async ({ request }) => {
    try {
        const email = request.headers.get('X-User-Email');

        if (!email) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '인증 정보가 없습니다.'
                }),
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                name: true,
                email: true,
                overall_gpa: true,
                gpa_1_1: true,
                gpa_1_2: true,
                gpa_2_1: true,
                gpa_2_2: true,
                gpa_3_1: true
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

        return json(user);
    } catch (error) {
        console.error('Profile fetch error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: '서버 오류가 발생했습니다.'
            }),
            { status: 500 }
        );
    }
};

// PUT: 프로필 정보 업데이트
export const PUT: RequestHandler = async ({ request }) => {
    try {
        const { 
            name, 
            gpa_1_1, 
            gpa_1_2, 
            gpa_2_1, 
            gpa_2_2, 
            gpa_3_1 
        } = await request.json();

        const email = request.headers.get('X-User-Email');

        if (!email) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '인증 정보가 없습니다.'
                }),
                { status: 401 }
            );
        }

        // 학기별 학점을 숫자로 변환
        const gpas = [gpa_1_1, gpa_1_2, gpa_2_1, gpa_2_2, gpa_3_1]
            .map(gpa => parseFloat(gpa));

        // 미이수(-1)를 제외한 학점들의 평균 계산
        const validGpas = gpas.filter(gpa => gpa !== -1);
        const overall_gpa = validGpas.length > 0 
            ? validGpas.reduce((sum, gpa) => sum + gpa, 0) / validGpas.length 
            : 0;

        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                name,
                overall_gpa,
                gpa_1_1: gpas[0],
                gpa_1_2: gpas[1],
                gpa_2_1: gpas[2],
                gpa_2_2: gpas[3],
                gpa_3_1: gpas[4]
            }
        });

        return json({
            success: true,
            message: '프로필이 성공적으로 업데이트되었습니다.'
        });
    } catch (error) {
        console.error('Profile update error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: '서버 오류가 발생했습니다.'
            }),
            { status: 500 }
        );
    }
}; 