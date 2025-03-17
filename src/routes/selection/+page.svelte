<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user } from '$lib/auth';
    import type { University } from '$lib/types';

    let universities: University[] = [];
    let errorMessage = '';

    onMount(async () => {
        if (!$user) {
            goto('/');
            return;
        }
        await loadUniversities();
    });

    async function loadUniversities() {
        try {
            const response = await fetch('/api/universities');
            if (response.ok) {
                universities = await response.json();
            } else {
                errorMessage = '대학교 정보를 불러오는데 실패했습니다.';
            }
        } catch (error) {
            errorMessage = '서버 오류가 발생했습니다.';
        }
    }

    function handleUniversityClick(universityId: string) {
        goto(`/university/${universityId}`);
    }
</script>

<div class="container">
    <nav class="navigation">
        <div class="nav-left">
            <span class="welcome-text">환영합니다!</span>
        </div>
        <div class="nav-right">
            <button class="nav-btn profile-btn" on:click={() => goto('/profile')}>
                {$user?.name || '프로필'}
            </button>
            <button class="nav-btn" on:click={() => {
                user.logout();
                goto('/');
            }}>
                로그아웃
            </button>
        </div>
    </nav>

    <h1>대학교 선택</h1>

    {#if errorMessage}
        <p class="error">{errorMessage}</p>
    {/if}

    <div class="university-grid">
        {#each universities as university}
            <div class="university-card" on:click={() => handleUniversityClick(university.id)}>
                <h2>{university.name}</h2>
                <div class="college-list">
                    <h3>단과대학</h3>
                    <ul>
                        {#each university.colleges as college}
                            <li>{college.name}</li>
                        {/each}
                    </ul>
                </div>
                <div class="department-count">
                    총 {university.colleges.reduce((acc, college) => acc + college.departments.length, 0)}개 학과
                </div>
            </div>
        {/each}
    </div>
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

    .nav-btn {
        padding: 0.5rem 1rem;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .nav-btn:hover {
        background: #5a6268;
    }

    .university-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
    }

    .university-card {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
    }

    .university-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .university-card h2 {
        margin: 0 0 1rem 0;
        color: #2c3e50;
        font-size: 1.5rem;
    }

    .college-list {
        margin: 1rem 0;
    }

    .college-list h3 {
        color: #666;
        font-size: 1rem;
        margin-bottom: 0.5rem;
    }

    .college-list ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .college-list li {
        color: #495057;
        padding: 0.25rem 0;
        font-size: 0.9rem;
    }

    .department-count {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #eee;
        color: #007bff;
        font-weight: bold;
    }

    .error {
        color: #dc3545;
        margin-bottom: 1rem;
    }

    .nav-right {
        display: flex;
        gap: 1rem;
    }

    .profile-btn {
        background: #007bff;
    }

    .profile-btn:hover {
        background: #0056b3;
    }

    .welcome-text {
        color: #6c757d;
        font-size: 1.1rem;
    }
</style> 