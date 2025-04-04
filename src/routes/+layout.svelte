<script lang="ts">
	// Assuming user is exported as rune state: export const user = $state(...)
	import { user } from '$lib/auth';
	import { goto } from '$app/navigation'; // Keep for navigation examples
    import type { LayoutData } from './$types';

    // You can access data returned from +layout.server.ts load function if needed
    // let { user: serverUser } = $props<{ user: App.Locals['user'] }>();
    // If using server load data, you might synchronize the $lib/auth store here in an $effect

    async function handleLogout() {
		try {
			const response = await fetch('/api/logout', { method: 'POST' });
			if (response.ok) {
                // Option 1: Rely on auth store update and potential $effect redirect
                // Option 2: Force navigation/reload
				window.location.href = '/';
			} else {
                // Handle logout error
                console.error("Logout failed")
            }
		} catch (error) {
			console.error('Logout error:', error);
		}
	}

</script>

<!-- Example Basic Navigation Header -->
<nav>
    <a href="/">Home</a>
    {#if user}
        <!-- Show links for logged-in users -->
        <a href="/selection">University Selection</a>
        <a href="/profile">Profile ({user.name})</a>
        <button class="nav-logout-btn" on:click={handleLogout}>Logout</button>
    {:else}
        <!-- Show links for logged-out users -->
        <a href="/login">Login</a>
        <a href="/register">Register</a>
    {/if}
</nav>

<main>
	<!-- Page content is rendered here -->
	<slot />
</main>

<style>
	nav {
		padding: 1rem;
		background: #f0f2f5; /* Slightly different background */
		border-bottom: 1px solid #e0e0e0;
		display: flex;
		gap: 1.5rem; /* Space between links */
        align-items: center;
	}

	a {
		color: #0056b3; /* Adjust link color */
		text-decoration: none;
		font-weight: 500;
	}

	a:hover {
		text-decoration: underline;
        color: #003d80;
	}

    /* Basic button style for nav */
    .nav-logout-btn {
        background: #dc3545;
        color: white;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        margin-left: auto; /* Push logout button to the right */
    }
    .nav-logout-btn:hover {
         background: #c82333;
    }

    main {
        padding: 1rem; /* Add padding around page content */
    }
</style>
