import {
createContext,
useContext,
useLayoutEffect,
useRef,
useSyncExternalStore,
} from 'react';

export type HeaderContent = {
leading?: import('react').ReactNode;
trailing?: import('react').ReactNode;
};

export type HeaderStore = {
getSnapshot: () => HeaderContent | null;
setContent: (content: HeaderContent | null) => void;
subscribe: (listener: () => void) => () => void;
};

export function createHeaderStore(): HeaderStore {
let content: HeaderContent | null = null;
const listeners = new Set<() => void>();

return {
getSnapshot: () => content,
setContent: (next) => {
if (Object.is(content, next)) return;
content = next;
listeners.forEach((listener) => listener());
},
subscribe: (listener) => {
listeners.add(listener);
return () => {
listeners.delete(listener);
};
},
};
}

export const HeaderStoreContext = createContext<HeaderStore | null>(null);

function useHeaderStore() {
const store = useContext(HeaderStoreContext);
if (!store) {
throw new Error('useHeaderStore must be used within HeaderProvider');
}
return store;
}

export function useHeaderContent() {
const store = useHeaderStore();
const content = useSyncExternalStore(
store.subscribe,
store.getSnapshot,
store.getSnapshot,
);

return {
content,
setContent: store.setContent,
};
}

/** Registers page-specific header slots for the lifetime of the caller. */
export function usePageHeader(content: HeaderContent | null) {
const store = useHeaderStore();
const contentRef = useRef(content);
contentRef.current = content;

useLayoutEffect(() => {
store.setContent(contentRef.current);
});

useLayoutEffect(() => {
return () => {
store.setContent(null);
};
}, [store]);
}