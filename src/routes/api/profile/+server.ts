import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: 프로필 정보 조회
export const GET: RequestHandler = async ({ request }) => {
    try {
        const email = request.headers.get('x-user-email');

        if (!email) {
            return json({ message: '사용자 정보를 찾을 수 없습니다.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        return json(user);
    } catch (error) {
        console.error('Profile fetch error:', error);
        return json({ message: '프로필 정보를 가져오는데 실패했습니다.' }, { status: 500 });
    }
};

// PUT: 프로필 정보 업데이트
export const PUT: RequestHandler = async ({ request, locals }) => {
    try {
        const data = await request.json();
        
        // locals.user에서 이메일 가져오기
        if (!locals.user?.email) {
            return json({ message: '사용자 정보를 찾을 수 없습니다.' }, { status: 400 });
        }

        // 업데이트할 데이터 준비
        const updateData: any = {
            name: data.name
        };

        // 전체 평균학점이 있는 경우
        if (data.useOverallGpa) {
            updateData.overall_gpa = parseFloat(data.overall_gpa);
            // 학기별 학점은 모두 -1로 설정
            updateData.gpa_1_1 = -1;
            updateData.gpa_1_2 = -1;
            updateData.gpa_2_1 = -1;
            updateData.gpa_2_2 = -1;
            updateData.gpa_3_1 = -1;
        } else {
            // 학기별 학점 업데이트
            updateData.gpa_1_1 = parseFloat(data.semester_gpas[0]) || -1;
            updateData.gpa_1_2 = parseFloat(data.semester_gpas[1]) || -1;
            updateData.gpa_2_1 = parseFloat(data.semester_gpas[2]) || -1;
            updateData.gpa_2_2 = parseFloat(data.semester_gpas[3]) || -1;
            updateData.gpa_3_1 = parseFloat(data.semester_gpas[4]) || -1;

            // 유효한 학기 학점들의 평균을 전체 평균학점으로 설정
            const validGpas = [
                updateData.gpa_1_1,
                updateData.gpa_1_2,
                updateData.gpa_2_1,
                updateData.gpa_2_2,
                updateData.gpa_3_1
            ].filter(gpa => gpa > -1);

            updateData.overall_gpa = validGpas.length > 0
                ? validGpas.reduce((sum, gpa) => sum + gpa, 0) / validGpas.length
                : -1;
        }

        const updatedUser = await prisma.user.update({
            where: { email: locals.user.email },
            data: updateData
        });

        return json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error);
        return json({ message: '프로필 업데이트에 실패했습니다.' }, { status: 500 });
    }
}; 