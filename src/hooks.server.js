import { redirect } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handle = async ({ event, resolve }) => {
    const session = event.cookies.get('session');

    if (!session) {
        event.locals.user = null;
    } else {
        const user = await prisma.user.findUnique({
            where: { id: session },
            select: { id: true, email: true, name: true }
        });
        event.locals.user = user;
    }

    // 로그인이 필요한 페이지에 대한 보호
    if (event.url.pathname.startsWith('/profile') && !event.locals.user) {
        throw redirect(303, '/login');
    }

    return await resolve(event);
}; 