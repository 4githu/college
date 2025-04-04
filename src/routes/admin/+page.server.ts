import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/prisma'; // Assuming prisma client setup in $lib
import type { PageServerLoad } from './$types'; // Import generated type for safety

// Use the generated PageServerLoad type for better type checking
export const load: PageServerLoad = async ({ locals }) => {
    // Check for admin user from hooks (via locals) - Standard SvelteKit pattern
    // Using optional chaining ?. is good practice.
    if (!locals.user?.isAdmin) {
        // Throw redirect - Standard SvelteKit pattern
        throw redirect(303, '/'); // Redirect non-admins to the homepage
    }

    // Fetch data using Prisma - Standard backend data fetching
    const universities = await prisma.university.findMany({
        include: {
            colleges: {
                include: {
                    departments: true
                }
            }
        }
    });

    // Fetch user data using Prisma - Standard backend data fetching
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            isVerified: true,
            createdAt: true,
            overall_gpa: true // Be mindful of exposing sensitive data if not needed
        }
    });

    // Return data to the page component - Standard SvelteKit pattern
    return {
        universities,
        users
        // This data will be available as `export let data;` in your +page.svelte
    };
};

// --- Notes ---
// 1. Ensure your `hooks.server.ts` correctly populates `locals.user`.
// 2. Ensure your Prisma client (`$lib/prisma`) is correctly initialized.
// 3. Make sure you have defined the `App.Locals` interface in your `app.d.ts`
//    to include the `user` property for type safety with `locals.user`.
//    Example app.d.ts:
//    declare global {
//        namespace App {
//            // interface Error {}
//            interface Locals {
//                user: {
//                    id: string;
//                    email: string;
//                    isAdmin: boolean;
//                    // add other relevant user properties
//                } | null; // Or your specific User type
//            }
//            // interface PageData {}
//            // interface Platform {}
//        }
//    }
//    export {};
