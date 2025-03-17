import { writable } from 'svelte/store';
import type { User } from '@prisma/client';

function createUserStore() {
    const { subscribe, set, update } = writable<User | null>(null);

    // 페이지 로드시 세션 스토리지에서 사용자 정보 복원
    if (typeof window !== 'undefined') {
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) {
            set(JSON.parse(savedUser));
        }
    }

    return {
        subscribe,
        login: (userData: User) => {
            sessionStorage.setItem('user', JSON.stringify(userData));
            set(userData);
        },
        logout: () => {
            sessionStorage.removeItem('user');
            set(null);
        },
        update
    };
}

export const user = createUserStore();

export function validateEmail(email: string) {
    return email.endsWith('@djshs.djsch.kr');
}

export async function signInWithGoogle() {
    // Google OAuth 구현
    // 실제 구현시 @sveltejs/auth 또는 Firebase Auth 사용 추천
} 