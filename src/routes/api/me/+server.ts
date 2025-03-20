import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';

export async function GET({ locals }) {
    if (!locals.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    return json(locals.user);
} 