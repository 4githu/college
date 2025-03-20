<script lang="ts">
    import { goto } from '$app/navigation';
    
    let email = '';
    let name = '';
    let password = '';
    let verificationCode = '';
    let errorMessage = '';
    let step = 1; // 1: 초기 정보, 2: 인증 코드 확인

    async function handleInitialSubmit() {
        try {
            // 이메일 도메인 자동 추가
            const fullEmail = email.includes('@') ? email : `${email}@djshs.djsch.kr`;
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: fullEmail,
                    name,
                    password 
                })
            });

            const data = await response.json();

            if (response.ok) {
                step = 2;
                errorMessage = '';
            } else {
                errorMessage = data.message;
            }
        } catch (error) {
            errorMessage = '서버 오류가 발생했습니다.';
        }
    }

    async function handleVerification() {
        try {
            const fullEmail = email.includes('@') ? email : `${email}@djshs.djsch.kr`;
            
            const response = await fetch('/api/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: fullEmail,
                    code: verificationCode
                })
            });

            const data = await response.json();

            if (response.ok) {
                goto('/');
            } else {
                errorMessage = data.message;
            }
        } catch (error) {
            errorMessage = '서버 오류가 발생했습니다.';
        }
    }
</script>

<div class="container">
    <div class="register-section">
        <h2>회원가입</h2>
        {#if errorMessage}
            <div class="error">{errorMessage}</div>
        {/if}

        {#if step === 1}
            <form on:submit|preventDefault={handleInitialSubmit}>
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
                        type="text"
                        bind:value={name}
                        placeholder="이름"
                        required
                    />
                </div>
                <div class="form-group">
                    <input
                        type="password"
                        bind:value={password}
                        placeholder="비밀번호"
                        required
                    />
                </div>
                <button type="submit" class="submit-btn">인증 코드 받기</button>
            </form>
        {:else}
            <form on:submit|preventDefault={handleVerification}>
                <div class="form-group">
                    <input
                        type="text"
                        bind:value={verificationCode}
                        placeholder="인증 코드 6자리 입력"
                        required
                    />
                </div>
                <button type="submit" class="submit-btn">회원가입 완료</button>
            </form>
        {/if}

        <div class="register-link">
            이미 계정이 있으신가요? <a href="/">로그인하기</a>
        </div>
    </div>
</div>

<style>
    .register-container {
        max-width: 400px;
        margin: 2rem auto;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h1 {
        text-align: center;
        color: #333;
        margin-bottom: 2rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        color: #666;
    }

    input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    button {
        width: 100%;
        padding: 0.75rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .error-message {
        color: #dc3545;
        padding: 0.5rem;
        margin-bottom: 1rem;
        border-radius: 4px;
        background: #f8d7da;
    }

    .success-message {
        color: #28a745;
        padding: 0.5rem;
        margin-bottom: 1rem;
        border-radius: 4px;
        background: #d4edda;
    }

    .login-link {
        text-align: center;
        margin-top: 1rem;
    }

    .login-link a {
        color: #007bff;
        text-decoration: none;
    }

    .redirect-message {
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }

    .email-input-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding-right: 0.5rem;
    }

    .email-input-container input {
        border: none;
        flex: 1;
        min-width: 0;
    }

    .email-input-container input:focus {
        outline: none;
    }

    .email-domain {
        color: #666;
        font-size: 0.9rem;
        white-space: nowrap;
    }

    /* 이메일 입력 컨테이너에 포커스 효과 추가 */
    .email-input-container:focus-within {
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }
</style> 