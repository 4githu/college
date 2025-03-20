import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';

export async function DELETE({ params, locals }) {
    if (!locals.user?.isAdmin) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        await prisma.department.delete({
            where: { id: params.id }
        });
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting department:', error);
        return new Response('Internal server error', { status: 500 });
    }
} 