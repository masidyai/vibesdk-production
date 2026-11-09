import { createContext } from 'react';
import type { Locale, MessageKey } from './localization';

export interface LocalizationContextValue {
	locale: Locale;
	direction: 'ltr' | 'rtl';
	setLocale: (locale: Locale) => void;
	t: (key: MessageKey) => string;
}

export const LocalizationContext =
	createContext<LocalizationContextValue | null>(null);
