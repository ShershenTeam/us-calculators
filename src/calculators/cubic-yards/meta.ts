import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built in stage F (Page_Plan row for cubic-yards-calculator).
export default defineCalculator({
  id: 'cubic-yards',
  name: 'Cubic Yards Calculator',
  blurb: 'Volume of any area in cubic yards, feet and meters for bulk orders.',
  slugs: { en: 'cubic-yards-calculator' },
  primaryKeyword: 'cubic yards calculator',
  category: 'construction',
  related: ['gravel'],
  next: ['gravel'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
