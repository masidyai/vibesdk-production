import { useRef, type ReactNode } from 'react';
import { HeaderStoreContext, createHeaderStore } from './header-context';

export function HeaderProvider({ children }: { children: ReactNode }) {
const storeRef = useRef<ReturnType<typeof createHeaderStore> | null>(null);
if (!storeRef.current) {
storeRef.current = createHeaderStore();
}

return (
<HeaderStoreContext.Provider value={storeRef.current}>
{children}
</HeaderStoreContext.Provider>
);
}