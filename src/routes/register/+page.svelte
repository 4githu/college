<script lang="ts">
	import { goto } from '$app/navigation';

	// --- State ---
	// Use $state for all reactive component variables
	let email = $state(''); // User part of the email
	let name = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let verificationCode = $state(''); // State for the verification code input
	let isLoading = $state(false);
	let errorMessage = $state('');
	let step = $state(1); // 1: Initial details, 2: Verification code

	// --- Constants ---
	const EMAIL_DOMAIN = '@djshs.djsch.kr';

	// --- Computed Full Email (using a function, or could use $derived) ---
	// Helper function for consistency
	function getFullEmail(): string {
		const trimmedEmail = email.trim();
		// Avoid adding domain if it's already somehow included or empty
		if (!trimmedEmail || trimmedEmail.includes('@')) {
			return trimmedEmail;
		}
		return `${trimmedEmail}${EMAIL_DOMAIN}`;
	}

	// --- Step 1: Submit Initial Registration Details ---
	async function handleInitialSubmit() {
		// Basic Validations
		if (password !== confirmPassword) {
			errorMessage = '비밀번호가 일치하지 않습니다.';
			return;
		}
		if (!name.trim()) {
			errorMessage = '이름을 입력해주세요.';
			return;
		}
		if (!email.trim()) {
			errorMessage = '이메일 주소를 입력해주세요.';
			return;
		}
		// Add more password strength validation if needed

		isLoading = true;
		errorMessage = ''; // Clear previous errors

		const fullEmail = getFullEmail();

		try {
			// This endpoint should ideally:
			// 1. Validate input (email format, password strength).
			// 2. Check if email/user already exists (but not verified).
			// 3. Store user details temporarily (e.g., mark as 'unverified').
			// 4. Generate and send a verification code via email.
			const response = await fetch('/api/register/start', { // Changed endpoint for clarity
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: fullEmail,
					name: name.trim(),
					password // Send the password
				})
			});

			// Try parsing JSON even on failure for error messages
			const data = await response.json().catch(() => ({ message: `서버 응답 오류 (${response.status})` }));

			if (response.ok) {
				step = 2; // Move to verification step
				errorMessage = ''; // Clear error on success
				// Maybe show a success message: "Verification code sent to your email."
			} else {
				errorMessage = data.message || '등록 요청에 실패했습니다.';
			}
		} catch (error) {
			console.error('Registration start error:', error);
			errorMessage = '네트워크 오류 또는 서버에 연결할 수 없습니다.';
		} finally {
			isLoading = false;
		}
	}

	// --- Step 2: Submit Verification Code ---
	async function handleVerification() {
		if (!verificationCode.trim()) {
			errorMessage = '인증 코드를 입력해주세요.';
			return;
		}

		isLoading = true;
		errorMessage = ''; // Clear previous errors

		const fullEmail = getFullEmail();

		try {
			// This endpoint should:
			// 1. Find the unverified user associated with the email.
			// 2. Compare the provided code with the stored/expected code.
			// 3. If valid: Mark the user as verified, clear the code.
			// 4. If invalid: Return an error.
			const response = await fetch('/api/register/verify', { // Changed endpoint for clarity
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: fullEmail,
					code: verificationCode.trim()
				})
			});

			const data = await response.json().catch(() => ({ message: `서버 응답 오류 (${response.status})` }));

			if (response.ok) {
				// Successfully verified! Redirect to login or maybe dashboard.
				goto('/login?verified=true'); // Redirect to login with a success indicator
			} else {
				errorMessage = data.message || '인증에 실패했습니다. 코드를 확인해주세요.';
			}
		} catch (error) {
			console.error('Verification error:', error);
			errorMessage = '네트워크 오류 또는 서버에 연결할 수 없습니다.';
		} finally {
			isLoading = false;
		}
	}

	// Removed the confusing/redundant handleSubmit function
</script>

