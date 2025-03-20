import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
    try {
        const admin = await prisma.user.findUnique({
            where: { email: '4git@djshs.djsch.kr' }  // 도메인 수정
        });
        
        console.log('관리자 계정 정보:', admin);
        
    } catch (error) {
        console.error('조회 중 오류 발생:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin(); 