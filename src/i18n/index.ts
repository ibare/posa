import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from './locales/en/common.json';
import exportEn from './locales/en/export.json';
import explorerEn from './locales/en/explorer.json';
import inspectorEn from './locales/en/inspector.json';
import onboardingEn from './locales/en/onboarding.json';
import planesEn from './locales/en/planes.json';
import primitivesEn from './locales/en/primitives.json';
import commonKo from './locales/ko/common.json';
import exportKo from './locales/ko/export.json';
import explorerKo from './locales/ko/explorer.json';
import inspectorKo from './locales/ko/inspector.json';
import onboardingKo from './locales/ko/onboarding.json';
import planesKo from './locales/ko/planes.json';
import primitivesKo from './locales/ko/primitives.json';
import { DEFAULT_LOCALE, LOCALES, type Locale } from './config';

export const NAMESPACES = [
  'common',
  'onboarding',
  'planes',
  'primitives',
  'explorer',
  'inspector',
  'export',
] as const;
export type Namespace = (typeof NAMESPACES)[number];

const RESOURCES = {
  en: {
    common: commonEn,
    onboarding: onboardingEn,
    planes: planesEn,
    primitives: primitivesEn,
    explorer: explorerEn,
    inspector: inspectorEn,
    export: exportEn,
  },
  ko: {
    common: commonKo,
    onboarding: onboardingKo,
    planes: planesKo,
    primitives: primitivesKo,
    explorer: explorerKo,
    inspector: inspectorKo,
    export: exportKo,
  },
} as const satisfies Record<Locale, Record<Namespace, unknown>>;

void i18n.use(initReactI18next).init({
  resources: RESOURCES,
  lng: DEFAULT_LOCALE,
  fallbackLng: 'en',
  supportedLngs: LOCALES as unknown as string[],
  defaultNS: 'common',
  ns: NAMESPACES as unknown as string[],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
export { DEFAULT_LOCALE, LOCALES, LOCALE_LABELS, isLocale } from './config';
export type { Locale } from './config';
