import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built in stage F (Page_Plan row for mulch-calculator).
export default defineCalculator({
  id: 'mulch',
  name: 'Mulch Calculator',
  blurb: 'Bags and cubic yards of mulch for beds and paths at your depth.',
  slugs: { en: 'mulch-calculator' },
  primaryKeyword: 'mulch calculator',
  category: 'construction',
  related: ['gravel'],
  next: ['gravel'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
