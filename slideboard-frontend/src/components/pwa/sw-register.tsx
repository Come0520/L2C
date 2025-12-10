"use client";
import { useEffect } from 'react';

export default function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // 紧急修复：卸载所有 Service Workers 以解决 "Failed to convert value to 'Response'" 错误
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          console.log('Unregistering SW:', registration);
          registration.unregister();
        }
      });
    }
  }, []);
  return null;
}
