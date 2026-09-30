import { defineCalculator } from '@/lib/define-calculator';

export default defineCalculator({
  id: '{{id}}',
  name: '{{name}}',
  blurb: 'TODO: one line for cards (≤ 90 chars).',
  slugs: { en: '{{slug}}' },
  primaryKeyword: '{{primaryKeyword}}',
  category: '{{category}}',
  related: [], // 4–6 ids before publishing
  next: [], // 2–3 ids before publishing
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
  island: '{{island}}',
});
