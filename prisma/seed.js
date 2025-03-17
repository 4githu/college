import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('Starting database seed...');

        // 기존 데이터 삭제
        console.log('Deleting existing data...');
        await prisma.application.deleteMany();
        await prisma.department.deleteMany();
        await prisma.college.deleteMany();
        await prisma.university.deleteMany();
        console.log('Existing data deleted successfully');

        // 대곽대학교 생성
        console.log('Creating Daegwak University...');
        const daegwak = await prisma.university.create({
            data: {
                name: '대곽대학교',
                colleges: {
                    create: [
                        {
                            name: '자연전공',
                            departments: {
                                create: [
                                    {
                                        name: '물리학과',
                                        capacity: 6,
                                        currentApplications: 0
                                    },
                                    {
                                        name: '화학과',
                                        capacity: 8,
                                        currentApplications: 0
                                    },
                                    {
                                        name: '생물학과',
                                        capacity: 10,
                                        currentApplications: 0
                                    }
                                ]
                            }
                        },
                        {
                            name: '공학전공',
                            departments: {
                                create: [
                                    {
                                        name: '정보학과',
                                        capacity: 4,
                                        currentApplications: 0
                                    }
                                ]
                            }
                        },
                        {
                            name: '인문전공',
                            departments: {
                                create: [
                                    {
                                        name: '지구과학과',
                                        capacity: 2,
                                        currentApplications: 0
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });
        console.log('Daegwak University created successfully');

        // 짭곽대학교 생성
        console.log('Creating Jjapgwak University...');
        const jjapgwak = await prisma.university.create({
            data: {
                name: '짭곽대학교',
                colleges: {
                    create: [
                        {
                            name: '농업생명공학대',
                            departments: {
                                create: [
                                    {
                                        name: '농사짓는 과',
                                        capacity: 2,
                                        currentApplications: 0
                                    },
                                    {
                                        name: '개 키우는 과',
                                        capacity: 3,
                                        currentApplications: 0
                                    }
                                ]
                            }
                        },
                        {
                            name: '글로벌한 학과',
                            departments: {
                                create: [
                                    {
                                        name: '예시쌤과',
                                        capacity: 2,
                                        currentApplications: 0
                                    },
                                    {
                                        name: '사일러스쌤과',
                                        capacity: 4,
                                        currentApplications: 0
                                    },
                                    {
                                        name: '듀오링고과',
                                        capacity: 5,
                                        currentApplications: 0
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });
        console.log('Jjapgwak University created successfully');

        console.log('Seed completed successfully');
    } catch (error) {
        console.error('Seed error:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 