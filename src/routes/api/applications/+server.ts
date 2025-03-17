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
        console.log('Received data:', data);

        const user = await prisma.user.findUnique({
            where: { email: data.userEmail },
            select: {
                id: true,
                email: true,
                overall_gpa: true
            }
        });

        if (!user) {
            console.log('User not found');
            return json({ error: 'User not found' }, { status: 401 });
        }

        // GPA 검증 로그 추가
        console.log('User GPA:', user.overall_gpa);
        if (user.overall_gpa === null || user.overall_gpa === undefined) {
            return json({ error: '학점을 먼저 입력해주세요.' }, { status: 400 });
        }


        // 기존 지원 내역이 있는지 확인
        const existingApplication = await prisma.application.findFirst({
            where: {
                userId: user.id
            }
        });

        let application;
        
        if (existingApplication) {
            application = await prisma.application.update({
                where: {
                    id: existingApplication.id
                },
                data: {
                    department: {
                        connect: { id: data.departmentId }
                    }
                }
            });
        } else {
            application = await prisma.application.create({
                data: {
                    user: {
                        connect: { id: user.id }
                    },
                    department: {
                        connect: { id: data.departmentId }
                    }
                }
            });
        }

        // 업데이트된 지원자 목록을 바로 반환
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
            applications: formattedApplications 
        });
    } catch (error) {
        console.error('Application creation/update error:', error);
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