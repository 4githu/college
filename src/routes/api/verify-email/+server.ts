import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export const GET: RequestHandler = async ({ url }) => {
    try {
        const token = url.searchParams.get('token');

        if (!token) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '유효하지 않은 토큰입니다.'
                }),
                { status: 400 }
            );
        }

        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiry: {
                    gt: new Date()
                },
                isVerified: false
            }
        });

        if (!user) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '유효하지 않거나 만료된 토큰입니다.'
                }),
                { status: 400 }
            );
        }

        // 사용자 인증 상태 업데이트
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null
            }
        });

        return json({
            success: true,
            message: '이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: '서버 오류가 발생했습니다.'
            }),
            { status: 500 }
        );
    }
};

export async function POST({ request }) {
    const { email, code } = await request.json();

    try {
        // 인증 코드 확인
        const verification = await prismaClient.verificationCode.findFirst({
            where: {
                email,
                code,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if (!verification) {
            return json({ message: '유효하지 않거나 만료된 인증 코드입니다.' }, { status: 400 });
        }

        // 이미 등록된 사용자인지 다시 한번 확인
        const existingUser = await prismaClient.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return json({ message: '이미 등록된 학번입니다.' }, { status: 400 });
        }

        // 실제 사용자 생성 (register API에서 해시된 비밀번호 사용)
        const user = await prismaClient.user.create({
            data: {
                email: verification.email,
                name: verification.name,
                password: verification.password,  // 이미 해시된 비밀번호
                isVerified: true
            }
        });

        // 사용된 인증 코드 삭제
        await prismaClient.verificationCode.delete({
            where: { id: verification.id }
        });

        return json({ message: '회원가입이 완료되었습니다.' });
    } catch (error) {
        console.error('Verification error:', error);
        return json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
} 