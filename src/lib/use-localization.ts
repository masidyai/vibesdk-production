import { useContext } from 'react';
import { LocalizationContext } from './localization-context';
import type { LocalizationContextValue } from './localization-context';

export function useLocalization(): LocalizationContextValue {
	const context = useContext(LocalizationContext);
	if (!context) {
		throw new Error('useLocalization must be used within LocalizationProvider.');
	}
	return context;
}
