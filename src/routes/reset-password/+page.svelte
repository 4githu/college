<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types'; // Import type for props

	// --- Props ---
	// Get the token passed from the load function using $props
	let { token }: { token: string | null } = $props();

	// --- State ---
	// Use $state for reactive variables
	let newPassword = $state('');
	let confirmPassword = $state('');
	let errorMessage = $state('');
	let successMessage = $state('');
	let isLoading = $state(false); // Add loading state

	// --- Event Handler ---
	async function handlePasswordReset() {
		// Clear previous messages and set loading state
		errorMessage = '';
		successMessage = '';

		// Validate token presence (check the prop)
		if (!token) {
			errorMessage = '유효하지 않은 링크 또는 토큰이 없습니다.';
			return;
		}

		// Validate password match
		if (newPassword !== confirmPassword) {
			errorMessage = '비밀번호가 일치하지 않습니다.';
			return;
		}

		// Basic password length validation (can add more complex rules)
		if (newPassword.length < 8) {
			errorMessage = '비밀번호는 8자 이상이어야 합니다.';
			return;
		}

		isLoading = true; // Set loading state

		try {
			const response = await fetch('/api/reset-password/confirm', { // Ensure this is your correct API endpoint
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					token: token, // Use the token from props
					newPassword: newPassword
				})
			});

			// Try parsing JSON response, provide fallback on error
			const data = await response.json().catch(() => ({ message: `서버 응답 오류 (${response.status})` }));

			if (response.ok) {
				successMessage = data.message || '비밀번호가 성공적으로 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.';
				errorMessage = '';
				newPassword = ''; // Clear fields on success
				confirmPassword = '';

				// Wait 3 seconds then redirect to login page
				setTimeout(() => {
					goto('/login?reset=success', { replaceState: true }); // Go to login, maybe with query param
				}, 3000);

			} else {
				errorMessage = data.message || '비밀번호 변경에 실패했습니다. 링크가 만료되었거나 오류가 발생했습니다.';
				successMessage = '';
			}
		} catch (error) {
			console.error('Password reset confirmation error:', error);
			errorMessage = '네트워크 오류 또는 서버에 연결할 수 없습니다.';
			successMessage = '';
		} finally {
			isLoading = false; // Reset loading state regardless of outcome
		}
	}
</script>

<div class="container">
	<h1>비밀번호 재설정</h1>

	<div class="reset-section">
		{#if !token}
			<!-- Message shown if token is missing from URL (handled by load function returning null) -->
			<p class="error">유효하지 않은 링크입니다. 비밀번호 재설정을 다시 요청해주세요.</p>
			<a href="/forgot-password" class="back-link">비밀번호 찾기로 돌아가기</a>
		{:else}
			<!-- Show success message and disable form -->
			{#if successMessage}
				<p class="success">{successMessage}</p>
			{:else}
				<!-- Show form only if no success message -->
				{#if errorMessage}
					<p class="error">{errorMessage}</p>
				{/if}

				<!-- Use on:submit (Svelte 5 handles preventDefault for async) -->
				<form on:submit={handlePasswordReset}>
					<div class="form-group">
						<label for="newPassword">새 비밀번호</label>
						<input
							id="newPassword"
							type="password"
							bind:value={newPassword} {# bind:value works with $state #}
							placeholder="새 비밀번호 (8자 이상)"
							required
							minlength="8"
							disabled={isLoading} {# Disable input while loading #}
						/>
					</div>

					<div class="form-group">
						<label for="confirmPassword">비밀번호 확인</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword} {# bind:value works with $state #}
							placeholder="비밀번호 확인"
							required
							minlength="8"
							disabled={isLoading} {# Disable input while loading #}
						/>
						{#if newPassword && confirmPassword && newPassword !== confirmPassword}
						    <p class="inline-error">비밀번호가 일치하지 않습니다.</p>
						{/if}
					</div>

					<button type="submit" class="reset-btn" disabled={isLoading || (newPassword && newPassword !== confirmPassword)}>
						{#if isLoading}처리 중...{:else}비밀번호 변경{/if}
					</button>
				</form>
			{/if}
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 4rem auto; /* More top margin */
		padding: 1rem;
		text-align: center;
	}

	.reset-section {
		width: 100%;
		max-width: 400px;
		margin: 2rem auto;
		padding: 2.5rem; /* More padding */
		background: #ffffff; /* White background */
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Softer shadow */
	}

	h1 {
		margin-bottom: 2rem;
		color: #333;
	}

	.form-group {
		margin-bottom: 1.5rem;
		text-align: left;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600; /* Bolder */
		color: #495057;
		font-size: 0.9rem;
	}

	input[type='password'] {
		width: 100%;
		padding: 0.8rem;
		border: 1px solid #ced4da; /* Standard border */
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box;
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


	.reset-btn {
		width: 100%;
		padding: 0.8rem 1rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s, opacity 0.2s;
		margin-top: 1rem; /* Add space above button */
	}

	.reset-btn:hover:not(:disabled) {
		background-color: #0056b3; /* Darker on hover */
		opacity: 1;
	}

	.reset-btn:disabled {
		background-color: #6c757d; /* Grey when disabled */
		opacity: 0.65;
		cursor: not-allowed;
	}

	.error, .success, .inline-error {
		margin-bottom: 1.5rem;
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

	.inline-error {
		color: #dc3545;
		font-size: 0.8rem;
		padding: 0.2rem 0 0 0;
		margin: 0.3rem 0 0 0;
		background-color: transparent;
		border: none;
		text-align: left;
	}

	.back-link {
		display: inline-block; /* Allow margin */
		margin-top: 1rem;
		color: #007bff;
		text-decoration: none;
		font-size: 0.9rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}
</style>
