// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				id: string;
				email: string;
				name: string;
				isAdmin: boolean;
			} | null;
		}
		interface PageData {
			user?: {
				id: string;
				email: string;
				name: string;
				isAdmin: boolean;
			} | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
