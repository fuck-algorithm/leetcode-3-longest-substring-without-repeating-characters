import { useState } from 'react';
import type { InputSample, InputValidationResult, LocalizedText, ProblemData } from '../../types';

function renderLocalizedText(value: LocalizedText, locale: 'en' | 'zh-CN'): string {
  return typeof value === 'string' ? value : value[locale];
}

type Props = {
  locale: 'en' | 'zh-CN';
  samples: InputSample[];
  validator: (raw: string) => InputValidationResult;
  randomGenerator: () => string;
  onChange: (data: ProblemData) => void;
};

export function DataInputBar({ locale, samples, validator, randomGenerator, onChange }: Props) {
  const t = (english: string, chinese: string) => locale === 'en' ? english : chinese;
  const [raw, setRaw] = useState(samples[0]?.value ?? '');
  const [error, setError] = useState<string>('');

  function handleCommit(nextRaw: string) {
    setRaw(nextRaw);
    const result = validator(nextRaw);
    if (!result.valid) {
      setError(typeof result.error === 'string'
        ? result.error
        : result.error?.[locale] ?? t('Invalid input', '输入不合法'));
      return;
    }
    setError('');
    onChange({
      raw: nextRaw,
      parsed: result.parsed
    });
  }

  return (
    <section className="data-input-bar" data-testid="data-input-bar">
      <label className="input-label" htmlFor="algo-input">
        {t('Input', '输入数据')}
      </label>
      <input
        id="algo-input"
        data-testid="algo-input"
        className={error ? 'data-input error' : 'data-input'}
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        onBlur={() => handleCommit(raw)}
        placeholder={t('Enter a string (up to 50,000 characters)', '输入字符串（最多 50000 个字符）')}
      />
      {samples.map((sample) => (
        <button
          key={sample.id}
          type="button"
          data-testid={`sample-${sample.id}`}
          className="input-action-btn"
          onClick={() => handleCommit(sample.value)}
        >
          {locale === 'en' ? renderLocalizedText(sample.labelEn ?? sample.label, locale) : renderLocalizedText(sample.label, locale)}
        </button>
      ))}
      <button
        type="button"
        data-testid="random-input-btn"
        className="input-random-btn"
        onClick={() => handleCommit(randomGenerator())}
      >
        {t('Random valid input', '随机合法数据')}
      </button>
      {error ? <span className="input-error" data-testid="input-error">{error}</span> : null}
    </section>
  );
}
