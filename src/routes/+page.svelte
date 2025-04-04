<script lang="ts">
	import { goto } from '$app/navigation';
	// Assuming user is exported as $state from auth store
	import { user } from '$lib/auth';

	// --- State ---
	// Use $state for reactive form inputs and messages
	let email = $state(''); // User part of the email
	let password = $state('');
	let errorMessage = $state('');
	let isLoading = $state(false); // State to manage loading indicator

	// --- Constants ---
	const EMAIL_DOMAIN = '@djshs.djsch.kr';

	// --- Effects ---
	// Use $effect to redirect if user is already logged in
	$effect(() => {
		if (user) {
			console.log('User is already logged in, redirecting from login page...');
			// Redirect to a default logged-in page (e.g., selection or dashboard)
			goto('/selection', { replaceState: true }); // replaceState prevents back button to login
		}
	});

	// --- Event Handler ---
	async function handleLogin() {
		isLoading = true; // Show loading indicator
		errorMessage = ''; // Clear previous errors

		const fullEmail = email.trim().includes('@') ? email.trim() : `${email.trim()}${EMAIL_DOMAIN}`;

        // Basic validation
        if (!email.trim() || !password) {
            errorMessage = "이메일과 비밀번호를 모두 입력해주세요.";
            isLoading = false;
            return;
        }

		try {
			const response = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: fullEmail, password }) // Send password as is
			});

			// Attempt to parse JSON regardless of status code for error messages
			const data = await response.json().catch(() => ({ message: `로그인 처리 중 오류 발생 (${response.status})` }));

			if (response.ok) {
				// Login successful. The backend should set a session cookie.
				// The `$lib/auth` store should ideally detect this change
				// (e.g., via a subsequent fetch in `loadUser` or WebSocket).
				// The $effect above watching `user` will handle the redirect.
                // If direct navigation is preferred *after* API call success:
				// goto(data.redirectTo || '/selection'); // Use redirect path from API or default
			} else {
				errorMessage = data.message || '이메일 또는 비밀번호가 잘못되었습니다.';
			}
		} catch (error) {
			console.error('Login error:', error);
			errorMessage = '로그인 중 서버 오류 또는 네트워크 문제가 발생했습니다.';
		} finally {
			isLoading = false; // Hide loading indicator
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
			<!-- Use on:submit (Svelte 5 handles preventDefault for async) -->
			<form on:submit={handleLogin}>
				<div class="form-group">
					<label for="email-input" class="visually-hidden">이메일</label>
					<div class="email-input">
						<input
							id="email-input"
							type="text"
							bind:value={email} {# bind:value works with $state #}
							placeholder="학교 이메일 아이디"
							required
							disabled={isLoading} {# Disable while loading #}
                            aria-describedby="email-domain-label"
						/>
						<span class="email-domain" id="email-domain-label">{EMAIL_DOMAIN}</span>
					</div>
				</div>
				<div class="form-group">
					<label for="password-input" class="visually-hidden">비밀번호</label>
					<input
						id="password-input"
						type="password"
						bind:value={password} {# bind:value works with $state #}
						placeholder="비밀번호"
						required
						disabled={isLoading} {# Disable while loading #}
					/>
				</div>
				<button type="submit" class="login-btn" disabled={isLoading}>
					{#if isLoading}로그인 중...{:else}로그인{/if}
				</button>
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
		display: flex; /* Use flex to center content */
        justify-content: center;
        align-items: flex-start; /* Align to top */
		min-height: 80vh; /* Minimum height */
        padding-top: 4rem; /* Space from top */
	}

	h2 {
		text-align: center;
		margin-bottom: 1.5rem;
		font-size: 1.8rem; /* Slightly larger */
        color: #333;
	}

	.main-content {
		width: 100%;
		max-width: 400px; /* Max width for the login box */
	}

	.login-section {
		padding: 2.5rem; /* More padding */
		background: #ffffff; /* White background */
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.form-group {
		margin-bottom: 1.5rem; /* More space between inputs */
	}

	input[type="text"], input[type="password"] {
		width: 100%;
		padding: 0.8rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 1rem;
        box-sizing: border-box; /* Include padding in width */
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}
    input:focus {
		outline: none;
		border-color: #80bdff;
		box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
	}
    input:disabled {
        background-color: #e9ecef;
        cursor: not-allowed;
    }


	.login-btn {
		padding: 0.8rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		width: 100%; /* Full width */
        background: #007bff;
		color: white;
        font-weight: 500;
        transition: background-color 0.2s ease, opacity 0.2s ease;
	}
	.login-btn:hover:not(:disabled) {
		background-color: #0056b3; /* Darker blue on hover */
		opacity: 1;
	}
    .login-btn:disabled {
        background-color: #6c757d;
        opacity: 0.65;
        cursor: not-allowed;
    }


	.error {
		color: #721c24;
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
		padding: 0.8rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		text-align: center;
		font-size: 0.9rem;
	}

	.email-input {
		display: flex;
		align-items: center;
		border: 1px solid #ced4da;
		border-radius: 4px;
        overflow: hidden; /* Contain children */
	}
    .email-input input {
        border: none; /* Remove inner border */
        border-radius: 0;
        flex-grow: 1;
    }
    .email-input input:focus {
        box-shadow: none; /* Remove focus shadow from inner input */
    }
    /* Add focus to container instead */
    .email-input:focus-within {
        border-color: #80bdff;
		box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }


	.email-domain {
		color: #6c757d;
		white-space: nowrap;
        padding: 0.8rem;
        background-color: #e9ecef;
        font-size: 1rem;
	}

	.auth-links {
		margin-top: 1.5rem; /* More space */
		display: flex;
		justify-content: space-between; /* Space out links */
		font-size: 0.9rem;
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

    /* Visually hidden class for labels if needed */
    .visually-hidden {
        border: 0;
        clip: rect(0 0 0 0);
        height: 1px;
        margin: -1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
    }
</style>
