import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

export const GET: RequestHandler = async () => {
    const universities = await prisma.university.findMany({
        include: {
            colleges: {
                include: {
                    departments: true
                }
            }
        }
    });
    
    return json(universities);
};

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();
    // 데이터베이스 저장 로직
    
    return json({ success: true });
};