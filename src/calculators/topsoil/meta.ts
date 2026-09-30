import { defineCalculator } from '@/lib/define-calculator';

// Draft stub so links and related cards resolve; built in stage F (Page_Plan row for topsoil-calculator).
export default defineCalculator({
  id: 'topsoil',
  name: 'Topsoil Calculator',
  blurb: 'Cubic yards and bags of topsoil for beds, lawns and raised planters.',
  slugs: { en: 'topsoil-calculator' },
  primaryKeyword: 'topsoil calculator',
  category: 'construction',
  related: ['gravel'],
  next: ['gravel'],
  aliases: [],
  ymyl: false,
  status: { en: 'draft' },
  applicationCategory: 'UtilitiesApplication',
});
