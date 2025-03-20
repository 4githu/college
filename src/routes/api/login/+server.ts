import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST({ request, cookies }) {
    const { email: inputEmail, password } = await request.json();
    
    try {
        // 이메일 도메인 자동 추가
        const email = inputEmail.includes('@') ? inputEmail : `${inputEmail}@djshs.djsch.kr`;
        
        console.log('Login attempt:', { email }); // 디버깅용

        const user = await prisma.user.findUnique({
            where: { email }
        });

        console.log('Found user:', user); // 디버깅용

        if (!user) {
            return json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' }, { status: 400 });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', passwordMatch); // 디버깅용

        if (!passwordMatch) {
            return json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' }, { status: 400 });
        }

        // 세션 쿠키 설정
        cookies.set('session', user.id, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30일
        });

        console.log('Login successful, session set:', user.id);

        // 관리자인 경우 admin 페이지로, 아닌 경우 selection 페이지로
        const redirectTo = user.isAdmin ? '/admin' : '/selection';
        return json({ redirectTo });

    } catch (error) {
        console.error('Login error:', error);
        return json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
} 