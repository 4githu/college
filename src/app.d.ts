// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			getSession(): Promise<import('@auth/core').Session | null>
		}
		interface PageData {
			session: import('@auth/core').Session | null
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
