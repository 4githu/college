import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

export const GET: RequestHandler = async ({ url, locals }) => {
    const departmentId = url.searchParams.get('departmentId');
    const user = locals.user;

    if (!departmentId) {
        return json({ error: 'Department ID is required' }, { status: 400 });
    }

    try {
        const applications = await prisma.application.findMany({
            where: {
                departmentId: departmentId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        overall_gpa: true
                    }
                }
            }
        });

        const formattedApplications = applications.map(app => ({
            gpa: app.user.overall_gpa,
            isCurrentUser: app.user.id === user?.id
        })).sort((a, b) => b.gpa - a.gpa);  // GPA 기준 내림차순 정렬

        console.log('Formatted applications:', formattedApplications); // 디버깅용 로그 추가
        return json(formattedApplications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        return json({ error: 'Failed to fetch applications' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const data = await request.json();
        console.log('[Applications POST] Received data:', data);
        console.log('[Applications POST] Current user:', locals.user);

        const user = await prisma.user.findUnique({
            where: { email: data.userEmail },
            select: {
                id: true,
                email: true,
                overall_gpa: true,
                applications: {
                    include: {
                        department: {
                            include: {
                                college: {
                                    include: {
                                        university: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            console.log('[Applications POST] User not found');
            return json({ error: 'User not found' }, { status: 401 });
        }

        // 신청하려는 학과의 대학교 정보 조회
        const targetDepartment = await prisma.department.findUnique({
            where: { id: data.departmentId },
            include: {
                college: {
                    include: {
                        university: true
                    }
                }
            }
        });

        if (!targetDepartment) {
            return json({ error: '학과 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 같은 대학교의 다른 학과 신청 여부 확인
        const existingApplication = user.applications.find(app => 
            app.department.college.university.id === targetDepartment.college.university.id
        );

        // 기존 신청이 있으면 삭제
        if (existingApplication) {
            await prisma.application.delete({
                where: { id: existingApplication.id }
            });
            console.log('[Applications POST] Deleted existing application:', existingApplication.id);
        }

        // 새로운 지원 생성
        const application = await prisma.application.create({
            data: {
                userId: user.id,
                departmentId: data.departmentId
            }
        });

        // 학과의 현재 지원자 수 업데이트
        await prisma.department.update({
            where: { id: data.departmentId },
            data: {
                currentApplications: {
                    increment: 1
                }
            }
        });

        console.log('[Applications POST] Created new application:', application);

        // 업데이트된 지원 목록 조회
        const updatedApplications = await prisma.application.findMany({
            where: {
                departmentId: data.departmentId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        overall_gpa: true
                    }
                }
            }
        });

        const formattedApplications = updatedApplications
            .map(app => ({
                gpa: app.user.overall_gpa,
                isCurrentUser: app.user.id === user.id
            }))
            .sort((a, b) => b.gpa - a.gpa);

        return json({ 
            success: true, 
            application,
            applications: formattedApplications,
            message: existingApplication ? '기존 신청이 취소되고 새로운 학과에 신청되었습니다.' : '신청이 완료되었습니다.'
        });

    } catch (error) {
        console.error('[Applications POST] Error:', error);
        return json({ error: 'Failed to process application', details: error }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
    const departmentId = url.searchParams.get('id');
    const userEmail = url.searchParams.get('userEmail');

    if (!userEmail) {
        return json({ error: 'User email is required' }, { status: 400 });
    }

    if (!departmentId) {
        return json({ error: 'Department ID is required' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            return json({ error: 'User not found' }, { status: 401 });
        }

        // 해당 사용자의 지원 내역 찾기
        const application = await prisma.application.findFirst({
            where: {
                userId: user.id,
                departmentId: departmentId
            }
        });

        if (!application) {
            return json({ error: 'Application not found' }, { status: 404 });
        }

        // 지원 내역 삭제
        await prisma.application.delete({
            where: {
                id: application.id
            }
        });

        return json({ success: true });
    } catch (error) {
        console.error('Application deletion error:', error);
        return json({ error: 'Failed to delete application' }, { status: 500 });
    }
};