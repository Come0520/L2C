'use client';

import { useEffect } from 'react';

export function VersionLogger() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GIT_COMMIT_SHA) {
      console.log(
        `%c L2C System %c v${process.env.NEXT_PUBLIC_GIT_COMMIT_SHA} `,
        'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
        'background:#41b883 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff'
      );
    }
  }, []);

  return null;
}
