import type { Localized } from '../data/types';

/**
 * UI chrome strings (bilingual). Technical terms stay English in both languages.
 * Resolve with the `t()` helper from useLang(): t(ui.search).
 */
export const ui = {
  brandTitle: { en: 'API Styles', uk: 'API Styles' },
  brandSubtitle: { en: 'The Comprehensive Guide', uk: 'Вичерпний посібник' },

  search: { en: 'Search', uk: 'Пошук' },
  searchPlaceholder: { en: 'Search modules & topics…', uk: 'Пошук модулів і тем…' },
  searchNoResults: { en: 'No matches', uk: 'Нічого не знайдено' },

  levelFilter: { en: 'Level', uk: 'Рівень' },
  allLevels: { en: 'All levels', uk: 'Усі рівні' },
  beginner: { en: 'Beginner', uk: 'Beginner' },
  middle: { en: 'Middle', uk: 'Middle' },
  senior: { en: 'Senior', uk: 'Senior' },
  staff: { en: 'Staff', uk: 'Staff' },

  language: { en: 'Language', uk: 'Мова' },
  english: { en: 'English', uk: 'English' },
  ukrainian: { en: 'Українська', uk: 'Українська' },

  theme: { en: 'Theme', uk: 'Тема' },
  themeSystem: { en: 'System', uk: 'Системна' },
  themeDark: { en: 'Dark', uk: 'Темна' },
  themeLight: { en: 'Light', uk: 'Світла' },

  landscapeMap: { en: 'Style Compass', uk: 'Style Compass' },
  startHere: { en: 'Start here', uk: 'Почати тут' },
  suggestedPath: { en: 'Suggested path', uk: 'Рекомендований шлях' },
  mentalModels: { en: 'Mental Models', uk: 'Ментальні моделі' },
  glossary: { en: 'Glossary', uk: 'Глосарій' },
  decide: { en: 'Style Picker', uk: 'Підбір стилю' },

  onThisPage: { en: 'On this page', uk: 'На цій сторінці' },
  keyPoints: { en: 'Key points', uk: 'Ключові тези' },
  pitfalls: { en: 'Pitfalls & misconceptions', uk: 'Пастки та хибні уявлення' },
  interview: { en: 'Interview questions', uk: 'Питання для співбесіди' },
  seeAlso: { en: 'See also', uk: 'Дивіться також' },
  sources: { en: 'Sources', uk: 'Джерела' },
  useAvoid: { en: 'Use it / avoid it', uk: 'Коли варто / коли ні' },
  mentalModelLabel: { en: 'Mental model', uk: 'Ментальна модель' },
  readMins: { en: 'min read', uk: 'хв читання' },

  prevModule: { en: 'Previous', uk: 'Попередній' },
  nextModule: { en: 'Next', uk: 'Наступний' },
  markKnown: { en: 'Mark as known', uk: 'Позначити як вивчене' },
  known: { en: 'Known', uk: 'Вивчено' },

  comingSoon: { en: 'Content coming in a later session', uk: 'Контент зʼявиться в наступній сесії' },
  stubNote: {
    en: 'This module is part of the navigable skeleton. Its full content is authored in a later session per the roadmap.',
    uk: 'Цей модуль — частина навігаційного каркасу. Його повний зміст буде створено в наступній сесії згідно з планом.',
  },

  searchKindModule: { en: 'Module', uk: 'Модуль' },
  searchKindTopic: { en: 'Topic', uk: 'Тема' },
  searchKindGlossary: { en: 'Term', uk: 'Термін' },

  // CHANGED (s13b): copy-code buttons + topic copy-links.
  copyCode: { en: 'Copy code', uk: 'Копіювати код' },
  copied: { en: 'Copied', uk: 'Скопійовано' },
  copyLink: { en: 'Copy link to this topic', uk: 'Копіювати посилання на цю тему' },

  // Sim controls (shared)
  play: { en: 'Play', uk: 'Відтворити' },
  pause: { en: 'Pause', uk: 'Пауза' },
  reset: { en: 'Reset', uk: 'Скинути' },
  next: { en: 'Next', uk: 'Далі' },
  back: { en: 'Back', uk: 'Назад' },
  step: { en: 'Step', uk: 'Крок' },

  sectionsLabel: { en: 'sections', uk: 'секцій' },
  modulesLabel: { en: 'modules', uk: 'модулів' },
  simsLabel: { en: 'simulators', uk: 'симуляторів' },

  footerRole: { en: 'Senior Fullstack Engineer', uk: 'Senior Fullstack Engineer' },
  footerCountry: { en: 'Ukraine', uk: 'Україна' },
  footerTagline: {
    en: 'Deep, interactive, bilingual guide to the styles for building APIs.',
    uk: 'Глибокий інтерактивний двомовний посібник про стилі побудови API.',
  },
  builtWith: { en: 'Built with Vite · React · TypeScript', uk: 'Зроблено на Vite · React · TypeScript' },
} satisfies Record<string, Localized>;
