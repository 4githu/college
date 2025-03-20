import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';

export async function load({ locals }) {
    if (!locals.user?.isAdmin) {
        throw redirect(303, '/');
    }

    const universities = await prisma.university.findMany({
        include: {
            colleges: {
                include: {
                    departments: true
                }
            }
        }
    });

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            isVerified: true,
            createdAt: true,
            overall_gpa: true
        }
    });

    return {
        universities,
        users
    };
} 