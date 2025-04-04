import type { PageLoad } from './$types';
// Assuming you have a type definition for your university data
import type { University } from '$lib/types'; // Adjust path as needed

export const load: PageLoad = async ({ fetch }) => {
	console.log('Executing load function to fetch universities...'); // Log start

	try {
		const response = await fetch('/api/universities'); // Use the provided fetch

		// Check if the request was successful (status code 200-299)
		if (!response.ok) {
			// Log the error status for debugging
			console.error(`Failed to fetch universities: ${response.status} ${response.statusText}`);

			// Attempt to get error message from API response body
			let errorMessage = `API Error (${response.status})`;
			try {
				const errorBody = await response.json();
				errorMessage = errorBody.message || errorMessage;
			} catch (e) {
				// Ignore if body isn't JSON
			}

			// Throw an error to be caught by SvelteKit's error handling (+error.svelte)
			// It's generally better to throw here than return an error object unless
			// you specifically want the page component to render an inline error state.
			throw new Error(errorMessage);
		}

		// Parse the JSON response and apply type
		// Ensure your API actually returns University[]
		const universities: University[] = await response.json();

		// Log success (optional, good for dev)
		console.log(`Successfully loaded ${universities.length} universities.`);

		// Return the data - this will be available as `data.universities` in the page component
		return {
			universities
		};

	} catch (error: any) {
		// Catch network errors (fetch failed) or errors thrown above
		console.error('Error loading universities in load function:', error);

		// Rethrow the error (or a new one) for SvelteKit error handling
		throw new Error(`Could not load university data: ${error.message || 'Unknown fetch error'}`);

		// Alternatively, if you want the page to handle the error state:
		// return {
		//     status: 500, // Or appropriate status
		//     error: error.message || 'Failed to load data',
		//     universities: [] // Provide default empty array
		// };
	}
};
