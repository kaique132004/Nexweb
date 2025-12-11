import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface UserPreferences {
  language: string;
  notifications_enabled: boolean;
  theme: string;
}

export function useLanguageSync(preferences: UserPreferences | null) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (preferences?.language && preferences.language !== i18n.language) {
      i18n.changeLanguage(preferences.language);
    }
  }, [preferences?.language, i18n]);

  return {
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage,
  };
}
