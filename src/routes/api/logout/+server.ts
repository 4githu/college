import { json } from '@sveltejs/kit';

export async function POST({ cookies }) {
    // 세션 쿠키 삭제
    cookies.delete('session', { path: '/' });
    
    return json({ success: true });
} 