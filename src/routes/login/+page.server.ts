import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import {
	normalizeRedirectPath,
	setAuthCookie,
	validateCredentials
} from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const redirectTo = normalizeRedirectPath(url.searchParams.get('redirectTo'));

		if (!validateCredentials(username, password)) {
			return fail(400, {
				message: '用户名或密码错误，请重试',
				username
			});
		}

		setAuthCookie(cookies);
		throw redirect(303, redirectTo);
	}
};
