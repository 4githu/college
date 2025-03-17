<script lang="ts">
    let email = '';
    let successMessage = '';
    let errorMessage = '';

    async function handlePasswordReset() {
        try {
            const fullEmail = `${email}@djshs.djsch.kr`;
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: fullEmail })
            });

            const data = await response.json();

            if (response.ok) {
                successMessage = '비밀번호 재설정 링크가 이메일로 전송되었습니다.';
                errorMessage = '';
                email = '';
            } else {
                errorMessage = data.message || '비밀번호 재설정 요청에 실패했습니다.';
                successMessage = '';
            }
        } catch (error) {
            errorMessage = '서버 오류가 발생했습니다.';
            successMessage = '';
        }
    }
</script>

<div class="container">
    <h1>비밀번호 찾기</h1>
    
    <div class="reset-section">
        {#if successMessage}
            <p class="success">{successMessage}</p>
        {/if}
        {#if errorMessage}
            <p class="error">{errorMessage}</p>
        {/if}

        <form on:submit|preventDefault={handlePasswordReset}>
            <div class="form-group">
                <label>가입한 이메일 주소를 입력해주세요</label>
                <div class="email-input">
                    <input 
                        type="text" 
                        bind:value={email}
                        placeholder="이메일"
                        required
                    />
                    <span class="email-domain">@djshs.djsch.kr</span>
                </div>
            </div>
            <button type="submit" class="reset-btn">비밀번호 재설정 링크 받기</button>
        </form>

        <p class="login-link">
            <a href="/">로그인으로 돌아가기</a>
        </p>
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
    }

    .email-input {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .email-domain {
        color: #666;
        white-space: nowrap;
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

    .login-link {
        margin-top: 1rem;
        font-size: 0.9rem;
    }

    .login-link a {
        color: #007bff;
        text-decoration: none;
    }

    .login-link a:hover {
        text-decoration: underline;
    }
</style> 