import { redirect } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handle = async ({ event, resolve }) => {
    const session = event.cookies.get('session');

    if (!session) {
        console.log('No session found');
        event.locals.user = null;
    } else {
        try {
            const user = await prisma.user.findUnique({
                where: { id: session },
                select: { 
                    id: true, 
                    email: true, 
                    name: true,
                    isAdmin: true
                }
            });
            
            console.log('Session user found:', user?.email);
            
            if (user) {
                event.locals.user = user;
            } else {
                event.cookies.delete('session', { path: '/' });
                event.locals.user = null;
            }
        } catch (error) {
            console.error('Session error:', error);
            event.locals.user = null;
        }
    }

    // 로그인이 필요한 페이지들 (selection 제외)
    const protectedRoutes = ['/profile', '/admin'];
    
    // 로그인이 필요한 페이지에 접근하려고 할 때
    if (protectedRoutes.some(route => event.url.pathname.startsWith(route))) {
        if (!event.locals.user) {
            throw redirect(303, '/');
        }
    }

    // 이미 로그인한 사용자가 메인 페이지에 접근할 때
    if (event.url.pathname === '/' && event.locals.user) {
        if (event.locals.user.isAdmin) {
            throw redirect(303, '/admin');
        } else {
            throw redirect(303, '/selection');
        }
    }

    // 관리자가 아닌 사용자가 admin 페이지에 접근할 때
    if (event.url.pathname.startsWith('/admin') && !event.locals.user?.isAdmin) {
        throw redirect(303, '/selection');
    }

    const response = await resolve(event);
    return response;
}; 