// No longer need 'writable' from 'svelte/store' in Svelte 5 for basic state
// import { writable } from 'svelte/store';

// 사용자 타입 정의 (User type definition) - No changes needed here
type User = {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
} | null;

// 사용자 스토어 생성 (Create user state using $state rune)
// We use $state for reactive state variable.
// 'export let' is used for props in components, for exporting state from a module,
// we typically define it and then export it. A simple export const works well here.
export const user = $state<User>(null);

/**
 * Fetches user data from the API and updates the user state.
 */
export async function loadUser() {
    try {
        // Assuming '/api/me' is your endpoint to get the current user session
        const response = await fetch('/api/me');
        if (response.ok) {
            const userData: User = await response.json();
            // Update state using direct assignment in Svelte 5
            user = userData;
        } else {
            console.log('No active user session found or API error:', response.status);
            // Update state using direct assignment
            user = null;
        }
    } catch (error) {
        console.error('Error loading user:', error);
        // Update state using direct assignment
        user = null;
    }
}

/**
 * Validates if an email belongs to the specified domain.
 * @param email The email string to validate.
 * @returns True if the email ends with '@djshs.djsch.kr', false otherwise.
 */
export function validateEmail(email: string): boolean {
    // Basic validation logic - No changes needed based on Svelte version
    if (!email) return false; // Handle null/undefined/empty string case
    return email.endsWith('@djshs.djsch.kr');
}

/**
 * Placeholder function to initiate Google Sign-In flow.
 * Note: Actual implementation requires an OAuth library or service.
 */
export async function signInWithGoogle() {
    console.log('Initiating Google Sign-In...');
    // Google OAuth implementation would go here.
    // Consider using libraries like Lucia Auth, Auth.js (SvelteKit adapter),
    // Supabase Auth, or Firebase Auth for robust authentication.
    // This function itself doesn't change based on Svelte version,
    // but how you handle the result (updating the 'user' state) uses the Svelte 5 pattern.
    // Example after successful sign-in:
    // const loggedInUserData = await performGoogleSignInAndGetUser();
    // if (loggedInUserData) {
    //   user = loggedInUserData; // Update state directly
    // }
}

// --- How to use this in a Svelte 5 component (.svelte file) ---
/*
<script lang="ts">
	import { user, loadUser, signInWithGoogle } from './userStore'; // Adjust path as needed

	// Load user data when the component mounts using $effect rune
	$effect(() => {
		loadUser();
	});
</script>

{#if user}
	<p>Welcome, {user.name} ({user.email})!</p>
	{#if user.isAdmin}
		<p>(Admin)</p>
	{/if}
	<button onclick={() => user = null}>Sign Out (Client-side only)</button>
{:else}
	<p>You are not logged in.</p>
	<button onclick={signInWithGoogle}>Sign in with Google</button>
{/if}

<style>
	/* component styles */
</style>
*/
