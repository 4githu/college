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
                goto('/selection');
            } else {
                errorMessage = data.message;
            }
        } catch (error) {
            errorMessage = '서버 오류가 발생했습니다.';
        }
    }
</script>

<div class="container">
    <div class="main-content">
        <div class="login-section">
            <h2>로그인</h2>
            {#if errorMessage}
                <div class="error">{errorMessage}</div>
            {/if}
            <form on:submit|preventDefault={handleLogin}>
                <div class="form-group">
                    <div class="email-input">
                        <input
                            type="text"
                            bind:value={email}
                            placeholder="학번"
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
                <div class="register-link">
                    <a href="/register">회원가입</a>
                </div>
                <div class="forgot-password-link">
                    <a href="/forgot-password">비밀번호를 잊으셨나요?</a>
                </div>
            </div>
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

    button:hover {
        opacity: 0.9;
    }

    .error {
        color: #dc3545;
        margin-bottom: 1rem;
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

    .register-link a,
    .forgot-password-link a {
        color: #007bff;
        text-decoration: none;
    }

    .register-link a:hover,
    .forgot-password-link a:hover {
        text-decoration: underline;
    }
</style>