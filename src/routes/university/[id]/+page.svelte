<script lang="ts">
	// Removed: import { onMount } from 'svelte';
	// Removed: import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	// Assume user & loadUser are Svelte 5 compatible ($state export / update)
	import { user, loadUser } from '$lib/auth';
	import type { University, College, Department } from '$lib/types';
	import type { PageData } from './$types'; // For prop type safety

	// --- Props ---
	// Get universityId passed from the load function
	let { universityId }: PageData = $props();

	// --- State ---
	// Use $state for reactive component variables
	let university = $state<University | null>(null);
	let selectedCollege = $state<College | null>(null);
	let errorMessage = $state('');
	let userApplications = $state<{ departmentId: string }[]>([]); // User's current applications
	let isLoading = $state(true); // Combined loading state

	// --- Effects ---
	// Effect for initialization and data loading based on universityId and user state
	$effect(() => {
		const initialize = async () => {
			isLoading = true;
			errorMessage = '';
			university = null; // Reset university data on ID change
			selectedCollege = null; // Reset selected college
			userApplications = []; // Reset user applications

			try {
				// Load user data first (can run concurrently with university data if independent)
				await loadUser();

				// Redirect immediately if user is not logged in after loadUser completes
				if (!user) {
					console.log('User not logged in, redirecting...');
					goto('/login', { replaceState: true });
					return; // Stop further execution in this effect run
				}

				// Load University Data and User Applications concurrently
				await Promise.all([
				    loadUniversityData(universityId), // Pass the ID from props
				    loadUserApplications(user.email) // Pass user email
                ]);


				// Post-load logic: Select college based on URL or default
				if (university && university.colleges.length > 0) {
					const savedCollegeId = getSelectedCollegeFromUrl(); // Check URL first
					let collegeToSelect = null;
					if (savedCollegeId) {
						collegeToSelect = university.colleges.find(c => c.id === savedCollegeId) || null;
					}
					// If no valid saved ID, default to the first college
					if (!collegeToSelect) {
						collegeToSelect = university.colleges[0];
						// Update URL only if we defaulted (and didn't load from URL)
						if (collegeToSelect) updateUrlWithCollege(collegeToSelect.id, false);
					}
                    selectedCollege = collegeToSelect;
				} else {
				    selectedCollege = null; // Ensure selectedCollege is null if no colleges
				}

			} catch (err: any) {
				console.error('Initialization failed:', err);
				errorMessage = err.message || '데이터 로딩 중 오류가 발생했습니다.';
			} finally {
				isLoading = false;
			}
		};

		// Run initialization when universityId changes or component mounts
		initialize();
	});


	// --- Data Fetching Functions ---
	async function loadUniversityData(id: string) {
		console.log(`Fetching university data for ID: ${id}`);
		const response = await fetch(`/api/universities/${id}`); // Use ID from props
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ message: `대학교 정보 로딩 실패 (${response.status})` }));
			throw new Error(errorData.message);
		}
		const data: University = await response.json();
		university = data; // Update $state
		console.log('University data loaded:', university);
	}

	async function loadUserApplications(userEmail: string | undefined) {
        if (!userEmail) {
            userApplications = []; // Clear if no email
            return; // Or throw error? Depends on whether this is expected
        }
		console.log(`Fetching applications for user: ${userEmail}`);
		const response = await fetch(`/api/applications/user?email=${encodeURIComponent(userEmail)}`);
		if (!response.ok) {
		    // Don't throw here, maybe user just has no applications yet or API handles it
			console.error('Failed to load user applications:', response.status);
            userApplications = []; // Set empty on failure
		} else {
		    const data = await response.json();
		    userApplications = data || []; // Update $state, ensure it's an array
        }
        console.log('User applications loaded:', userApplications);
	}


    // --- Polling for Application Count Changes ---
    // NOTE: This polling approach is inefficient. Server-Sent Events (SSE) or WebSockets
    // are much better for real-time updates. This implementation is kept closer to
    // the original but with proper cleanup using $effect.
    $effect(() => {
        // Only run if a college is selected
        if (!selectedCollege) {
            return; // Do nothing if no college is selected
        }

        console.log(`Setting up polling for college: ${selectedCollege.name}`);
        const departmentIds = selectedCollege.departments.map(d => d.id);
        const intervalIds: NodeJS.Timeout[] = [];
        let previousCounts: { [key: string]: number } = {};

        // Initial fetch of counts
        const fetchInitialCounts = async () => {
             try {
                 // Example: Fetch counts via a dedicated endpoint if available
                 // Or iterate fetches like below (less efficient)
                 for (const deptId of departmentIds) {
                     const res = await fetch(`/api/applications/count?departmentId=${deptId}`); // Needs API endpoint
                     if (res.ok) {
                         const data = await res.json();
                         previousCounts[deptId] = data.count;
                     }
                 }
             } catch(e) { console.error("Error fetching initial counts", e)}
        }
        fetchInitialCounts();


        // Set up intervals for each department in the selected college
        departmentIds.forEach(deptId => {
            const intervalId = setInterval(async () => {
                try {
                     // Example: Fetch counts via a dedicated endpoint if available
                     // Or fetch full applications (less efficient just for count)
                    const response = await fetch(`/api/applications/count?departmentId=${deptId}`); // Needs API endpoint
                    if (response.ok) {
                        const data = await response.json();
                        const newCount = data.count;

                        if (previousCounts[deptId] !== undefined && newCount !== previousCounts[deptId]) {
                            console.log(`Change detected for ${deptId}: ${previousCounts[deptId]} -> ${newCount}`);
                             // Consider a less disruptive update mechanism than confirm+reload
                            if (confirm(`'${selectedCollege?.departments.find(d=>d.id === deptId)?.name}' 학과 지원자 수가 변경되었습니다. 새로고침하시겠습니까?`)) {
                                window.location.reload();
                            } else {
                                // User chose not to reload, update count locally?
                                // Or just update previousCount to prevent repeated confirms
                                previousCounts[deptId] = newCount;
                            }
                        } else if (previousCounts[deptId] === undefined) {
                             previousCounts[deptId] = newCount; // Store first fetched count
                        }
                    }
                } catch (error) {
                    console.error(`Failed to check for updates for department ${deptId}:`, error);
                    // Optionally stop polling for this department if errors persist
                }
            }, 15000); // Poll every 15 seconds (adjust as needed)
            intervalIds.push(intervalId);
        });

        // Cleanup function: Clear all intervals when selectedCollege changes or component unmounts
        return () => {
            console.log(`Cleaning up polling for previous college.`);
            intervalIds.forEach(clearInterval);
        };
    });


	// --- UI Logic Functions ---
	// (getStatusColor, getStatusText remain the same)
    function getStatusColor(applicationCount: number | undefined, capacity: number | undefined): string {
		const currentNum = Number(applicationCount ?? 0);
		const capacityNum = Number(capacity ?? 1); // Avoid division by zero
		if (capacityNum <= 0) return '#808080'; // Grey if capacity is invalid

		const ratio = currentNum / capacityNum;

		// console.log(`StatusColor - Apps: ${currentNum}, Cap: ${capacityNum}, Ratio: ${ratio}`); // Debug log

		if (ratio >= 1.0) return '#FF0000'; // 100%+: Red
		if (ratio >= 0.9) return '#FF4500'; // 90%+: OrangeRed
		if (ratio >= 0.7) return '#FFA500'; // 70%+: Orange
		if (ratio >= 0.5) return '#FFD700'; // 50%+: Gold
		if (ratio >= 0.3) return '#90EE90'; // 30%+: LightGreen
		return '#32CD32'; // Below 30%: LimeGreen
	}

	function getStatusText(applicationCount: number | undefined, capacity: number | undefined): string {
		const currentNum = Number(applicationCount ?? 0);
		const capacityNum = Number(capacity ?? 1);
		if (capacityNum <= 0) return '정보 없음';

		const ratio = currentNum / capacityNum;

		if (ratio >= 1.0) return '마감';
		if (ratio >= 0.9) return '마감 임박';
		if (ratio >= 0.7) return '경쟁 높음';
		if (ratio >= 0.5) return '보통';
		return '여유';
	}

	// --- URL Management ---
	// (Minor update to handle potential null window object during SSR, although unlikely needed here)
	function getSelectedCollegeFromUrl(): string | null {
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			return url.searchParams.get('college');
		}
		return null;
	}

	function updateUrlWithCollege(collegeId: string, navigate = true) {
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('college', collegeId);
			// Use replaceState to avoid adding to browser history for simple tab changes
			window.history.replaceState({}, '', url.toString());
		}
	}

	// --- Event Handlers ---
	function handleCollegeSelect(college: College) {
		selectedCollege = college; // Update $state
		updateUrlWithCollege(college.id); // Update URL
	}

	async function handleApply(departmentId: string) {
		if (!user) {
			alert('로그인이 필요합니다.');
			goto('/login');
			return;
		}

		const isApplied = userApplications.some(app => app.departmentId === departmentId);
		const action = isApplied ? 'DELETE' : 'POST';
		const url = action === 'DELETE'
		    ? `/api/applications?id=${departmentId}&userEmail=${encodeURIComponent(user.email)}`
		    : '/api/applications';

        errorMessage = ''; // Clear previous errors

		try {
			const response = await fetch(url, {
				method: action,
				headers: action === 'POST' ? { 'Content-Type': 'application/json' } : {},
				body: action === 'POST' ? JSON.stringify({ departmentId, userEmail: user.email }) : null,
				credentials: 'include' // If using cookies/session auth
			});

			const responseData = await response.json().catch(() => ({ error: '응답 처리 실패' }));

			if (!response.ok) {
				throw new Error(responseData.error || '처리에 실패했습니다.');
			}

			// Success: Refresh data instead of full page reload for better UX
			// Re-fetch user applications and the university data (which might include updated counts/lists)
			isLoading = true; // Show loading indicator
			await Promise.all([
                loadUserApplications(user.email),
                loadUniversityData(universityId) // Reload university data to get fresh counts/lists
            ]).then(() => {
                 // Ensure selectedCollege object is updated if university data structure changed
                 if (university && selectedCollege) {
                    const refreshedCollege = university.colleges.find(c => c.id === selectedCollege?.id);
                    if (refreshedCollege) selectedCollege = refreshedCollege;
                 }
            });

		} catch (error: any) {
			console.error('Application error:', error);
			errorMessage = error.message || '서버 오류가 발생했습니다.'; // Show error to user
		} finally {
		    isLoading = false; // Hide loading indicator
		}
	}

	// (handleLogout remains the same)
	async function handleLogout() {
		try {
			const response = await fetch('/api/logout', { method: 'POST' });
			if (response.ok) {
				window.location.href = '/'; // Force reload to clear state
			}
		} catch (error) {
			console.error('Logout error:', error);
		}
	}

    // Debugging derived state (optional)
    // let departmentCount = $derived(selectedCollege?.departments?.length ?? 0);
    // $effect(() => console.log("Selected college department count:", departmentCount))

