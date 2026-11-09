import { useLocalization } from '@/lib/use-localization';
import type { Locale } from '@/lib/localization';

const localeOptions: { value: Locale; labelKey: 'english' | 'arabic' | 'italian' }[] = [
	{ value: 'en', labelKey: 'english' },
	{ value: 'ar', labelKey: 'arabic' },
	{ value: 'it', labelKey: 'italian' },
];

export function LanguageSwitcher({ className = '' }: { className?: string }) {
	const { locale, setLocale, t } = useLocalization();

	return (
		<label className={className}>
			<span className="sr-only">{t('language')}</span>
			<select
				aria-label={t('language')}
				value={locale}
				onChange={(event) => {
					const selected = localeOptions.find(
						(option) => option.value === event.target.value,
					);
					if (selected) setLocale(selected.value);
				}}
				className="h-9 cursor-pointer rounded-lg border border-kumo-line bg-kumo-base px-2.5 text-sm text-kumo-default outline-none transition-colors hover:bg-kumo-tint focus-visible:ring-2 focus-visible:ring-brand/50"
			>
				{localeOptions.map(({ value, labelKey }) => (
					<option key={value} value={value}>
						{t(labelKey)}
					</option>
				))}
			</select>
		</label>
	);
}
