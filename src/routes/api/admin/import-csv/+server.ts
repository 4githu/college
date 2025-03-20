// src/routes/api/admin/import-csv/+server.ts

import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';

export async function POST({ request, locals }) {
    // 관리자 권한 확인
    if (!locals.user?.isAdmin) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // 멀티파트 폼 데이터에서 CSV 파일 추출
        const formData = await request.formData();
        const csvFile = formData.get('csv');
        
        if (!csvFile || !(csvFile instanceof File)) {
            return json({ error: 'CSV 파일이 제공되지 않았습니다.' }, { status: 400 });
        }

        // CSV 파일 내용 읽기
        const csvText = await csvFile.text();
        
        // CSV 수동 파싱
        const parsedData = parseCSV(csvText);

        if (!parsedData || parsedData.length === 0) {
            return json({ error: 'CSV 파일에 데이터가 없습니다.' }, { status: 400 });
        }

        // 필수 컬럼 확인
        const requiredColumns = ['대학교', '단과대학', '학과', '정원'];
        const hasRequiredColumns = requiredColumns.every(column => 
            Object.keys(parsedData[0]).includes(column)
        );

        if (!hasRequiredColumns) {
            return json({ 
                error: 'CSV 파일에 필수 컬럼이 없습니다. 다음 컬럼이 필요합니다: 대학교, 단과대학, 학과, 정원'
            }, { status: 400 });
        }

        // CSV 데이터 처리
        const result = await processCSVData(parsedData);
        
        return json(result);
    } catch (error) {
        console.error('CSV 임포트 오류:', error);
        return json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

// CSV 파일을 직접 파싱하는 함수
function parseCSV(csvText) {
    // 줄바꿈으로 행 분리
    const lines = csvText.split(/\r\n|\n/);
    if (lines.length < 2) return [];
    
    // 첫 번째 행은 헤더
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(header => header.trim().replace(/^["']|["']$/g, ''));
    
    const data = [];
    
    // 두 번째 행부터 데이터 처리
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // 빈 행 건너뛰기
        
        // CSV 행 파싱 (기본적인 구현이므로 복잡한 CSV는 처리 못할 수 있음)
        // 쿼테이션으로 감싸진 콤마 처리를 위한 더 복잡한 로직이 필요할 수 있음
        const values = parseCSVRow(lines[i]);
        
        if (values.length !== headers.length) {
            console.warn(`행 ${i+1}의 값 수(${values.length})가 헤더 수(${headers.length})와 일치하지 않습니다`);
            continue;
        }
        
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j];
        }
        
        data.push(row);
    }
    
    return data;
}

// CSV 한 행을 파싱하는 함수 (쿼테이션 내부의 쉼표 처리)
function parseCSVRow(rowStr) {
    const result = [];
    let insideQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        
        if (char === '"' || char === "'") {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(currentValue.trim().replace(/^["']|["']$/g, ''));
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    
    // 마지막 값 추가
    result.push(currentValue.trim().replace(/^["']|["']$/g, ''));
    
    return result;
}

async function processCSVData(data) {
    // 추가된 항목 카운터
    const counter = {
        universities: 0,
        colleges: 0,
        departments: 0,
    };

    // 모든 대학, 단과대학 이름 목록을 가져와서 메모리에 캐싱
    const existingUniversities = await prisma.university.findMany({
        include: {
            colleges: true
        }
    });

    // 대학 이름 -> 대학 ID 매핑
    const universityMap = new Map();
    // 대학 ID + 단과대학 이름 -> 단과대학 ID 매핑
    const collegeMap = new Map();

    existingUniversities.forEach(uni => {
        universityMap.set(uni.name, uni.id);
        
        uni.colleges.forEach(college => {
            const key = `${uni.id}:${college.name}`;
            collegeMap.set(key, college.id);
        });
    });

    // 각 CSV 행을 처리
    for (const row of data) {
        const universityName = row['대학교'];
        const collegeName = row['단과대학'];
        const departmentName = row['학과'];
        const capacity = parseInt(row['정원'], 10);

        if (!universityName || !collegeName || !departmentName || isNaN(capacity)) {
            console.warn('잘못된 데이터 행 건너뜀:', row);
            continue;
        }

        // 1. 대학교 처리
        let universityId = universityMap.get(universityName);
        
        if (!universityId) {
            // 새 대학 생성
            const newUniversity = await prisma.university.create({
                data: {
                    name: universityName
                }
            });
            universityId = newUniversity.id;
            universityMap.set(universityName, universityId);
            counter.universities++;
        }

        // 2. 단과대학 처리
        const collegeKey = `${universityId}:${collegeName}`;
        let collegeId = collegeMap.get(collegeKey);
        
        if (!collegeId) {
            // 새 단과대학 생성
            const newCollege = await prisma.college.create({
                data: {
                    name: collegeName,
                    universityId: universityId
                }
            });
            collegeId = newCollege.id;
            collegeMap.set(collegeKey, collegeId);
            counter.colleges++;
        }

        // 3. 학과 처리
        // 해당 단과대학에 이미 있는 학과인지 확인
        const existingDepartment = await prisma.department.findFirst({
            where: {
                name: departmentName,
                collegeId: collegeId
            }
        });

        if (!existingDepartment) {
            // 새 학과 생성
            await prisma.department.create({
                data: {
                    name: departmentName,
                    capacity: capacity,
                    currentApplications: 0,
                    collegeId: collegeId
                }
            });
            counter.departments++;
        }
    }

    return {
        success: true,
        added: counter.departments,
        newUniversities: counter.universities,
        newColleges: counter.colleges,
        message: `${counter.universities}개 대학, ${counter.colleges}개 단과대학, ${counter.departments}개 학과가 추가되었습니다.`
    };
}