<script lang="ts">
	// Removed: import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	// Assuming 'user' from auth is now a $state export
	import { user } from '$lib/auth';
	// Import $effect and $derived runes (implicitly available in Svelte 5 components, but explicit import can aid clarity if needed)
	// import { $effect, $derived } from 'svelte';

	// --- Component State ---
	// Use $state for reactive variables
	let name = $state('');
	let email = $state(''); // This will likely be overwritten by user store or API, but good to initialize
	let overallGpa = $state(''); // Store as string for input binding, parse when needed
	let errorMessage = $state('');
	let successMessage = $state('');
	let isLoading = $state(true); // Added loading state
	let isEditMode = $state(false);
	let useOverallGpa = $state(true); // Default mode

	// Use $state for the array of semester GPAs
	let semesterGpas = $state(Array(5).fill('-1')); // Initialize with default "-1" string

	// --- Effects ---
	// Use $effect to run code reactively based on dependencies (user login status)
	$effect(() => {
		// Redirect if user is not logged in (runs when `user` changes)
		if (user === undefined) {
			// Still initializing perhaps, wait. Or handle if your store uses undefined initially.
			isLoading = true;
		} else if (user === null) {
			// User explicitly logged out or session invalid
			goto('/', { replaceState: true }); // Use replaceState to avoid back button to profile
			isLoading = false; // Stop loading if redirecting
		} else {
			// User is logged in, load profile data
			isLoading = true; // Start loading when user becomes available
			loadProfileData(); // Call the async function to fetch data
		}
	});

	// --- Data Fetching & Logic ---
	async function loadProfileData() {
		// Reset messages/errors on load
		errorMessage = '';
		successMessage = '';
		// No need for X-User-Email header if using cookies/session auth properly managed by hooks
		try {
			// Assume '/api/profile' uses the server-side session (via hooks/locals)
			const response = await fetch('/api/profile');

			if (!response.ok) {
				// Handle potential errors like 401 Unauthorized, 404 Not Found, 500 Server Error
				const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status} Error` }));
				throw new Error(errorData.message || 'Failed to fetch profile data');
			}

			const data = await response.json();

			// Update state directly using $state variables
			name = data.name || ''; // Handle potential null/undefined names
			email = data.email || ''; // Use email from fetched data as source of truth

			// Process overall GPA
			if (data.overall_gpa !== null && data.overall_gpa > 0) {
				overallGpa = data.overall_gpa.toString();
				useOverallGpa = true; // Default to showing overall if available
			} else {
				overallGpa = ''; // Keep empty if null/0
				useOverallGpa = false; // If no overall, default to semester input
			}

			// Load semester GPAs, ensuring they are strings and handling potential nulls/undefined
			const loadedSemesterGpas = [
				data.gpa_1_1, data.gpa_1_2, data.gpa_2_1, data.gpa_2_2, data.gpa_3_1
			].map(gpa => (gpa !== null && gpa !== undefined && gpa >= -1) ? gpa.toString() : '-1'); // Ensure valid number or '-1' string

			semesterGpas = loadedSemesterGpas;

			// If any valid semester GPA exists (besides -1), prefer semester input mode
			if (semesterGpas.some(gpa => gpa !== '-1' && parseFloat(gpa) >= 0)) {
				useOverallGpa = false;
				if (!overallGpa) { // If overall GPA wasn't loaded, calculate from semesters
					// Note: overallGpa state is only for the *input*. Display uses derived.
				}
			} else if (!overallGpa) {
				// If no overall and no semester data, default to overall input mode
				useOverallGpa = true;
			}

		} catch (error: any) {
			console.error('Error loading profile:', error);
			errorMessage = error.message || '프로필 정보를 불러오는데 실패했습니다.';
		} finally {
			isLoading = false; // Ensure loading stops
		}
	}

	// --- Derived State ---
	// Use $derived for values computed from other state
	let calculatedAverageGpa = $derived(() => {
		const validGpas = semesterGpas
			.map(gpa => parseFloat(gpa)) // Convert string inputs to numbers
			.filter(gpa => !isNaN(gpa) && gpa >= 0); // Filter out NaN and "-1"

		if (validGpas.length === 0) return '0.00'; // Return string for display

		const average = validGpas.reduce((sum, gpa) => sum + gpa, 0) / validGpas.length;
		return average.toFixed(2); // Return formatted string
	});

	// Get the GPA to actually display (either user-entered overall or calculated)
	let displayGpa = $derived(() => {
		if (useOverallGpa && overallGpa && parseFloat(overallGpa) >= 0) {
			return parseFloat(overallGpa).toFixed(2);
		} else if (!useOverallGpa && calculatedAverageGpa !== '0.00') {
			return calculatedAverageGpa;
		}
		return '미입력'; // Fallback if nothing valid is entered/calculated
	});


	// --- Event Handlers ---
	async function handleSubmit() {
		isLoading = true; // Show loading indicator during submit
		errorMessage = '';
		successMessage = '';

		// Prepare payload - parse GPAs back to numbers or null
		const overallGpaValue = useOverallGpa && overallGpa.trim() !== '' ? parseFloat(overallGpa) : null;
		const semesterGpasValues = useOverallGpa ? Array(5).fill(null) : semesterGpas.map(gpa => {
			const num = parseFloat(gpa);
			return !isNaN(num) && num >= -1 ? num : null; // Send valid numbers or null
		});

		// Basic validation
		if (!name.trim()) {
			errorMessage = '이름을 입력해주세요.';
			isLoading = false;
			return;
		}
		if (useOverallGpa && (overallGpaValue === null || isNaN(overallGpaValue) || overallGpaValue < 0 || overallGpaValue > 4.5)) {
			errorMessage = '유효한 전체 평균학점을 입력해주세요 (0 ~ 4.5).';
			isLoading = false;
			return;
		}
		if (!useOverallGpa && semesterGpasValues.some(gpa => gpa !== null && (isNaN(gpa) || gpa < -1 || gpa > 4.5))) {
			errorMessage = '유효한 학기별 학점을 입력해주세요 (-1 또는 0 ~ 4.5).';
			isLoading = false;
			return;
		}


		try {
			const response = await fetch('/api/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					useOverallGpa: useOverallGpa, // Send the mode choice if needed by backend
					overall_gpa: overallGpaValue, // Send parsed number or null
					semester_gpas: semesterGpasValues // Send parsed numbers or null
				})
			});

			if (response.ok) {
				successMessage = '프로필이 성공적으로 업데이트되었습니다.';
				errorMessage = '';
				isEditMode = false; // Exit edit mode on success
				// Optionally, re-fetch or update state based on response if API returns updated data
				// await loadProfileData(); // Re-fetch to confirm changes (as per original)
			} else {
				const data = await response.json().catch(() => ({ message: '업데이트 중 오류 발생' }));
				errorMessage = data.message || '프로필 업데이트에 실패했습니다.';
				successMessage = '';
			}
		} catch (error: any) {
			console.error('Profile update error:', error);
			errorMessage = error.message || '서버 오류가 발생했습니다.';
			successMessage = '';
		} finally {
			isLoading = false;
		}
	}

	// Utility function (no change needed)
	function getSemesterName(index: number): string {
		const year = Math.floor(index / 2) + 1;
		const semester = (index % 2) + 1;
		return `${year}학년 ${semester}학기`; // Adjusted naming
	}

	// Logout function (no change needed in core logic)
	async function handleLogout() {
		try {
			const response = await fetch('/api/logout', { method: 'POST' });
			if (response.ok) {
				// The $effect checking `user` should handle the redirect via goto('/')
				// but explicit navigation might feel slightly faster.
				window.location.href = '/';
			} else {
				console.error('Logout failed:', response.status);
				// Optionally show an error message to the user
			}
		} catch (error) {
			console.error('Logout error:', error);
			// Optionally show a network error message
		}
	}

	function handleCancelEdit() {
		isEditMode = false;
		// Optionally, reload data to discard changes if loadProfileData doesn't cause issues
		// await loadProfileData();
		errorMessage = ''; // Clear any validation errors shown during editing
		successMessage = '';
	}
</script>

<div class="container">
	<nav class="navigation">
		<div class="nav-left">
			<button class="nav-btn" on:click={() => goto('/selection')}> 뒤로가기 </button>
		</div>
		<div class="nav-right">
			<button class="logout-btn" on:click={handleLogout}> 로그아웃 </button>
		</div>
	</nav>

	<h1>프로필</h1>

	{#if isLoading}
		<p>Loading profile...</p>
	{:else if !user}
		<!-- This part might not be reached due to the $effect redirect, but good as a fallback -->
		<p>로그인이 필요합니다. <a href="/">로그인 페이지로 이동</a></p>
	{:else}
		{#if errorMessage}
			<p class="error">{errorMessage}</p>
		{/if}
		{#if successMessage}
			<p class="success">{successMessage}</p>
		{/if}

		<div class="profile-container">
			{#if !isEditMode}
				<!-- View Mode -->
				<div class="profile-info">
					<div class="info-group">
						<label>이름</label>
						<p>{name || '미입력'}</p> {# Default display text #}
					</div>
					<div class="info-group">
						<label>이메일</label>
						<p>{email}</p> {# Email from user store/API #}
					</div>
					<div class="info-group">
						<label>평균학점</label> {# Consolidated GPA display #}
						<p>{displayGpa}</p> {# Use the derived display GPA #}
					</div>
					<button class="edit-btn" on:click={() => (isEditMode = true)}> 수정하기 </button>
				</div>
			{:else}
				<!-- Edit Mode -->
				<!-- Use on:submit (Svelte 5 handles preventDefault for async handlers) -->
				<form on:submit={handleSubmit}>
					<div class="form-group">
						<label for="name">이름</label>
						<input type="text" id="name" bind:value={name} required /> {# bind:value works with $state #}
					</div>

					<div class="form-group">
						<label for="email">이메일</label>
						<input type="email" id="email" value={email} disabled /> {# Email is not editable #}
					</div>

					<div class="gpa-section">
						<h2>학점 입력</h2>
						<div class="gpa-toggle">
							<label>
								<input
									type="radio"
									name="gpaMode"
									bind:group={useOverallGpa} {# bind:group works with $state #}
									value={true}
								/>
								전체 평균학점 입력
							</label>
							<label>
								<input
									type="radio"
									name="gpaMode"
									bind:group={useOverallGpa}
									value={false}
								/>
								학기별 학점 입력
							</label>
						</div>

						{#if useOverallGpa}
							<div class="form-group">
								<label for="overallGpa">전체 평균학점</label>
								<input
									type="number"
									id="overallGpa"
									bind:value={overallGpa} {# bind:value works with $state #}
									min="0"
									max="4.5"
									step="0.01"
									placeholder="예: 3.75"
									required={useOverallGpa} {# Required only if this mode is active #}
								/>
							</div>
						{:else}
							<div class="semester-gpas">
								{#each { length: 5 } as _, i}
									<div class="form-group">
										<label for="semester{i}">
											{getSemesterName(i)} 학점
											<span class="hint">(미이수 또는 미입력 시 -1)</span>
										</label>
										<input
											type="number"
											id="semester{i}"
											bind:value={semesterGpas[i]} {# bind:value works with array elements in $state #}
											min="-1"
											max="4.5"
											step="0.01"
											placeholder="-1"
											required={!useOverallGpa} {# Required only if this mode is active #}
										/>
									</div>
								{/each}
								<div class="calculated-gpa">
									계산된 평균학점: {calculatedAverageGpa} {# Use the $derived value #}
								</div>
							</div>
						{/if}
					</div>

					<div class="button-group">
						<button type="submit" class="submit-btn" disabled={isLoading}>{# Disable button while submitting #}
							{#if isLoading}저장 중...{:else}저장{/if}
						</button>
						<button type="button" class="cancel-btn" on:click={handleCancelEdit} disabled={isLoading}> 취소 </button>
					</div>
				</form>
			{/if}
		</div>
	{/if}
</div>

<style>
    /* Styles remain largely the same - no changes needed for Svelte 5 */
    .container {
        max-width: 600px; /* Slightly narrower for profile */
        margin: 2rem auto;
        padding: 1rem;
    }

    .navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
    }

	.nav-btn, .logout-btn {
		padding: 0.6rem 1.2rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s ease;
	}

    .nav-btn {
        background: #6c757d;
        color: white;
    }
	.nav-btn:hover {
		background: #5a6268;
	}

    .logout-btn {
        background: #dc3545;
        color: white;
    }

    .logout-btn:hover {
        background: #c82333;
    }

    .profile-container {
        background: #ffffff; /* Lighter background */
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08); /* Softer shadow */
    }

    .profile-info {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .info-group {
        display: flex;
        flex-direction: column;
        gap: 0.3rem; /* Smaller gap */
    }

    .info-group label {
        font-weight: 600; /* Slightly bolder */
        color: #495057;
        font-size: 0.9rem;
    }

    .info-group p {
        margin: 0;
        padding: 0.8rem; /* Consistent padding */
        background: #f8f9fa; /* Subtle background for value */
        border: 1px solid #e9ecef; /* Subtle border */
        border-radius: 4px;
        font-size: 1rem;
        color: #212529;
    }

    .edit-btn {
        margin-top: 1.5rem;
        padding: 0.8rem 1.5rem; /* Better padding */
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
		font-size: 1rem;
		align-self: flex-start; /* Align button left */
		transition: background-color 0.2s ease;
    }
	.edit-btn:hover {
		background-color: #0056b3;
	}

    .button-group {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }

    .submit-btn, .cancel-btn {
        padding: 0.8rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        flex: 1;
		font-size: 1rem;
		transition: background-color 0.2s ease, opacity 0.2s ease;
    }

    .submit-btn {
        background: #28a745; /* Green for save */
        color: white;
    }
	.submit-btn:hover {
		background-color: #218838;
	}

    .cancel-btn {
        background: #6c757d;
        color: white;
    }
	.cancel-btn:hover {
		background-color: #5a6268;
	}

	.submit-btn:disabled, .cancel-btn:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}


    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label { /* Combined label style */
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
		font-size: 0.9rem;
		color: #495057;
    }

    input[type="text"], input[type="email"], input[type="number"] {
        width: 100%;
        padding: 0.8rem;
        border: 1px solid #ced4da; /* Standard input border */
        border-radius: 4px;
        font-size: 1rem;
		box-sizing: border-box; /* Include padding in width */
    }
	input:focus {
		border-color: #80bdff;
		outline: 0;
		box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
	}


    input[type="radio"] {
        width: auto;
        margin-right: 0.5rem;
		vertical-align: middle;
    }

	.gpa-toggle label { /* Style radio labels */
		display: inline-flex; /* Align radio and text */
		align-items: center;
		font-weight: normal;
		cursor: pointer;
	}

    .gpa-section {
        margin: 2.5rem 0;
        padding: 1.5rem;
        background: #f8f9fa; /* Section background */
        border: 1px solid #e9ecef;
        border-radius: 8px;
    }
	.gpa-section h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1.3rem;
		color: #343a40;
	}

    .gpa-toggle {
        margin-bottom: 1.5rem; /* Space below radio buttons */
        display: flex;
        flex-wrap: wrap; /* Allow wrapping on small screens */
        gap: 1rem 2rem; /* Row and column gap */
    }

    .hint {
        font-size: 0.8rem;
        color: #6c757d;
        font-weight: normal;
		margin-left: 0.5rem;
    }

    .calculated-gpa {
        margin-top: 1rem;
        padding: 0.8rem 1rem; /* Consistent padding */
        background: #e9ecef;
        border: 1px solid #ced4da;
        border-radius: 4px;
        text-align: center;
        font-weight: 600; /* Bolder */
        color: #0056b3; /* Darker blue */
		font-size: 1rem;
    }

    .error, .success { /* Combined message styling */
        margin-bottom: 1.5rem; /* More space */
		padding: 0.8rem 1rem;
		border-radius: 4px;
		font-size: 0.95rem;
		text-align: center;
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

    input:disabled {
        background: #e9ecef;
        cursor: not-allowed;
		opacity: 0.7;
    }

    .semester-gpas {
        display: grid;
		/* Responsive grid: 1 column on small, 2 on medium+ */
		grid-template-columns: 1fr;
        gap: 1rem;
        margin-top: 1.5rem;
    }
	@media (min-width: 576px) {
		.semester-gpas {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem 1.5rem; /* Row and column gap */
		}
	}

</style>
