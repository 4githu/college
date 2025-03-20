<script lang="ts">
    import { goto } from '$app/navigation';
    
    let email = '';
    let name = '';
    let password = '';
    let confirmPassword = '';
    let isLoading = false;
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

    async function handleSubmit() {
        if (password !== confirmPassword) {
            errorMessage = '비밀번호가 일치하지 않습니다.';
            return;
        }

        isLoading = true;
        errorMessage = '';

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email + '@djshs.djsch.kr',
                    name,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                goto('/login');
            } else {
                errorMessage = data.message || '회원가입에 실패했습니다.';
            }
        } catch (error) {
            errorMessage = '서버 오류가 발생했습니다.';
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="container">
    <div class="form-container">
        <h1>회원가입</h1>
        <form on:submit|preventDefault={handleInitialSubmit}>
            <div class="form-group">
                <label for="email">이메일</label>
                <div class="email-input-container">
                    <input
                        type="text"
                        id="email"
                        bind:value={email}
                        placeholder="이메일 주소"
                        required
                    />
                    <span class="email-domain">@djshs.djsch.kr</span>
                </div>
            </div>
            <div class="form-group">
                <label for="name">이름</label>
                <input
                    type="text"
                    id="name"
                    bind:value={name}
                    placeholder="이름을 입력하세요"
                    required
                />
            </div>
            <div class="form-group">
                <label for="password">비밀번호</label>
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    placeholder="비밀번호를 입력하세요"
                    required
                />
            </div>
            <div class="form-group">
                <label for="confirmPassword">비밀번호 확인</label>
                <input
                    type="password"
                    id="confirmPassword"
                    bind:value={confirmPassword}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                />
            </div>
            <button type="submit" class="submit-btn" disabled={isLoading}>
                {isLoading ? '처리중...' : '회원가입'}
            </button>
        </form>
        <div class="links">
            <a href="/login">이미 계정이 있으신가요? 로그인하기</a>
        </div>
    </div>
</div>

<style>
    .container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f5f5f5;
    }

    .form-container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
    }

    h1 {
        text-align: center;
        color: #333;
        margin-bottom: 2rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        color: #555;
    }

    .email-input-container {
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
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    input:focus {
        outline: none;
        border-color: #007bff;
    }

    .submit-btn {
        width: 100%;
        padding: 0.75rem;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .submit-btn:hover:not(:disabled) {
        background-color: #0056b3;
    }

    .submit-btn:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .links {
        text-align: center;
        margin-top: 1rem;
    }

    .links a {
        color: #007bff;
        text-decoration: none;
    }

    .links a:hover {
        text-decoration: underline;
    }

    .error {
        color: #dc3545;
        text-align: center;
        margin-top: 1rem;
    }
</style> 