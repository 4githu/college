import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';

export async function POST({ request, locals }) {
    if (!locals.user?.isAdmin) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const data = await request.json();
        const university = await prisma.university.create({
            data: {
                name: data.name
            }
        });
        return json(university);
    } catch (error) {
        console.error('Error creating university:', error);
        return new Response('Internal server error', { status: 500 });
    }
}

export async function DELETE({ params, locals }) {
    if (!locals.user?.isAdmin) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        await prisma.university.delete({
            where: { id: params.id }
        });
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting university:', error);
        return new Response('Internal server error', { status: 500 });
    }
} 