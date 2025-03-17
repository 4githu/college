import type { University, Application } from './types';

export const mockApplications: Application[] = [
    { departmentId: "111", studentGpa: 4.2 },
    { departmentId: "111", studentGpa: 4.0 },
    { departmentId: "111", studentGpa: 3.8 },
    { departmentId: "112", studentGpa: 4.5 },
    { departmentId: "112", studentGpa: 4.3 },
    // ... 더 많은 지원 데이터
];

export const mockUniversities: University[] = [
    {
        id: "1",
        name: "서울대학교",
        colleges: [
            {
                id: "11",
                name: "공과대학",
                departments: [
                    {
                        id: "111",
                        name: "컴퓨터공학과",
                        capacity: 100,
                        currentApplications: 80
                    },
                    {
                        id: "112",
                        name: "전기공학과",
                        capacity: 90,
                        currentApplications: 95
                    }
                ]
            },
            {
                id: "12",
                name: "자연과학대학",
                departments: [
                    {
                        id: "121",
                        name: "물리학과",
                        capacity: 50,
                        currentApplications: 30
                    }
                ]
            }
        ]
    },
    {
        id: "2",
        name: "연세대학교",
        colleges: [
            {
                id: "21",
                name: "문과대학",
                departments: [
                    {
                        id: "211",
                        name: "국어국문학과",
                        capacity: 60,
                        currentApplications: 45
                    }
                ]
            }
        ]
    }
]; 