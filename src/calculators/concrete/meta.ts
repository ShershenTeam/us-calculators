import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built in stage F (Page_Plan row for concrete-calculator).
export default defineCalculator({
  id: 'concrete',
  name: 'Concrete Calculator',
  blurb: 'Cubic yards and 40/60/80 lb bags for slabs, footings and posts.',
  slugs: { en: 'concrete-calculator' },
  primaryKeyword: 'concrete calculator',
  category: 'construction',
  related: ['gravel'],
  next: ['gravel'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
