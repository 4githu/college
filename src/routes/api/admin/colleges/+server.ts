import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';

export async function POST({ request, locals }) {
    if (!locals.user?.isAdmin) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const data = await request.json();
        const college = await prisma.college.create({
            data: {
                name: data.name,
                universityId: data.universityId
            }
        });
        return json(college);
    } catch (error) {
        console.error('Error creating college:', error);
        return new Response('Internal server error', { status: 500 });
    }
} 