<div class="container">
	<div class="form-container">
		{#if step === 1}
			<!-- Step 1: Initial Details Form -->
			<h1>회원가입 (1/2)</h1>
			{#if errorMessage}
				<p class="error">{errorMessage}</p>
			{/if}
			<!-- Use on:submit (Svelte 5 handles preventDefault for async) -->
			<form on:submit={handleInitialSubmit}>
				<div class="form-group">
					<label for="email">이메일</label>
					<div class="email-input-container">
						<input
							type="text"
							id="email"
							bind:value={email} {# bind:value works with $state #}
							placeholder="학교 이메일 아이디"
							required
							aria-describedby="email-domain-label"
						/>
						<span class="email-domain" id="email-domain-label">{EMAIL_DOMAIN}</span>
					</div>
				</div>
				<div class="form-group">
					<label for="name">이름</label>
					<input type="text" id="name" bind:value={name} placeholder="실명 입력" required />
				</div>
				<div class="form-group">
					<label for="password">비밀번호</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						placeholder="비밀번호 (8자 이상 권장)"
						required
						minlength="8" {# Basic length check #}
					/>
				</div>
				<div class="form-group">
					<label for="confirmPassword">비밀번호 확인</label>
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
						placeholder="비밀번호 다시 입력"
						required
					/>
					{#if password && confirmPassword && password !== confirmPassword}
						<p class="inline-error">비밀번호가 일치하지 않습니다.</p>
					{/if}
				</div>
				<button type="submit" class="submit-btn" disabled={isLoading || (password && password !== confirmPassword)}>
					{#if isLoading}처리중...{:else}인증코드 받기{/if}
				</button>
			</form>
		{:else if step === 2}
			<!-- Step 2: Verification Code Form -->
			<h1>이메일 인증 (2/2)</h1>
			{#if errorMessage}
				<p class="error">{errorMessage}</p>
			{/if}
			<p class="info">
				<strong>{getFullEmail()}</strong>(으)로 전송된 인증 코드를 입력해주세요.
			</p>
			<!-- Use on:submit -->
			<form on:submit={handleVerification}>
				<div class="form-group">
					<label for="verificationCode">인증 코드</label>
					<input
						type="text"
						id="verificationCode"
						bind:value={verificationCode} {# bind:value works with $state #}
						placeholder="이메일로 받은 코드 입력"
						required
						inputmode="numeric" {# Hint for numeric keyboard if code is numeric #}
						autocomplete="one-time-code" {# Assist password managers #}
					/>
				</div>
				<button type="submit" class="submit-btn" disabled={isLoading}>
					{#if isLoading}확인 중...{:else}인증 완료하기{/if}
				</button>
				<button type="button" class="link-btn" on:click={() => step = 1} disabled={isLoading}>
					이전 단계로 돌아가기
				</button>
			</form>
		{/if}

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
		background-color: #f0f2f5; /* Slightly softer background */
		padding: 1rem; /* Add padding for small screens */
	}

	.form-container {
		background: white;
		padding: 2.5rem; /* More padding */
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Enhanced shadow */
		width: 100%;
		max-width: 420px; /* Slightly wider */
		box-sizing: border-box;
	}

	h1 {
		text-align: center;
		color: #333;
		margin-bottom: 1.5rem; /* Adjust spacing */
		font-size: 1.8rem; /* Larger title */
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #495057; /* Darker label text */
		font-weight: 600; /* Bolder labels */
		font-size: 0.9rem;
	}

	.email-input-container {
		display: flex;
		align-items: center;
		border: 1px solid #ced4da; /* Wrap input group */
		border-radius: 4px;
		overflow: hidden; /* Clip children */
	}

	.email-input-container input {
		border: none; /* Remove inner border */
		border-radius: 0;
		flex-grow: 1;
		min-width: 50px;
	}

	.email-domain {
		color: #6c757d;
		white-space: nowrap;
		padding: 0.75rem; /* Match input padding */
		background-color: #e9ecef;
		font-size: 0.95rem;
	}

	input[type='text'],
	input[type='password'],
	input[type='email'] { /* Base input styling */
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ced4da; /* Standard border */
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box; /* Ensure padding is included */
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	input:focus {
		outline: none;
		border-color: #80bdff;
		box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
	}

	.submit-btn, .link-btn {
		width: 100%;
		padding: 0.8rem 1rem; /* Slightly more padding */
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s, opacity 0.2s;
		margin-top: 0.5rem; /* Spacing between buttons */
	}

	.submit-btn {
		background-color: #007bff;
		color: white;
	}

	.submit-btn:hover:not(:disabled) {
		background-color: #0056b3;
	}

	.link-btn {
		background-color: transparent;
		color: #007bff;
		border: 1px solid #007bff;
		margin-top: 1rem; /* More space above secondary button */
	}
	.link-btn:hover:not(:disabled) {
		background-color: rgba(0, 123, 255, 0.1);
	}


	.submit-btn:disabled, .link-btn:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}
	/* Specific disabled style for submit button */
	.submit-btn:disabled {
		 background-color: #6c757d;
		 border-color: #6c757d;
		 color: #fff;
	}


	.links {
		text-align: center;
		margin-top: 1.5rem; /* More space */
		font-size: 0.9rem;
	}

	.links a {
		color: #007bff;
		text-decoration: none;
	}

	.links a:hover {
		text-decoration: underline;
	}

	.error, .info, .inline-error {
		text-align: center;
		padding: 0.75rem;
		margin-bottom: 1.5rem; /* Consistent spacing */
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.error {
		color: #721c24;
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
	}
	.info {
		color: #0c5460;
		background-color: #d1ecf1;
		border: 1px solid #bee5eb;
	}
	.inline-error {
		color: #dc3545;
		font-size: 0.8rem;
		padding: 0.2rem 0 0 0; /* Minimal padding */
		margin: 0.3rem 0 0 0; /* Minimal margin */
		text-align: left; /* Align with input */
		background-color: transparent;
		border: none;
	}
</style>
