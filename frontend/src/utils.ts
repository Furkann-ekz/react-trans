// frontend/src/utils.ts

// JWT'yi çözen yardımcı fonksiyon
export function jwt_decode(token: string): any {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}