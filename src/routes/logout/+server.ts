import { redirect, type RequestHandler } from '@sveltejs/kit';
import { clearAuthCookie } from '$lib/server/auth';

export const POST: RequestHandler = ({ cookies }) => {
	clearAuthCookie(cookies);
	throw redirect(303, '/login');
};
