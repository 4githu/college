<script>
    import { user } from '$lib/auth';
</script>

<slot />

<style>
    nav {
        padding: 1rem;
        background: #f8f9fa;
    }

    a {
        color: #333;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
</style> 