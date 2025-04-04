// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

// This load function runs on the server before the layout renders.
// It's often used to check session cookies and populate `locals.user`.
// If the user data is only needed client-side (fetched via API after load),
// or managed entirely by a client-side store like `$lib/auth`, this can be minimal.
export const load: LayoutServerLoad = async ({ locals }) => {
	// Example: If you were populating locals.user in hooks.server.ts
	// return {
	//     // Make the user object (or null) available to the layout and pages
	//     // Note: This requires `user` to be defined in App.Locals in app.d.ts
	//     user: locals.user
	// };

	// If not loading user data here, return an empty object
	return {};
};
