/// <reference types="vite/client" />
declare global {
  interface Window {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: {
        user?: {
          id?: number | string;
          username?: string;
          first_name?: string;
          last_name?: string;
        };
      };
      [key: string]: any; // чтобы TS не ругался на другие поля
    };
  }
}

export {};