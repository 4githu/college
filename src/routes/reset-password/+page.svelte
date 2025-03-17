<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    
    let newPassword = '';
    let confirmPassword = '';
    let errorMessage = '';
    let successMessage = '';

    // URL에서 토큰 가져오기
    const token = $page.url.searchParams.get('token');

    async function handlePasswordReset() {
        if (!token) {
            errorMessage = '유효하지 않은 링크입니다.';
            return;
        }

        if (newPassword !== confirmPassword) {
            errorMessage = '비밀번호가 일치하지 않습니다.';
            return;
        }

        try {
            const response = await fetch('/api/reset-password/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                successMessage = '비밀번호가 성공적으로 변경되었습니다.';
                errorMessage = '';
                // 3초 후 로그인 페이지로 이동
                setTimeout(() => {
                    goto('/');
                }, 3000);
            } else {
                errorMessage = data.message || '비밀번호 변경에 실패했습니다.';
                successMessage = '';
            }
        } catch (error) {
            errorMessage = '서버 오류가 발생했습니다.';
            successMessage = '';
        }
    }
</script>

<div class="container">
    <h1>비밀번호 재설정</h1>
    
    <div class="reset-section">
        {#if !token}
            <p class="error">유효하지 않은 링크입니다. 비밀번호 재설정을 다시 요청해주세요.</p>
            <a href="/forgot-password" class="back-link">비밀번호 찾기로 돌아가기</a>
        {:else}
            {#if successMessage}
                <p class="success">{successMessage}</p>
            {/if}
            {#if errorMessage}
                <p class="error">{errorMessage}</p>
            {/if}

            <form on:submit|preventDefault={handlePasswordReset}>
                <div class="form-group">
                    <label for="newPassword">새 비밀번호</label>
                    <input 
                        id="newPassword"
                        type="password" 
                        bind:value={newPassword}
                        placeholder="새 비밀번호"
                        required
                        minlength="8"
                    />
                </div>

                <div class="form-group">
                    <label for="confirmPassword">비밀번호 확인</label>
                    <input 
                        id="confirmPassword"
                        type="password" 
                        bind:value={confirmPassword}
                        placeholder="비밀번호 확인"
                        required
                        minlength="8"
                    />
                </div>

                <button type="submit" class="reset-btn">비밀번호 변경</button>
            </form>
        {/if}
    </div>
</div>

<style>
    .container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 1rem;
        text-align: center;
    }

    .reset-section {
        width: 100%;
        max-width: 400px;
        margin: 2rem auto;
        padding: 2rem;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .form-group {
        margin-bottom: 1.5rem;
        text-align: left;
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

    .reset-btn {
        width: 100%;
        padding: 0.8rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
    }

    .reset-btn:hover {
        opacity: 0.9;
    }

    .error {
        color: #dc3545;
        margin-bottom: 1rem;
    }

    .success {
        color: #28a745;
        margin-bottom: 1rem;
    }

    .back-link {
        color: #007bff;
        text-decoration: none;
    }

    .back-link:hover {
        text-decoration: underline;
    }
</style> 