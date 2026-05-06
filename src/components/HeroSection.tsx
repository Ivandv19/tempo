/** @jsxImportSource react */
import { ui } from '../i18n/ui';

interface Props {
  lang: 'es' | 'en';
  mode: 'default' | 'focus';
}

export default function HeroSection({ lang, mode }: Props) {
  const t = (key: keyof typeof ui['es']) => ui[lang][key];

  if (mode === 'focus') {
    return (
      <div className="text-center space-y-4 mb-10 animate-fade-in-up">
        <h1 className="text-5xl font-extrabold text-primary">
          {t('hero.focus.title')}
        </h1>
        <p className="text-xl text-base-content/80 max-w-2xl mx-auto">
          {t('hero.focus.subtitle')}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 mb-10 animate-fade-in-up">
      <h1 className="text-5xl md:text-6xl font-black bg-linear-to-r from-(--hero-title-from) to-(--hero-title-to) bg-clip-text text-transparent pb-3 tracking-tighter">
        {t('hero.title')}
      </h1>

      <div className="text-xl text-base-content/70 max-w-2xl mx-auto font-medium leading-relaxed">
        <p>
          {t('hero.subtitle').split(',')[0]}{' '}
          <span className="text-(--hero-coding) font-extrabold">{t('hero.span.coding')}</span>,{' '}
          <span className="text-(--hero-studying) font-extrabold">{t('hero.span.studying')}</span>{' '}
          {lang === 'es' ? 'o' : 'or'}{' '}
          <span className="text-(--hero-creating) font-extrabold">{t('hero.span.creating')}</span>
        </p>
        <p className="opacity-80">
          {lang === 'es' ? 'el método Pomodoro es tu mejor aliado.' : 'the Pomodoro method is your best ally.'}
        </p>
      </div>
    </div>
  );
}
