// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: {
				username: string;
			} | null;
		}

		interface PageData {
			authenticated?: boolean;
			username?: string | null;
		}
	}
}

export {};
