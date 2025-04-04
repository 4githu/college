<script lang="ts">
	// No longer need specific store imports for component state in Svelte 5
	import { goto } from '$app/navigation'; // Keep if used, remove if not (logout uses window.location)
	import type { PageData } from './$types'; // Import type for props for better safety

	// --- Props ---
	// Use $props() rune to get data passed from the load function
	let { data }: { data: PageData } = $props(); // Destructure data and apply type

	// --- State ---
	// Use $state() rune for reactive component state
	let activeTab = $state('universities');
	let isAddingUniversity = $state(false);
	let isAddingCollege = $state(false);
	let isAddingDepartment = $state(false);
	// Consider defining more specific types if available instead of any
	let selectedUniversity = $state<any>(null);
	let selectedCollege = $state<any>(null);

	// State for the "add university" form
	let newUniversity = $state({
		name: ''
	});

	// State for the "add college" form
	let newCollege = $state({
		name: '',
		universityId: ''
	});

	// State for the "add department" form
	let newDepartment = $state({
		name: '',
		capacity: 0, // Default to number
		collegeId: ''
	});

	// State for CSV Upload
	let csvFile = $state<File | null>(null);
	let isUploading = $state(false);
	// Define a clearer type for uploadResult if possible
	let uploadResult = $state<{ success: boolean; message: string; data: any | null }>({
		success: false,
		message: '',
		data: null
	});

	// --- Event Handlers & Logic ---
	// Functions remain largely the same, but they now update $state variables

	async function handleLogout() {
		try {
			const response = await fetch('/api/logout', {
				method: 'POST'
			});

			if (response.ok) {
				// Use window.location for full page navigation after server action
				window.location.href = '/';
				// Alternatively, if it were pure client-side nav: await goto('/');
			} else {
				console.error('Logout failed:', response.status);
				// Handle logout failure (e.g., show message)
			}
		} catch (error) {
			console.error('Logout error:', error);
			// Handle network or other errors
		}
	}

	// --- Add/Delete Functions ---
	// NOTE: Using window.location.reload() after each action works but is inefficient.
	// A better approach in a real app would be to update the `data` prop reactively
	// or fetch the updated list without a full page reload.
	// However, sticking to the original logic for this conversion.

	async function addUniversity() {
		// Basic validation
		if (!newUniversity.name.trim()) {
			alert('대학교 이름을 입력하세요.');
			return;
		}
		try {
			const response = await fetch('/api/admin/universities', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newUniversity)
			});

			if (response.ok) {
				isAddingUniversity = false;
				newUniversity.name = ''; // Reset form
				window.location.reload(); // Reload to see changes (as per original logic)
			} else {
				console.error('Failed to add university:', response.status);
				alert(`대학 추가 실패: ${response.statusText}`);
			}
		} catch (error) {
			console.error('Error adding university:', error);
			alert('대학 추가 중 오류 발생');
		}
	}

	async function addCollege() {
		if (!newCollege.name.trim() || !newCollege.universityId) {
			alert('단과대학 이름과 대상 대학을 확인하세요.');
			return;
		}
		try {
			const response = await fetch('/api/admin/colleges', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newCollege)
			});

			if (response.ok) {
				isAddingCollege = false;
				newCollege.name = ''; // Reset form part
				// Keep universityId if user might add another to the same uni
				window.location.reload();
			} else {
				console.error('Failed to add college:', response.status);
				alert(`단과대학 추가 실패: ${response.statusText}`);
			}
		} catch (error) {
			console.error('Error adding college:', error);
			alert('단과대학 추가 중 오류 발생');
		}
	}

	async function addDepartment() {
		if (!newDepartment.name.trim() || newDepartment.capacity <= 0 || !newDepartment.collegeId) {
			alert('학과 이름, 정원(0보다 커야 함), 대상 단과대학을 확인하세요.');
			return;
		}
		try {
			// Ensure capacity is sent as a number
			const payload = { ...newDepartment, capacity: Number(newDepartment.capacity) || 0 };

			const response = await fetch('/api/admin/departments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				isAddingDepartment = false;
				// Reset form fully
				newDepartment = { name: '', capacity: 0, collegeId: '' };
				window.location.reload();
			} else {
				console.error('Failed to add department:', response.status);
				alert(`학과 추가 실패: ${response.statusText}`);
			}
		} catch (error) {
			console.error('Error adding department:', error);
			alert('학과 추가 중 오류 발생');
		}
	}

	async function deleteUniversity(id: string) {
		if (!confirm('정말로 이 대학과 관련된 모든 단과대학/학과 정보를 삭제하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/admin/universities/${id}`, { method: 'DELETE' });
			if (response.ok) {
				window.location.reload();
			} else {
				console.error('Failed to delete university:', response.status);
				alert(`대학 삭제 실패: ${response.statusText}`);
			}
		} catch (error) {
			console.error('Error deleting university:', error);
			alert('대학 삭제 중 오류 발생');
		}
	}

	async function deleteCollege(id: string) {
		if (!confirm('정말로 이 단과대학과 관련된 모든 학과 정보를 삭제하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/admin/colleges/${id}`, { method: 'DELETE' });
			if (response.ok) {
				window.location.reload();
			} else {
				console.error('Failed to delete college:', response.status);
				alert(`단과대학 삭제 실패: ${response.statusText}`);
			}
		} catch (error) {
			console.error('Error deleting college:', error);
			alert('단과대학 삭제 중 오류 발생');
		}
	}

	async function deleteDepartment(id: string) {
		if (!confirm('정말로 이 학과를 삭제하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/admin/departments/${id}`, { method: 'DELETE' });
			if (response.ok) {
				window.location.reload();
			} else {
				console.error('Failed to delete department:', response.status);
				alert(`학과 삭제 실패: ${response.statusText}`);
			}
		} catch (error) {
			console.error('Error deleting department:', error);
			alert('학과 삭제 중 오류 발생');
		}
	}

	// --- CSV Upload Logic ---
	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			csvFile = target.files[0]; // Assign to $state variable
		} else {
			csvFile = null;
		}
	}

	async function uploadCSV() {
		if (!csvFile) {
			alert('CSV 파일을 선택해주세요.');
			return;
		}

		isUploading = true;
		uploadResult = { success: false, message: '', data: null }; // Reset result

		try {
			const formData = new FormData();
			formData.append('csv', csvFile);

			const response = await fetch('/api/admin/import-csv', {
				method: 'POST',
				body: formData
				// Content-Type is set automatically by browser for FormData
			});

			const result = await response.json(); // Assume API returns JSON always

			if (response.ok) {
				uploadResult = {
					success: true,
					message: `성공적으로 업로드 되었습니다. ${result.added || 0} 개의 항목이 추가되었습니다.`, // Safely access result.added
					data: result
				};
				csvFile = null; // Clear the file input state
				// Clear the actual file input visually if needed (more complex DOM manipulation or re-render)
				const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
				if (fileInput) fileInput.value = ''; // Reset file input

				// Reload after a short delay to show the message
				setTimeout(() => window.location.reload(), 2000);
			} else {
				// Use message from API response if available
				uploadResult = {
					success: false,
					message: result.message || '업로드 중 오류가 발생했습니다.',
					data: null
				};
			}
		} catch (error) {
			console.error('CSV 업로드 오류:', error);
			uploadResult = {
				success: false,
				message: '업로드 중 네트워크 또는 처리 오류가 발생했습니다.',
				data: null
			};
		} finally {
			isUploading = false; // Ensure this always runs
		}
	}
</script>

<!-- HTML Markup remains the same -->
<!-- It now reads from $state variables and $props derived data -->
<!-- bind:value works directly with $state variables/properties -->

<div class="admin-dashboard">
	<nav class="navigation">
		<div class="nav-right">
			<button class="logout-btn" on:click={handleLogout}> 로그아웃 </button>
		</div>
	</nav>

	<h1>관리자 페이지</h1>

	<nav class="tabs">
		<button class:active={activeTab === 'universities'} on:click={() => (activeTab = 'universities')}>
			대학/학과 관리
		</button>
		<button class:active={activeTab === 'users'} on:click={() => (activeTab = 'users')}>
			사용자 관리
		</button>
	</nav>

	{#if activeTab === 'universities'}
		<div class="universities-section">
			<!-- CSV Import Section -->
			<div class="csv-import-section">
				<div class="section-header">
					<h2>CSV 일괄 등록</h2>
				</div>

				<div class="csv-upload-container">
					<div class="upload-instructions">
						<p>대학, 단과대학, 학과 정보를 CSV 파일로 일괄 등록할 수 있습니다.</p>
						<p>CSV 파일 형식: UTF-8 인코딩, 쉼표(,) 구분</p>
						<p>헤더(첫 줄): "대학", "단과대학", "학과", "정원"</p>
					</div>

					<div class="file-upload">
						<input type="file" accept=".csv" on:change={handleFileChange} id="csv-upload" />
						<button class="upload-btn" on:click={uploadCSV} disabled={!csvFile || isUploading}>
							{#if isUploading}업로드 중...{:else}CSV 파일 업로드{/if}
						</button>
					</div>

					{#if uploadResult.message}
						<div
							class="upload-result"
							class:success={uploadResult.success}
							class:error={!uploadResult.success}
						>
							{uploadResult.message}
						</div>
					{/if}
				</div>
			</div>

			<!-- University Management Section -->
			<div class="section-header">
				<h2>대학교 관리</h2>
				<button class="add-btn" on:click={() => (isAddingUniversity = true)}> 새 대학 추가 </button>
			</div>

			{#if isAddingUniversity}
				<div class="add-form">
					<input type="text" bind:value={newUniversity.name} placeholder="대학교 이름" />
					<button on:click={addUniversity}>추가</button>
					<button on:click={() => (isAddingUniversity = false)}>취소</button>
				</div>
			{/if}

			{#each data.universities as university (university.id)}
				<div class="university-card">
					<div class="card-header">
						<h3>{university.name}</h3>
						<button class="delete-btn" on:click={() => deleteUniversity(university.id)}>삭제</button>
					</div>

					<div class="college-section">
						<div class="section-header">
							<h4>단과대학</h4>
							<button
								class="add-btn small"
								on:click={() => {
									// Set context for adding college
									newCollege.universityId = university.id;
									newCollege.name = ''; // Clear name field
									isAddingCollege = true;
									// Optionally reset other forms
									isAddingDepartment = false;
								}}
							>
								단과대학 추가
							</button>
						</div>

						{#if isAddingCollege && newCollege.universityId === university.id}
							<div class="add-form">
								<input type="text" bind:value={newCollege.name} placeholder="단과대학 이름" />
								<button on:click={addCollege}>추가</button>
								<button on:click={() => (isAddingCollege = false)}>취소</button>
							</div>
						{/if}

						{#each university.colleges as college (college.id)}
							<div class="college-card">
								<div class="card-header">
									<h5>{college.name}</h5>
									<button class="delete-btn small" on:click={() => deleteCollege(college.id)}
										>삭제</button
									>
								</div>

								<div class="department-section">
									<div class="section-header">
										<h6>학과</h6>
										<button
											class="add-btn small"
											on:click={() => {
												// Set context for adding department
												newDepartment.collegeId = college.id;
												newDepartment.name = ''; // Clear form fields
												newDepartment.capacity = 0;
												isAddingDepartment = true;
												// Optionally reset other forms
												isAddingCollege = false;
											}}
										>
											학과 추가
										</button>
									</div>

									{#if isAddingDepartment && newDepartment.collegeId === college.id}
										<div class="add-form">
											<input type="text" bind:value={newDepartment.name} placeholder="학과 이름" />
											<input
												type="number"
												bind:value={newDepartment.capacity}
												placeholder="정원"
												min="1"
											/>
											<button on:click={addDepartment}>추가</button>
											<button on:click={() => (isAddingDepartment = false)}>취소</button>
										</div>
									{/if}

									<table>
										<thead>
											<tr>
												<th>학과명</th>
												<th>정원</th>
												<!-- <th>현재 지원자</th> If currentApplications exists -->
												<th>작업</th>
											</tr>
										</thead>
										<tbody>
											{#each college.departments as dept (dept.id)}
												<tr>
													<td>{dept.name}</td>
													<td>{dept.capacity}</td>
													<!-- <td>{dept.currentApplications ?? 0}</td> Assuming it might not exist -->
													<td>
														<button
															class="delete-btn small"
															on:click={() => deleteDepartment(dept.id)}
														>
															삭제
														</button>
													</td>
												</tr>
											{:else}
												<tr>
													<td colspan="3">등록된 학과가 없습니다.</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{:else}
							<p>등록된 단과대학이 없습니다.</p>
						{/each}
					</div>
				</div>
			{:else}
				<p>등록된 대학이 없습니다.</p>
			{/each}
		</div>
	{:else if activeTab === 'users'}
		<div class="users-section">
			<h2>사용자 관리</h2>
			{#if data.users && data.users.length > 0}
				<table>
					<thead>
						<tr>
							<th>이메일</th>
							<th>이름</th>
							<th>가입일</th>
							<th>인증상태</th>
							<th>평균학점</th> <!-- Assuming overall_gpa means this -->
						</tr>
					</thead>
					<tbody>
						{#each data.users as user (user.id)}
							<tr>
								<td>{user.email}</td>
								<td>{user.name ?? '-'}</td>
								<td>{new Date(user.createdAt).toLocaleDateString()}</td>
								<td>{user.isVerified ? '인증됨' : '미인증'}</td>
								<td>{user.overall_gpa ?? '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p>등록된 사용자가 없습니다.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Add your existing styles here - they don't need to change for Svelte 5 */
	.admin-dashboard {
		padding: 2rem;
		font-family: sans-serif;
	}
	.navigation {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1rem;
	}
	.logout-btn {
		padding: 0.5rem 1rem;
		cursor: pointer;
	}
	.tabs {
		margin-bottom: 2rem;
		border-bottom: 1px solid #ccc;
	}
	.tabs button {
		padding: 0.8rem 1.5rem;
		cursor: pointer;
		border: none;
		background-color: transparent;
		border-bottom: 3px solid transparent;
		margin-bottom: -1px; /* Align border */
	}
	.tabs button.active {
		border-bottom-color: blue;
		font-weight: bold;
	}
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.add-btn,
	.delete-btn,
	.upload-btn {
		padding: 0.4rem 0.8rem;
		cursor: pointer;
	}
	.add-btn.small,
	.delete-btn.small {
		padding: 0.2rem 0.5rem;
		font-size: 0.8em;
	}
	.add-form {
		background-color: #f9f9f9;
		padding: 1rem;
		margin-bottom: 1rem;
		border: 1px solid #eee;
		border-radius: 4px;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.add-form input {
		padding: 0.5rem;
		flex-grow: 1;
	}
	.add-form button {
		padding: 0.5rem 1rem;
	}

	.university-card,
	.college-card {
		border: 1px solid #ddd;
		border-radius: 4px;
		margin-bottom: 1.5rem;
		padding: 1rem;
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #eee;
		padding-bottom: 0.5rem;
		margin-bottom: 1rem;
	}
	.college-section,
	.department-section {
		margin-top: 1rem;
		padding-left: 1rem;
		border-left: 2px solid #eee;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	th,
	td {
		border: 1px solid #ddd;
		padding: 0.5rem;
		text-align: left;
	}
	th {
		background-color: #f2f2f2;
	}
	.csv-import-section {
		background-color: #eef;
		padding: 1.5rem;
		border-radius: 5px;
		margin-bottom: 2rem;
	}
	.csv-upload-container {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.upload-instructions {
		font-size: 0.9em;
		color: #333;
	}
	.file-upload {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.upload-result {
		margin-top: 1rem;
		padding: 0.8rem;
		border-radius: 4px;
	}
	.upload-result.success {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}
	.upload-result.error {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
