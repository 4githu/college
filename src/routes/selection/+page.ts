import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
    const response = await fetch('/api/universities');
    const universities = await response.json();
    console.log('Universities loaded:', universities);
    return { universities };
}; 