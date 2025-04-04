<script lang="ts">
	// Use $state for reactive variables
	let email = $state('');
	let successMessage = $state('');
	let errorMessage = $state('');

	// Domain constant - not reactive state, so keep as regular const
	const EMAIL_DOMAIN = '@djshs.djsch.kr';

	async function handlePasswordReset() {
		// Reset messages on new attempt
		successMessage = '';
		errorMessage = '';

		// Basic validation
		if (!email.trim()) {
			errorMessage = '이메일 주소를 입력해주세요.';
			return;
		}

		try {
			const fullEmail = `${email}${EMAIL_DOMAIN}`;
			const response = await fetch('/api/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email: fullEmail })
			});

			// Try to parse JSON regardless of status, as error messages might be in the body
			let data;
			try {
				data = await response.json();
			} catch (e) {
				// Handle cases where the response is not JSON (e.g., server error page)
				data = { message: response.statusText }; // Use status text as a fallback message
			}


			if (response.ok) {
				successMessage = data.message || '비밀번호 재설정 링크가 이메일로 전송되었습니다.'; // Use server message if available
				errorMessage = '';
				email = ''; // Clear input on success
			} else {
				// Use the message from the JSON response, or provide a default
				errorMessage = data.message || '비밀번호 재설정 요청에 실패했습니다.';
				successMessage = '';
			}
		} catch (error) {
			console.error('Password reset request error:', error);
			errorMessage = '서버에 연결할 수 없거나 요청 중 오류가 발생했습니다.'; // More specific network/client error message
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

		<!-- Use on:submit which implicitly prevents default for async handlers -->
		<form on:submit={handlePasswordReset}>
			<div class="form-group">
				<label for="email-input">가입한 이메일 주소를 입력해주세요</label>
				<div class="email-input">
					<input
						id="email-input"
						type="text"
						bind:value={email} {#bind:value works directly with $state#}
						placeholder="이메일 아이디"
						required
						aria-describedby="email-domain-label"
					/>
					<span class="email-domain" id="email-domain-label">{EMAIL_DOMAIN}</span>
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
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Added subtle shadow */
	}

	.form-group {
		margin-bottom: 1.5rem;
		text-align: left;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: bold; /* Make label clearer */
	}

	.email-input {
		display: flex;
		align-items: center;
		border: 1px solid #ddd; /* Wrap input and domain in a border */
		border-radius: 4px;
		overflow: hidden; /* Ensure children fit */
	}

	.email-input input {
		flex-grow: 1; /* Allow input to take available space */
		padding: 0.8rem;
		border: none; /* Remove default input border */
		border-radius: 0; /* Remove default input radius */
		font-size: 1rem;
		min-width: 50px; /* Prevent shrinking too much */
		outline: none; /* Remove outline on focus */
	}

	.email-input input:focus-within {
		/* Optional: Add focus style to the container */
	}


	.email-domain {
		color: #6c757d; /* Slightly darker grey */
		white-space: nowrap;
		background-color: #e9ecef; /* Subtle background for domain */
		padding: 0.8rem; /* Match input padding */
		border-left: 1px solid #ddd; /* Separator */
	}


	.reset-btn {
		width: 100%;
		padding: 0.8rem 1rem; /* Consistent padding */
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease; /* Add transition */
	}

	.reset-btn:hover {
		background-color: #0056b3; /* Darker on hover */
		opacity: 1; /* Remove default opacity change if using background change */
	}

	.reset-btn:disabled {
	    background-color: #6c757d;
		cursor: not-allowed;
	}

	.error, .success {
		margin-bottom: 1rem;
		padding: 0.8rem;
		border-radius: 4px;
		font-size: 0.95rem;
	}

	.error {
		color: #721c24;
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
	}

	.success {
		color: #155724;
		background-color: #d4edda;
		border: 1px solid #c3e6cb;
	}

	.login-link {
		margin-top: 1.5rem; /* More space */
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
