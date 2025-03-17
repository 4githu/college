import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

export const GET: RequestHandler = async () => {
    const universities = await prisma.university.findMany();
    return json(universities);
}; 