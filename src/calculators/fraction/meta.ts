import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built later (docs/05-roadmap.md).
export default defineCalculator({
  id: 'fraction',
  name: 'Fraction Calculator',
  blurb: 'Add, subtract, multiply and divide fractions with every step shown.',
  slugs: { en: 'fraction-calculator' },
  primaryKeyword: 'fraction calculator',
  category: 'math',
  related: ['percentage'],
  next: ['percentage'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
