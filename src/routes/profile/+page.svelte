<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user } from '$lib/auth';

    let name = '';
    let email = '';
    let overallGpa = '';
    let errorMessage = '';
    let successMessage = '';
    let isEditMode = false;
    let useOverallGpa = true;
    
    // 학기별 학점을 위한 변수 추가
    let semesterGpas = Array(5).fill('-1');

    onMount(async () => {
        if (!$user) {
            goto('/');
            return;
        }
        await loadProfileData();
    });

    async function loadProfileData() {
        try {
            if ($user) {
                name = $user.name;
                email = $user.email;
            }

            const response = await fetch('/api/profile', {
                headers: {
                    'X-User-Email': $user?.email || ''
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                name = data.name;
                email = data.email;
                
                // 전체 평균학점 처리
                if (data.overall_gpa !== null && data.overall_gpa > 0) {
                    overallGpa = data.overall_gpa.toString();
                    useOverallGpa = true;
                } else {
                    overallGpa = '';
                    useOverallGpa = false;
                }

                // 학기별 학점 로드
                semesterGpas = [
                    data.gpa_1_1 > -1 ? data.gpa_1_1.toString() : '-1',
                    data.gpa_1_2 > -1 ? data.gpa_1_2.toString() : '-1',
                    data.gpa_2_1 > -1 ? data.gpa_2_1.toString() : '-1',
                    data.gpa_2_2 > -1 ? data.gpa_2_2.toString() : '-1',
                    data.gpa_3_1 > -1 ? data.gpa_3_1.toString() : '-1'
                ];

                // 학기별 학점이 있으면 학기별 입력 모드로 전환
                if (semesterGpas.some(gpa => parseFloat(gpa) > -1)) {
                    useOverallGpa = false;
                }
            }
        } catch (error) {
            errorMessage = '프로필 정보를 불러오는데 실패했습니다.';
        }
    }

    // 평균 학점 계산 함수
    function calculateAverageGpa() {
        const validGpas = semesterGpas
            .map(gpa => parseFloat(gpa))
            .filter(gpa => gpa >= 0);  // -1은 제외
        
        if (validGpas.length === 0) return '0.00';
        
        const average = validGpas.reduce((sum, gpa) => sum + gpa, 0) / validGpas.length;
        return average.toFixed(2);
    }

    async function handleSubmit() {
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    useOverallGpa,
                    overall_gpa: overallGpa,
                    semester_gpas: semesterGpas
                })
            });

            if (response.ok) {
                successMessage = '프로필이 성공적으로 업데이트되었습니다.';
                errorMessage = '';
                isEditMode = false;
                await loadProfileData();
            } else {
                const data = await response.json();
                errorMessage = data.message || '프로필 업데이트에 실패했습니다.';
                successMessage = '';
            }
        } catch (error) {
            console.error('Profile update error:', error);
            errorMessage = '서버 오류가 발생했습니다.';
            successMessage = '';
        }
    }

    // 학기 이름 반환 함수
    function getSemesterName(index: number): string {
        const year = Math.floor(index / 2) + 1;
        const semester = (index % 2) + 1;
        return `${year}-${semester}`;
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
</script>

<div class="container">
    <nav class="navigation">
        <div class="nav-left">
            <button class="nav-btn" on:click={() => goto('/selection')}>
                뒤로가기
            </button>
        </div>
        <div class="nav-right">
            <button class="logout-btn" on:click={handleLogout}>
                로그아웃
            </button>
        </div>
    </nav>

    <h1>프로필</h1>

    {#if !$user}
        <p>로그인이 필요합니다.</p>
    {:else}
        {#if errorMessage}
            <p class="error">{errorMessage}</p>
        {/if}
        {#if successMessage}
            <p class="success">{successMessage}</p>
        {/if}

        <div class="profile-container">
            {#if !isEditMode}
                <!-- 보기 모드 -->
                <div class="profile-info">
                    <div class="info-group">
                        <label>이름</label>
                        <p>{name}</p>
                    </div>
                    <div class="info-group">
                        <label>이메일</label>
                        <p>{email}</p>
                    </div>
                    <div class="info-group">
                        <label>전체 평균학점</label>
                        <p>{overallGpa || '미입력'}</p>
                    </div>
                    <button class="edit-btn" on:click={() => isEditMode = true}>
                        수정하기
                    </button>
                </div>
            {:else}
                <!-- 수정 모드 -->
                <form on:submit|preventDefault={handleSubmit}>
                    <div class="form-group">
                        <label for="name">이름</label>
                        <input 
                            type="text" 
                            id="name"
                            bind:value={name} 
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="email">이메일</label>
                        <input 
                            type="email" 
                            id="email"
                            value={email} 
                            disabled
                        />
                    </div>

                    <div class="gpa-section">
                        <h2>학점 입력</h2>
                        <div class="gpa-toggle">
                            <label>
                                <input 
                                    type="radio" 
                                    bind:group={useOverallGpa} 
                                    value={true}
                                >
                                전체 평균학점 입력
                            </label>
                            <label>
                                <input 
                                    type="radio" 
                                    bind:group={useOverallGpa} 
                                    value={false}
                                >
                                학기별 학점 입력
                            </label>
                        </div>

                        {#if useOverallGpa}
                            <div class="form-group">
                                <label for="overallGpa">전체 평균학점</label>
                                <input 
                                    type="number" 
                                    id="overallGpa"
                                    bind:value={overallGpa}
                                    min="0"
                                    max="4.5"
                                    step="0.01"
                                    required
                                />
                            </div>
                        {:else}
                            <div class="semester-gpas">
                                {#each semesterGpas as gpa, i}
                                    <div class="form-group">
                                        <label for="semester{i}">
                                            {getSemesterName(i)}학기 학점
                                            <span class="hint">(미이수 시 -1 입력)</span>
                                        </label>
                                        <input 
                                            type="number" 
                                            id="semester{i}"
                                            bind:value={semesterGpas[i]}
                                            min="-1"
                                            max="4.5"
                                            step="0.01"
                                            placeholder="-1"
                                        />
                                    </div>
                                {/each}
                                <div class="calculated-gpa">
                                    계산된 평균학점: {calculateAverageGpa()}
                                </div>
                            </div>
                        {/if}
                    </div>

                    <div class="button-group">
                        <button type="submit" class="submit-btn">저장</button>
                        <button type="button" class="cancel-btn" on:click={() => isEditMode = false}>
                            취소
                        </button>
                    </div>
                </form>
            {/if}
        </div>
    {/if}
</div>

<style>
    .container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 1rem;
    }

    .navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .nav-btn {
        padding: 0.5rem 1rem;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
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

    .profile-container {
        background: #f8f9fa;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .profile-info {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .info-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .info-group label {
        font-weight: bold;
        color: #495057;
    }

    .info-group p {
        margin: 0;
        padding: 0.5rem;
        background: white;
        border-radius: 4px;
    }

    .semester-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.5rem;
    }

    .edit-btn {
        margin-top: 1rem;
        padding: 0.8rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .button-group {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }

    .submit-btn, .cancel-btn {
        padding: 0.8rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        flex: 1;
    }

    .submit-btn {
        background: #007bff;
        color: white;
    }

    .cancel-btn {
        background: #6c757d;
        color: white;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }

    input {
        width: 100%;
        padding: 0.8rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    input[type="radio"] {
        width: auto;
        margin-right: 0.5rem;
    }

    .gpa-section {
        margin: 2rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .gpa-toggle {
        margin: 1rem 0;
        display: flex;
        gap: 2rem;
    }

    .hint {
        font-size: 0.8rem;
        color: #666;
        font-weight: normal;
    }

    .calculated-gpa {
        margin-top: 1rem;
        padding: 1rem;
        background: #e9ecef;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
        color: #007bff;
    }

    .error {
        color: #dc3545;
        margin-bottom: 1rem;
    }

    .success {
        color: #28a745;
        margin-bottom: 1rem;
    }

    input:disabled {
        background: #e9ecef;
        cursor: not-allowed;
    }

    .semester-gpas {
        display: grid;
        gap: 1rem;
        margin-top: 1rem;
    }
</style> 