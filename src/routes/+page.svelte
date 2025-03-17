<script lang="ts">
    import { goto } from '$app/navigation';
    import { user } from '$lib/auth';
    
    let email = '';
    let password = '';
    let errorMessage = '';

    async function handleLogin() {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                user.login(data.user);
                goto('/selection');  // 프로필 대신 selection 페이지로 이동
            } else {
                errorMessage = data.message;
            }
        } catch (error) {
            errorMessage = '서버 오류가 발생했습니다.';
        }
    }
</script>

<div class="container">
    <h1>대학 지원 현황 시스템</h1>
    
    <div class="main-content">
        <div class="login-section">
            <h2>로그인</h2>
            {#if errorMessage}
                <p class="error">{errorMessage}</p>
            {/if}
            <form on:submit|preventDefault={handleLogin}>
                <div class="form-group">
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
                <div class="form-group">
                    <input 
                        type="password" 
                        bind:value={password} 
                        placeholder="비밀번호"
                        required
                    />
                </div>
                <button type="submit" class="login-btn">로그인</button>
            </form>
            <div class="auth-links">
                <p class="register-link">
                    계정이 없으신가요? <a href="/register">회원가입</a>
                </p>
                <p class="forgot-password-link">
                    <a href="/forgot-password">비밀번호를 잊으셨나요?</a>
                </p>
            </div>
        </div>

        <div class="divider">또는</div>

        <div class="view-section">
            <p>대학 지원 현황을 확인하고 지원할 수 있습니다.</p>
            <button class="view-btn" on:click={() => goto('/selection')}>
                지원 현황 보기
            </button>
        </div>
    </div>
</div>

<style>
    .container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 1rem;
        text-align: center;
    }

    h1 {
        margin-bottom: 2rem;
    }

    h2 {
        margin-bottom: 1rem;
        font-size: 1.5rem;
    }

    .main-content {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        align-items: center;
    }

    .login-section {
        width: 100%;
        max-width: 400px;
        padding: 2rem;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    input {
        width: 100%;
        padding: 0.8rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    button {
        padding: 0.8rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        min-width: 200px;
    }

    .login-btn {
        background: #007bff;
        color: white;
        width: 100%;
    }

    .view-btn {
        background: #4CAF50;
        color: white;
    }

    button:hover {
        opacity: 0.9;
    }

    .divider {
        width: 100%;
        text-align: center;
        color: #666;
        position: relative;
    }

    .divider::before,
    .divider::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 45%;
        height: 1px;
        background: #ddd;
    }

    .divider::before {
        left: 0;
    }

    .divider::after {
        right: 0;
    }

    .error {
        color: #dc3545;
        margin-bottom: 1rem;
    }

    .view-section {
        text-align: center;
    }

    .register-link {
        margin-top: 1rem;
        font-size: 0.9rem;
    }

    .register-link a {
        color: #007bff;
        text-decoration: none;
    }

    .register-link a:hover {
        text-decoration: underline;
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

    .auth-links {
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .forgot-password-link {
        font-size: 0.9rem;
    }

    .forgot-password-link a {
        color: #6c757d;
        text-decoration: none;
    }

    .forgot-password-link a:hover {
        text-decoration: underline;
    }
</style>