</script>

<div class="container" class:loading={isLoading}> {# Add loading class #}
	<nav class="navigation">
		<div class="nav-left">
			<button class="nav-btn" on:click={() => goto('/selection')}> 뒤로가기 </button>
		</div>
		<div class="nav-right">
			{#if user}
				<button class="nav-btn profile-btn" on:click={() => goto('/profile')}>
					{user.name || '프로필'}
				</button>
				<button class="nav-btn logout-btn" on:click={handleLogout}> 로그아웃 </button>
			{:else}
			    <button class="nav-btn" on:click={() => goto('/login')}> 로그인 </button>
			{/if}
		</div>
	</nav>

	{#if isLoading && !university} {# Show initial loading state #}
		<p>Loading University Data...</p>
	{:else if errorMessage}
		<p class="error">{errorMessage}</p>
	{:else if university}
		<h1>{university.name}</h1>

		{#if university.colleges && university.colleges.length > 0}
			<div class="college-nav">
				{#each university.colleges as college (college.id)}
					<button
						class="college-btn"
						class:active={selectedCollege?.id === college.id}
						on:click={() => handleCollegeSelect(college)}
						disabled={isLoading} {# Disable while loading #}
					>
						{college.name}
					</button>
				{/each}
			</div>
		{:else}
		    <p>이 대학교에는 등록된 단과대학이 없습니다.</p>
		{/if}


		{#if selectedCollege}
			<h2>{selectedCollege.name} 학과 목록</h2>
			{#if selectedCollege.departments && selectedCollege.departments.length > 0}
			<div class="departments-grid">
				{#each selectedCollege.departments as department (department.id)}
					{@const applicationCount = department._count?.applications ?? 0}
					{@const capacity = department.capacity ?? 0}
					{@const isApplied = userApplications.some(app => app.departmentId === department.id)}
					<div class="department-card">
						<h3
						    style="border-left: 8px solid {getStatusColor(applicationCount, capacity)}; padding-left: 10px;"
						    title={getStatusText(applicationCount, capacity)}
                        >
							{department.name}
                            <br/>
                            <span class="department-stats">({applicationCount} / {capacity}) - {getStatusText(applicationCount, capacity)}</span>
						</h3>
						<button
							class="apply-btn {isApplied ? 'cancel-btn' : ''}"
							on:click={() => handleApply(department.id)}
							disabled={isLoading} {# Disable button during any loading state #}
						>
							{isApplied ? '신청 취소' : '신청하기'}
						</button>

						<!-- Applicant List Display -->
						<div class="applicant-list">
							<h4>지원자 목록 (GPA)</h4>
							{#if department.applications && department.applications.length > 0}
								<ul>
									{#each department.applications as application (application.id)}
										<li class:current-user={application.user?.email === user?.email}>
                                            {application.user?.overall_gpa?.toFixed(2) ?? 'N/A'}
                                            {#if application.user?.email === user?.email} (나){/if}
                                        </li>
									{/each}
								</ul>
							{:else}
								<p class="no-applicants">아직 지원자가 없습니다.</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			{:else}
			    <p>이 단과대학에는 등록된 학과가 없습니다.</p>
			{/if}
		{:else if university && university.colleges.length > 0}
		    <p>단과대학을 선택해주세요.</p> {# Prompt if colleges exist but none selected #}
		{/if}

    {:else if !isLoading} {# If not loading and university is still null #}
        <p>대학교 정보를 찾을 수 없습니다.</p>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 1rem;
		transition: opacity 0.3s ease; /* Transition for loading */
	}
	.container.loading {
		opacity: 0.7;
		pointer-events: none; /* Prevent interaction while loading overlay */
	}


	.navigation {
		display: flex;
		justify-content: space-between;
        align-items: center;
		margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
	}

	.nav-right {
		display: flex;
		gap: 1rem;
	}

	.nav-btn {
		padding: 0.6rem 1.2rem;
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
        font-size: 0.9rem;
		transition: background-color 0.2s ease;
	}
    .nav-btn:hover {
		background: #5a6268;
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
		margin-bottom: 1rem;
        color: #333;
	}
    h2 {
        text-align: center;
        margin-top: 2rem;
        margin-bottom: 1rem;
        color: #555;
        font-weight: 500;
    }


	.college-nav {
		display: flex;
		gap: 0.8rem; /* Reduce gap */
		margin: 1.5rem 0;
		padding: 0.8rem; /* Reduce padding */
		background: #f8f9fa;
		border-radius: 8px;
		overflow-x: auto; /* Enable horizontal scroll on overflow */
		scrollbar-width: thin; /* Firefox */
	}
    /* Webkit scrollbar styling (optional) */
    .college-nav::-webkit-scrollbar {
        height: 6px;
    }
    .college-nav::-webkit-scrollbar-thumb {
        background-color: #ccc;
        border-radius: 3px;
    }

	.college-btn {
		padding: 0.6rem 1rem; /* Adjust padding */
		border: 1px solid transparent; /* Add border for consistent size */
		border-radius: 5px;
		cursor: pointer;
		background: #e9ecef;
		color: #495057;
		white-space: nowrap; /* Prevent button text wrapping */
		font-size: 0.9rem;
		transition: background-color 0.2s, color 0.2s, border-color 0.2s;
	}
    .college-btn:hover {
        background-color: #d1d5db;
    }
	.college-btn.active {
		background: #007bff;
		color: white;
		border-color: #0056b3;
	}
    .college-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

	.departments-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* Adjust min size */
		gap: 1.5rem; /* Adjust gap */
		margin-top: 2rem;
	}

	.department-card {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1); /* Subtle shadow */
		display: flex;
        flex-direction: column;
        transition: box-shadow 0.2s ease;
	}
    .department-card:hover {
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    }

	.department-card h3 {
		margin: 0 0 1rem 0;
		color: #343a40; /* Darker heading */
        /* Border handled by inline style now */
		border-radius: 0; /* Remove radius if using border-left */
		text-align: left;
        font-size: 1.2rem;
        line-height: 1.4;
	}
    .department-stats {
        font-size: 0.9rem;
        color: #6c757d;
        font-weight: normal;
    }

	.apply-btn {
		width: 100%;
		padding: 0.7rem 1rem; /* Adjust padding */
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		margin-bottom: 1rem;
		font-size: 0.95rem;
		font-weight: 500;
		transition: background-color 0.2s ease, opacity 0.2s ease;
        background-color: #28a745; /* Default Green */
	}
	.apply-btn:hover:not(:disabled) {
		filter: brightness(90%); /* Darken slightly on hover */
	}
    .apply-btn.cancel-btn {
		background-color: #dc3545; /* Red for cancel */
	}

	.apply-btn:disabled {
		background-color: #adb5bd; /* Grey disabled */
        opacity: 0.7;
		cursor: not-allowed;
	}

	.applicant-list {
		margin-top: 1rem;
        padding: 0.8rem; /* Add padding */
		background-color: #f8f9fa; /* Light background */
		border: 1px solid #e9ecef;
		border-radius: 4px;
        flex-grow: 1; /* Allow list to grow */
        max-height: 200px; /* Limit height */
        overflow-y: auto; /* Add scroll if needed */
	}

	.applicant-list h4 {
		margin: 0 0 0.6rem 0; /* Adjust margin */
		font-size: 0.9rem;
		color: #495057;
        font-weight: 600;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 0.4rem;
	}

	.applicant-list ul {
		list-style: decimal inside; /* Use numbers */
		padding: 0 0 0 0.5rem; /* Indent list slightly */
		margin: 0;
	}

	.applicant-list li {
		padding: 0.3rem 0; /* Adjust padding */
		font-size: 0.9rem;
        color: #333;
        border-bottom: 1px dashed #eee;
	}
    .applicant-list li:last-child {
        border-bottom: none;
    }
    .applicant-list .no-applicants {
        font-style: italic;
        color: #6c757d;
        text-align: center;
        padding: 1rem 0;
    }


	.error {
		color: #721c24;
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
		padding: 1rem;
		border-radius: 5px;
		text-align: center;
		margin: 1.5rem 0;
	}

	.current-user {
		background-color: #cfe2ff !important; /* Bootstrap info background */
		color: #052c65 !important; /* Bootstrap info text */
		font-weight: bold;
        padding-left: 0.5rem; /* Add padding for emphasis */
        border-radius: 3px;
	}
</style>
