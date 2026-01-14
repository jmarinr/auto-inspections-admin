import React from 'react';
import { Moon, Sun, Languages } from 'lucide-react';
import Button from './Button';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/LanguageContext';

export default function ThemeLangControls() {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={toggle}
        aria-label="Toggle theme"
        title={theme === 'dark' ? t('lightMode') : t('darkMode')}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span className="hidden sm:inline">{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
        aria-label="Toggle language"
        title={t('language')}
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{lang.toUpperCase()}</span>
      </Button>
    </div>
  );
}
