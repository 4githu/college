<script lang="ts">
    import { goto } from '$app/navigation';
    
    let emailPrefix = '';  // @djshs.djsch.kr 앞부분만 입력받음
    let password = '';
    let confirmPassword = '';
    let name = '';
    let errorMessage = '';
    let successMessage = '';
    let isLoading = false;

    // 전체 이메일 주소 생성
    $: email = `${emailPrefix}@djshs.djsch.kr`;

    async function handleSubmit() {
        try {
            if (password !== confirmPassword) {
                errorMessage = '비밀번호가 일치하지 않습니다.';
                return;
            }

            if (!emailPrefix) {
                errorMessage = '이메일을 입력해주세요.';
                return;
            }

            isLoading = true;
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,  // 자동으로 생성된 전체 이메일 주소 사용
                    password,
                    name
                })
            });

            const data = await response.json();

            if (response.ok) {
                successMessage = data.message;
                errorMessage = '';
                // 성공 메시지를 보여주고 3초 후 로그인 페이지로 이동
                setTimeout(() => {
                    goto('/login');
                }, 3000);
            } else {
                errorMessage = data.message;
                successMessage = '';
            }
        } catch (error) {
            errorMessage = '서버 오류가 발생했습니다.';
            successMessage = '';
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="register-container">
    <h1>회원가입</h1>
    
    {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
    {/if}
    
    {#if successMessage}
        <div class="success-message">
            {successMessage}
            <p class="redirect-message">잠시 후 로그인 페이지로 이동합니다...</p>
        </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
            <label for="email">이메일</label>
            <div class="email-input-container">
                <input
                    type="text"
                    id="email"
                    bind:value={emailPrefix}
                    required
                    placeholder="이메일"
                    disabled={isLoading}
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
                required
                disabled={isLoading}
            />
        </div>

        <div class="form-group">
            <label for="password">비밀번호</label>
            <input
                type="password"
                id="password"
                bind:value={password}
                required
                disabled={isLoading}
            />
        </div>

        <div class="form-group">
            <label for="confirmPassword">비밀번호 확인</label>
            <input
                type="password"
                id="confirmPassword"
                bind:value={confirmPassword}
                required
                disabled={isLoading}
            />
        </div>

        <button type="submit" disabled={isLoading}>
            {isLoading ? '처리중...' : '회원가입'}
        </button>
    </form>

    <div class="login-link">
        이미 계정이 있으신가요? <a href="/login">로그인하기</a>
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