export interface Student {
    email: string;
    gpa: number;
    selections: UniversitySelection[];
}

export interface University {
    id: string;
    name: string;
    colleges: College[];
}

export interface College {
    id: string;
    name: string;
    departments: Department[];
}

export interface Department {
    id: string;
    name: string;
    capacity: number;
    currentApplications: number;
}

export interface UniversitySelection {
    universityId: string;
    collegeId: string;
    departmentId: string;
}

export interface Application {
    departmentId: string;
    studentGpa: number;
} 