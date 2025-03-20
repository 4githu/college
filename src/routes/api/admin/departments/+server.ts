import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';

export async function POST({ request, locals }) {
    if (!locals.user?.isAdmin) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const data = await request.json();
        const department = await prisma.department.create({
            data: {
                name: data.name,
                capacity: parseInt(data.capacity),
                currentApplications: 0,
                collegeId: data.collegeId
            }
        });
        return json(department);
    } catch (error) {
        console.error('Error creating department:', error);
        return new Response('Internal server error', { status: 500 });
    }
} 