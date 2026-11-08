type Props = {
  locale: 'en' | 'zh-CN';
  onChange: (locale: 'en' | 'zh-CN') => void;
};

export function LanguageToggle({ locale, onChange }: Props) {
  return (
    <div className="language-toggle" role="group" aria-label={locale === 'en' ? 'Interface language' : '界面语言'}>
      <button
        type="button"
        data-testid="ui-language-en"
        aria-pressed={locale === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        data-testid="ui-language-zh-CN"
        aria-pressed={locale === 'zh-CN'}
        onClick={() => onChange('zh-CN')}
      >
        简体中文
      </button>
    </div>
  );
}
