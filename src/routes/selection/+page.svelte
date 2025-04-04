<script lang="ts">
	// Removed: import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	// Assuming user and loadUser from auth are compatible with Svelte 5
	// (e.g., user is exported as $state, loadUser updates that state)
	import { user, loadUser } from '$lib/auth';
	import type { University } from '$lib/types'; // Assuming type definition exists

	// --- State ---
	// Use $state for reactive variables
	let universities = $state<University[]>([]);
	let errorMessage = $state('');
	let isLoading = $state(true); // Add loading state

	// --- Effects ---
	// Use $effect for initialization logic that runs after component setup
	$effect(() => {
		// This effect runs once when the component mounts (like onMount)
		// If loadUser or loadUniversities needed to re-run based on other state changes,
		// those dependencies would need to be read inside the effect.
		const initialize = async () => {
			isLoading = true;
			errorMessage = '';
			try {
				// Load user data first (might be needed for auth or display)
				// If user is already guaranteed to be loaded by a layout, this might be skippable
				await loadUser();

				// Then load university data
				await loadUniversities();

			} catch (err: any) {
				console.error("Initialization failed:", err);
				// If loadUniversities throws an error, it will be caught here
				errorMessage = err.message || '데이터 로딩 중 오류가 발생했습니다.';
			} finally {
				isLoading = false;
			}
		};

		initialize();

		// No cleanup needed for this effect
		// return () => { /* cleanup logic */ };
	});

	// --- Data Fetching ---
	async function loadUniversities() {
		// This function now throws error on failure, to be caught by the $effect
		const response = await fetch('/api/universities'); // Assumes auth is handled via cookies/session

		if (response.ok) {
			const data = await response.json();
			universities = data; // Update $state variable
			errorMessage = ''; // Clear error on successful load
		} else {
			// Try to get error message from response body, provide fallback
			const errorData = await response.json().catch(() => ({ message: `대학교 정보를 불러오는데 실패했습니다 (Status: ${response.status})` }));
			throw new Error(errorData.message);
		}
	}

	// --- Navigation ---
	function handleUniversityClick(universityId: string) {
		// Basic validation or check
		if (universityId) {
			goto(`/university/${universityId}`);
		}
	}

	// --- Logout ---
	// Logout logic remains largely the same
	async function handleLogout() {
		try {
			const response = await fetch('/api/logout', { method: 'POST' });

			if (response.ok) {
				// User state should update via loadUser/auth store logic,
				// potentially triggering layout changes or redirects managed elsewhere.
				// Forcing reload is also an option if simpler:
				window.location.href = '/';
			} else {
				console.error('Logout failed:', response.status);
				errorMessage = '로그아웃에 실패했습니다.'; // Show error feedback
			}
		} catch (error) {
			console.error('Logout error:', error);
			errorMessage = '로그아웃 중 오류가 발생했습니다.'; // Show network error feedback
		}
	}
</script>

<div class="container">
	<nav class="navigation">
		<div class="nav-left">
			{#if user}
				<span class="welcome-text">환영합니다, {user.name}!</span>
			{:else}
				<span class="welcome-text">환영합니다!</span>
			{/if}
		</div>
		<div class="nav-right">
			{#if user}
				<button class="nav-btn profile-btn" on:click={() => goto('/profile')}>
					{user.name || '내 프로필'} {# Access user state directly #}
				</button>
				<button class="nav-btn logout-btn" on:click={handleLogout}> 로그아웃 </button>
			{:else}
				<button class="nav-btn" on:click={() => goto('/login')}> 로그인 </button>
			{/if}
		</div>
	</nav>

	<h1>대학교 선택</h1>

	{#if isLoading}
		<p>대학교 목록을 불러오는 중...</p>
	{:else if errorMessage}
		<p class="error">{errorMessage}</p>
	{:else if universities.length === 0}
		<p>등록된 대학교 정보가 없습니다.</p>
 	{:else}
		<div class="university-grid">
			{#each universities as university (university.id)}
				<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
				<div class="university-card" on:click={() => handleUniversityClick(university.id)}>
					<h2>{university.name}</h2>
					{#if university.colleges && university.colleges.length > 0}
						<div class="college-list">
							<h3>단과대학 목록</h3>
							<ul>
								{#each university.colleges as college (college.id)}
									<li>{college.name}</li>
								{/each}
							</ul>
						</div>
						<div class="department-count">
							총 {university.colleges.reduce((acc, college) => acc + (college.departments?.length || 0), 0)}개 학과
						</div>
					{:else}
						<p>등록된 단과대학 정보가 없습니다.</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 1rem 2rem; /* More horizontal padding */
	}

	.navigation {
		display: flex;
		justify-content: space-between;
		align-items: center; /* Vertically align items */
		margin-bottom: 2.5rem; /* More space below nav */
		padding-bottom: 1rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.nav-left {
		/* For welcome text */
	}

	.nav-right {
		display: flex;
		gap: 0.8rem; /* Slightly adjust gap */
	}

	.nav-btn {
		padding: 0.6rem 1.2rem; /* Slightly larger buttons */
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 5px; /* Slightly more rounded */
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s ease, transform 0.1s ease;
	}
	.nav-btn:hover {
		background: #5a6268;
		transform: translateY(-1px);
	}
	.nav-btn:active {
		transform: translateY(0px);
	}

	.profile-btn {
		background: #007bff;
	}
	.profile-btn:hover {
		background: #0056b3;
	}
	.logout-btn {
		background: #dc3545;
	}
	.logout-btn:hover {
		background: #c82333;
	}


	h1 {
		text-align: center;
		color: #333;
		margin-bottom: 2.5rem;
	}

	.university-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* Slightly wider cards */
		gap: 1.8rem; /* Adjust gap */
	}

	.university-card {
		background: white;
		border-radius: 8px;
		padding: 1.8rem; /* More padding inside card */
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08); /* Softer shadow */
		transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
		cursor: pointer;
		border: 1px solid #e9ecef; /* Subtle border */
		display: flex; /* Use flexbox for layout */
		flex-direction: column; /* Stack items vertically */
	}

	.university-card:hover {
		transform: translateY(-6px); /* Lift effect */
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12); /* Stronger shadow on hover */
	}

	.university-card h2 {
		margin: 0 0 1.2rem 0;
		color: #2c3e50;
		font-size: 1.6rem; /* Larger title */
		border-bottom: 1px solid #eee; /* Separator */
		padding-bottom: 0.8rem;
	}

	.college-list {
		margin-bottom: 1rem;
		flex-grow: 1; /* Allow list to take available space */
	}

	.college-list h3 {
		color: #666;
		font-size: 1rem;
		margin-bottom: 0.6rem;
		font-weight: 600;
	}

	.college-list ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.college-list li {
		color: #495057;
		padding: 0.3rem 0; /* Adjust padding */
		font-size: 0.95rem; /* Slightly larger */
		border-bottom: 1px dashed #f0f0f0; /* Subtle separator for items */
	}
	.college-list li:last-child {
		border-bottom: none;
	}

	.department-count {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e0e0e0;
		color: #007bff;
		font-weight: bold;
		text-align: right; /* Align count to the right */
		font-size: 0.9rem;
	}

	.error {
		color: #dc3545;
		text-align: center;
		margin: 2rem 0; /* Space around error */
		padding: 1rem;
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 4px;
	}


	.welcome-text {
		color: #495057; /* Darker welcome text */
		font-size: 1.1rem;
		font-weight: 500;
	}
</style>
