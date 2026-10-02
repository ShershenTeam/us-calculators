import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built later (docs/05-roadmap.md).
export default defineCalculator({
  id: 'percent-off',
  name: 'Percent Off Calculator',
  blurb: 'Sale price after one or several discounts, plus state sales tax.',
  slugs: { en: 'percent-off-calculator' },
  primaryKeyword: 'percent off calculator',
  category: 'math',
  related: ['percentage'],
  next: ['percentage'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
