import { defineCalculator } from '@/lib/define-calculator';

export default defineCalculator({
  id: 'percentage',
  name: 'Percentage Calculator',
  blurb: 'Percent of a number, what percent, percent change, increase or decrease — all at once.',
  slugs: { en: 'percentage-calculator' },
  primaryKeyword: 'percentage calculator',
  category: 'math',
  related: ['percent-off', 'fraction', 'scientific', 'tip'],
  next: ['percent-off', 'tip', 'fraction'],
  aliases: [
    'percent calculator',
    'percent of a number',
    'what percent of',
    'percent change calculator',
    'percentage increase calculator',
    'percentage decrease calculator',
    'percent difference calculator',
    'how to calculate percentage',
  ],
  ymyl: false,
  status: { en: 'published' },
  applicationCategory: 'UtilitiesApplication',
  island: 'PercentageCalculator',
});
