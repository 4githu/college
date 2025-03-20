import { writable } from 'svelte/store';

// 사용자 타입 정의
type User = {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
} | null;

// 사용자 스토어 생성
export const user = writable<User>(null);

// 사용자 정보 로드 함수
export async function loadUser() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const userData = await response.json();
            user.set(userData);
        } else {
            user.set(null);
        }
    } catch (error) {
        console.error('Error loading user:', error);
        user.set(null);
    }
}

export function validateEmail(email: string) {
    return email.endsWith('@djshs.djsch.kr');
}

export async function signInWithGoogle() {
    // Google OAuth 구현
    // 실제 구현시 @sveltejs/auth 또는 Firebase Auth 사용 추천
} 