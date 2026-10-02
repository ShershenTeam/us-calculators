import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built later (docs/05-roadmap.md).
export default defineCalculator({
  id: 'tip',
  name: 'Tip Calculator',
  blurb: 'Tip and split the bill, rounded the way you want.',
  slugs: { en: 'tip-calculator' },
  primaryKeyword: 'tip calculator',
  category: 'everyday',
  related: ['percentage'],
  next: ['percentage'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
