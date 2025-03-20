import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
    const adminEmail = '4git@djshs.djsch.kr';  // 도메인 수정
    const adminPassword = 'acanadmin';
    
    try {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        // 기존 계정이 있다면 삭제
        await prisma.user.deleteMany({
            where: { email: adminEmail }
        });
        
        // 새로운 관리자 계정 생성
        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                name: '관리자',
                password: hashedPassword,
                isAdmin: true,
                isVerified: true
            }
        });

        console.log('관리자 계정이 생성되었습니다:', admin.email);
    } catch (error) {
        console.error('관리자 계정 생성 중 오류:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();