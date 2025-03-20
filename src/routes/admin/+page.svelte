<script lang="ts">
    import { goto } from '$app/navigation';
    export let data;
    
    let activeTab = 'universities';
    let isAddingUniversity = false;
    let isAddingCollege = false;
    let isAddingDepartment = false;
    let selectedUniversity: any = null;
    let selectedCollege: any = null;

    // 새 대학 추가를 위한 데이터
    let newUniversity = {
        name: ''
    };

    // 새 단과대학 추가를 위한 데이터
    let newCollege = {
        name: '',
        universityId: ''
    };

    // 새 학과 추가를 위한 데이터
    let newDepartment = {
        name: '',
        capacity: 0,
        collegeId: ''
    };

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

    async function addUniversity() {
        try {
            const response = await fetch('/api/admin/universities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUniversity)
            });

            if (response.ok) {
                isAddingUniversity = false;
                newUniversity.name = '';
                window.location.reload();
            }
        } catch (error) {
            console.error('Error adding university:', error);
        }
    }

    async function addCollege() {
        try {
            const response = await fetch('/api/admin/colleges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCollege)
            });

            if (response.ok) {
                isAddingCollege = false;
                newCollege.name = '';
                window.location.reload();
            }
        } catch (error) {
            console.error('Error adding college:', error);
        }
    }

    async function addDepartment() {
        try {
            const response = await fetch('/api/admin/departments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newDepartment)
            });

            if (response.ok) {
                isAddingDepartment = false;
                newDepartment = {
                    name: '',
                    capacity: 0,
                    collegeId: ''
                };
                window.location.reload();
            }
        } catch (error) {
            console.error('Error adding department:', error);
        }
    }

    async function deleteUniversity(id: string) {
        if (!confirm('정말로 이 대학을 삭제하시겠습니까?')) return;
        
        try {
            const response = await fetch(`/api/admin/universities/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error deleting university:', error);
        }
    }

    async function deleteCollege(id: string) {
        if (!confirm('정말로 이 단과대학을 삭제하시겠습니까?')) return;
        
        try {
            const response = await fetch(`/api/admin/colleges/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error deleting college:', error);
        }
    }

    async function deleteDepartment(id: string) {
        if (!confirm('정말로 이 학과를 삭제하시겠습니까?')) return;
        
        try {
            const response = await fetch(`/api/admin/departments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error deleting department:', error);
        }
    }

    let csvFile: File | null = null;
let isUploading = false;
let uploadResult = { success: false, message: '', data: null };

function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        csvFile = target.files[0];
    }
}

async function uploadCSV() {
    if (!csvFile) return;
    
    isUploading = true;
    uploadResult = { success: false, message: '', data: null };
    
    try {
        const formData = new FormData();
        formData.append('csv', csvFile);
        
        const response = await fetch('/api/admin/import-csv', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            uploadResult = {
                success: true,
                message: `성공적으로 업로드 되었습니다. ${result.added} 개의 항목이 추가되었습니다.`,
                data: result
            };
            // 페이지 새로고침
            setTimeout(() => window.location.reload(), 2000);
        } else {
            uploadResult = {
                success: false,
                message: result.message || '업로드 중 오류가 발생했습니다.',
                data: null
            };
        }
    } catch (error) {
        console.error('CSV 업로드 오류:', error);
        uploadResult = {
            success: false,
            message: '업로드 중 오류가 발생했습니다.',
            data: null
        };
    } finally {
            isUploading = false;
        }
    }
</script>

<div class="admin-dashboard">
    <nav class="navigation">
        <div class="nav-right">
            <button class="logout-btn" on:click={handleLogout}>
                로그아웃
            </button>
        </div>
    </nav>

    <h1>관리자 페이지</h1>
    
    <nav class="tabs">
        <button 
            class:active={activeTab === 'universities'} 
            on:click={() => activeTab = 'universities'}
        >
            대학/학과 관리
        </button>
        <button 
            class:active={activeTab === 'users'} 
            on:click={() => activeTab = 'users'}
        >
            사용자 관리
        </button>
    </nav>

    {#if activeTab === 'universities'}
        <div class="universities-section">
            <div class="csv-import-section">
                <div class="section-header">
                    <h2>CSV 일괄 등록</h2>
                </div>
                
                <div class="csv-upload-container">
                    <div class="upload-instructions">
                        <p>대학, 단과대학, 학과 정보를 CSV 파일로 일괄 등록할 수 있습니다.</p>
                        <p>CSV 파일 형식: UTF-8 인코딩, 쉼표(,) 구분</p>
                        <p>헤더(첫 줄): "대학", "단과대학", "학과", "정원"</p>
                    </div>
                    
                    <div class="file-upload">
                        <input type="file" accept=".csv" on:change={handleFileChange} id="csv-upload" />
                        <button class="upload-btn" on:click={uploadCSV} disabled={!csvFile || isUploading}>
                            {isUploading ? '업로드 중...' : 'CSV 파일 업로드'}
                        </button>
                    </div>
                    
                    {#if uploadResult.message}
                        <div class="upload-result" class:success={uploadResult.success} class:error={!uploadResult.success}>
                            {uploadResult.message}
                        </div>
                    {/if}
                </div>
            </div>
            <div class="section-header">
                <h2>대학교 관리</h2>
                <button class="add-btn" on:click={() => isAddingUniversity = true}>
                    새 대학 추가
                </button>
            </div>

            {#if isAddingUniversity}
                <div class="add-form">
                    <input 
                        type="text" 
                        bind:value={newUniversity.name} 
                        placeholder="대학교 이름"
                    />
                    <button on:click={addUniversity}>추가</button>
                    <button on:click={() => isAddingUniversity = false}>취소</button>
                </div>
            {/if}

            {#each data.universities as university}
                <div class="university-card">
                    <div class="card-header">
                        <h3>{university.name}</h3>
                        <button class="delete-btn" on:click={() => deleteUniversity(university.id)}>삭제</button>
                    </div>

                    <div class="college-section">
                        <div class="section-header">
                            <h4>단과대학</h4>
                            <button 
                                class="add-btn small" 
                                on:click={() => {
                                    newCollege.universityId = university.id;
                                    isAddingCollege = true;
                                }}
                            >
                                단과대학 추가
                            </button>
                        </div>

                        {#if isAddingCollege && newCollege.universityId === university.id}
                            <div class="add-form">
                                <input 
                                    type="text" 
                                    bind:value={newCollege.name} 
                                    placeholder="단과대학 이름"
                                />
                                <button on:click={addCollege}>추가</button>
                                <button on:click={() => isAddingCollege = false}>취소</button>
                            </div>
                        {/if}

                        {#each university.colleges as college}
                            <div class="college-card">
                                <div class="card-header">
                                    <h5>{college.name}</h5>
                                    <button class="delete-btn small" on:click={() => deleteCollege(college.id)}>삭제</button>
                                </div>

                                <div class="department-section">
                                    <div class="section-header">
                                        <h6>학과</h6>
                                        <button 
                                            class="add-btn small" 
                                            on:click={() => {
                                                newDepartment.collegeId = college.id;
                                                isAddingDepartment = true;
                                            }}
                                        >
                                            학과 추가
                                        </button>
                                    </div>

                                    {#if isAddingDepartment && newDepartment.collegeId === college.id}
                                        <div class="add-form">
                                            <input 
                                                type="text" 
                                                bind:value={newDepartment.name} 
                                                placeholder="학과 이름"
                                            />
                                            <input 
                                                type="number" 
                                                bind:value={newDepartment.capacity} 
                                                placeholder="정원"
                                            />
                                            <button on:click={addDepartment}>추가</button>
                                            <button on:click={() => isAddingDepartment = false}>취소</button>
                                        </div>
                                    {/if}

                                    <table>
                                        <thead>
                                            <tr>
                                                <th>학과명</th>
                                                <th>정원</th>
                                                <th>현재 지원자</th>
                                                <th>작업</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each college.departments as dept}
                                                <tr>
                                                    <td>{dept.name}</td>
                                                    <td>{dept.capacity}</td>
                                                    <td>{dept.currentApplications}</td>
                                                    <td>
                                                        <button 
                                                            class="delete-btn small" 
                                                            on:click={() => deleteDepartment(dept.id)}
                                                        >
                                                            삭제
                                                        </button>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {:else if activeTab === 'users'}
        <div class="users-section">
            <table>
                <thead>
                    <tr>
                        <th>이메일</th>
                        <th>이름</th>
                        <th>가입일</th>
                        <th>인증상태</th>
                        <th>평균학점</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.users as user}
                        <tr>
                            <td>{user.email}</td>
                            <td>{user.name}</td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>{user.isVerified ? '인증됨' : '미인증'}</td>
                            <td>{user.overall_gpa || '-'}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    .admin-dashboard {
        padding: 2rem;
    }

    .navigation {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 2rem;
    }

    .nav-right {
        display: flex;
        gap: 1rem;
    }

    .logout-btn {
        padding: 0.5rem 1rem;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .logout-btn:hover {
        background: #c82333;
    }

    .tabs {
        margin-bottom: 2rem;
    }

    .tabs button {
        padding: 0.5rem 1rem;
        margin-right: 1rem;
        border: none;
        background: #f0f0f0;
        cursor: pointer;
    }

    .tabs button.active {
        background: #007bff;
        color: white;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .add-btn {
        padding: 0.5rem 1rem;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .add-btn.small {
        padding: 0.25rem 0.5rem;
        font-size: 0.9rem;
    }

    .delete-btn {
        padding: 0.5rem 1rem;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .delete-btn.small {
        padding: 0.25rem 0.5rem;
        font-size: 0.9rem;
    }

    .university-card {
        background: white;
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .college-card {
        background: #f8f9fa;
        padding: 1rem;
        margin: 0.5rem 0;
        border-radius: 4px;
    }

    .add-form {
        display: flex;
        gap: 1rem;
        margin: 1rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
    }

    .add-form input {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }

    th, td {
        padding: 0.5rem;
        border: 1px solid #ddd;
        text-align: left;
    }

    th {
        background: #f8f9fa;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    h3, h4, h5, h6 {
        margin: 0;
    }
</style> 