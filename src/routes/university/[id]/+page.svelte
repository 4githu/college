<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user, loadUser } from '$lib/auth';
    import type { University, College, Department } from '$lib/types';

    let university: University | null = null;
    let selectedCollege: College | null = null;
    let errorMessage = '';
    let applications: { gpa: number }[] = [];
    let universities: University[] = [];
    let userApplications: { departmentId: string }[] = [];
    let previousApplicationsCount: { [key: string]: number } = {};

    onMount(async () => {
        await loadUser();  // 사용자 정보 로드
        if (!$user) {
            goto('/');
            return;
        }
        await Promise.all([
            loadUniversityData(),
            loadUserApplications()
        ]);

        // 페이지 로드 시 URL에서 선택된 단과대학 정보 복원
        if (university) {
            const savedCollegeId = getSelectedCollegeFromUrl();
            if (savedCollegeId) {
                const college = university.colleges.find(c => c.id === savedCollegeId);
                if (college) {
                    selectedCollege = college;
                }
            } else if (university.colleges.length > 0) {
                selectedCollege = university.colleges[0];
                updateUrlWithCollege(university.colleges[0].id);
            }
        }

        if (selectedCollege) {
            selectedCollege.departments.forEach(dept => {
                startApplicationsMonitoring(dept.id);
            });
        }
    });

    async function loadUserApplications() {
        try {
            const response = await fetch(`/api/applications/user?email=${$user?.email}`);
            if (response.ok) {
                userApplications = await response.json();
            }
        } catch (error) {
            console.error('Failed to load user applications:', error);
        }
    }

    async function loadUniversityData() {
        try {
            const response = await fetch(`/api/universities/${$page.params.id}`);
            if (response.ok) {
                const data = await response.json();
                university = data;
                if (!selectedCollege && university?.colleges.length > 0) {
                    selectedCollege = university.colleges[0];
                }
            } else {
                errorMessage = '대학교 정보를 불러오는데 실패했습니다.';
            }
        } catch (error) {
            errorMessage = '서버 오류가 발생했습니다.';
        }
    }

    function getStatusColor(applicationCount, capacity) {
        const currentNum = Number(applicationCount);
        const capacityNum = Number(capacity);
        const ratio = currentNum / capacityNum;
        
        console.log(`Applications: ${currentNum}, Capacity: ${capacityNum}, Ratio: ${ratio}`);

        if (ratio >= 1) {
            return '#FF0000';  // 100% 이상: 빨간색
        } else if (ratio >= 0.8) {
            return '#FF4500';  // 80% 이상: 주황빨간색
        } else if (ratio >= 0.6) {
            return '#FFA500';  // 60% 이상: 주황색
        } else if (ratio >= 0.4) {
            return '#FFD700';  // 40% 이상: 황금색
        } else if (ratio >= 0.2) {
            return '#90EE90';  // 20% 이상: 연한 초록색
        } else {
            return '#32CD32';  // 20% 미만: 진한 초록색
        }
    }

    function getStatusText(currentApplications: number, capacity: number) {
        const ratio = currentApplications / capacity;
        if (ratio >= 1) return '마감';
        if (ratio >= 0.8) return '마감 임박';
        if (ratio >= 0.5) return '여유';
        return '충분';
    }

    async function loadDepartmentApplications(departmentId: string) {
        try {
            const response = await fetch(`/api/applications?departmentId=${departmentId}`);
            if (!response.ok) {
                throw new Error('Failed to load applications');
            }
            const applications = await response.json();
            return applications;  // 이미 서버에서 정렬된 데이터가 옴
        } catch (error) {
            console.error('Failed to load applications:', error);
            throw error;  // 에러를 다시 던져서 UI에서 처리
        }
    }

    // 신청자 목록 변경 감지 함수
    function startApplicationsMonitoring(departmentId: string) {
        setInterval(async () => {
            try {
                const response = await fetch(`/api/applications?departmentId=${departmentId}`);
                if (response.ok) {
                    const newApplications = await response.json();
                    if (previousApplicationsCount[departmentId] !== undefined && 
                        newApplications.length !== previousApplicationsCount[departmentId]) {
                        if (confirm('신청자 목록이 변경되었습니다. 새로고침하시겠습니까?')) {
                            window.location.reload();
                        }
                    }
                    previousApplicationsCount[departmentId] = newApplications.length;
                }
            } catch (error) {
                console.error('Failed to check for updates:', error);
            }
        }, 10000);
    }

    // URL에서 선택된 단과대학 정보 가져오기
    function getSelectedCollegeFromUrl(): string | null {
        const url = new URL(window.location.href);
        return url.searchParams.get('college');
    }

    // URL에 선택된 단과대학 정보 저장
    function updateUrlWithCollege(collegeId: string) {
        const url = new URL(window.location.href);
        url.searchParams.set('college', collegeId);
        window.history.replaceState({}, '', url.toString());
    }

    // 단과대학 선택 처리
    function handleCollegeSelect(college: College) {
        selectedCollege = college;
        updateUrlWithCollege(college.id);
    }

    async function handleApply(departmentId: string) {
        if (!$user) {
            alert('로그인이 필요합니다.');
            goto('/');
            return;
        }

        try {
            const isApplied = userApplications.some(app => app.departmentId === departmentId);
            let response;
            
            console.log('Attempting to apply/cancel:', {
                departmentId,
                userEmail: $user.email,
                isApplied
            });

            if (isApplied) {
                // DELETE 요청
                response = await fetch(`/api/applications?id=${departmentId}&userEmail=${$user.email}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
            } else {
                // POST 요청
                console.log('Sending POST request to /api/applications');
                response = await fetch('/api/applications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        departmentId,
                        userEmail: $user.email
                    }),
                    credentials: 'include'
                });
            }

            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);

            if (!response.ok) {
                throw new Error(responseData.error || '처리에 실패했습니다.');
            }

            // 성공 시 페이지 새로고침
            window.location.reload();
            
        } catch (error) {
            console.error('Application error:', error);
            alert(error.message || '서버 오류가 발생했습니다.');
        }
    }

    async function handleLogout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST'
            });

            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // departments 데이터가 로드될 때 확인
    $: if (selectedCollege) {
        console.log('Selected College Departments:', selectedCollege.departments);
    }
</script>

<div class="container">
    <nav class="navigation">
        <div class="nav-left">
            <button class="nav-btn" on:click={() => goto('/selection')}>
                뒤로가기
            </button>
        </div>
        <div class="nav-right">
            <button class="nav-btn profile-btn" on:click={() => goto('/profile')}>
                {$user?.name || '프로필'}
            </button>
            <button class="nav-btn" on:click={handleLogout}>
                로그아웃
            </button>
        </div>
    </nav>

    {#if errorMessage}
        <p class="error">{errorMessage}</p>
    {/if}

    {#if university}
        <h1>{university.name}</h1>
        
        <div class="college-nav">
            {#each university.colleges as college}
                <button 
                    class="college-btn" 
                    class:active={selectedCollege?.id === college.id}
                    on:click={() => handleCollegeSelect(college)}
                >
                    {college.name}
                </button>
            {/each}
        </div>

        {#if selectedCollege}
            <div class="departments-grid">
                {#each selectedCollege.departments as department}
                    <div class="department-card">
                        <h3 style="border: 4px solid {getStatusColor(department._count.applications, department.capacity)}">
                            {department.name}({department._count.applications}/{department.capacity})
                        </h3>
                        <button 
                            class="apply-btn {userApplications.some(app => app.departmentId === department.id) ? 'cancel-btn' : ''}"
                            on:click={() => handleApply(department.id)}
                        >
                            {userApplications.some(app => app.departmentId === department.id) ? '신청 취소' : '신청'}
                        </button>

                        <!-- 지원자 목록 표시 -->
                        <div class="applicant-list">
                            <h4>지원자 목록</h4>
                            {#if department.applications && department.applications.length > 0}
                                <ul>
                                    {#each department.applications as application}
                                        <li>{application.user.overall_gpa}</li>
                                    {/each}
                                </ul>
                            {:else}
                                <p>아직 지원자가 없습니다.</p>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 1rem;
    }

    .navigation {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2rem;
    }

    .nav-right {
        display: flex;
        gap: 1rem;
    }

    .nav-btn {
        padding: 0.5rem 1rem;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .college-nav {
        display: flex;
        gap: 1rem;
        margin: 2rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        overflow-x: auto;
    }

    .college-btn {
        padding: 0.8rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background: #e9ecef;
        color: #495057;
        white-space: nowrap;
    }

    .college-btn.active {
        background: #007bff;
        color: white;
    }

    .departments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
    }

    .department-card {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        position: relative;
    }

    .department-card h3 {
        margin: 0 0 1rem 0;
        color: #2c3e50;
        padding: 0.8rem;
        border-radius: 6px;
        text-align: center;
    }

    .apply-btn {
        width: 100%;
        padding: 0.8rem;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 1rem;
    }

    .apply-btn:hover {
        background: #218838;
    }

    .apply-btn:disabled {
        background: #6c757d;
    }

    .applications-list {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #eee;
    }

    .applications-list h4 {
        color: #666;
        margin-bottom: 0.5rem;
    }

    .applications-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .applications-list li {
        padding: 0.5rem;
        margin: 0.25rem 0;
        background: #f8f9fa;
        border-radius: 4px;
        text-align: center;
    }

    .error {
        color: #dc3545;
        margin-bottom: 1rem;
    }

    .profile-btn {
        background: #007bff;
    }

    .profile-btn:hover {
        background: #0056b3;
    }

    .status-bar,
    .status-text {
        display: none;
    }

    .cancel-btn {
        background-color: #dc3545 !important;
    }

    .cancel-btn:hover {
        background-color: #c82333 !important;
    }

    .loading {
        opacity: 0.5;
        pointer-events: none;
    }

    .current-user {
        background: #e3f2fd !important;
        color: #1976d2 !important;
        font-weight: bold;
    }

    .applicant-list {
        margin-top: 1rem;
        padding: 0.5rem;
        background-color: #f5f5f5;
        border-radius: 4px;
    }

    .applicant-list h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: #666;
    }

    .applicant-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .applicant-list li {
        padding: 0.2rem 0;
        font-size: 0.9rem;
    }
</style> 