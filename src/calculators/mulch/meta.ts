import { defineCalculator } from '@/lib/define-calculator';

export default defineCalculator({
  id: 'mulch',
  name: 'Mulch Calculator',
  blurb: 'Bags and cubic yards of mulch for beds and tree rings, including a top-up over old mulch.',
  slugs: { en: 'mulch-calculator' },
  primaryKeyword: 'mulch calculator',
  category: 'construction',
  related: ['cubic-yards', 'square-footage', 'topsoil', 'gravel', 'concrete'],
  next: ['topsoil', 'cubic-yards', 'gravel'],
  aliases: [
    'how much mulch do i need',
    'mulch bag calculator',
    'bags of mulch calculator',
    'mulch estimator',
    'how many bags of mulch in a yard',
    'mulch coverage calculator',
    'wood chip calculator',
  ],
  ymyl: false,
  status: { en: 'published' },
  applicationCategory: 'UtilitiesApplication',
  island: 'MulchCalculator',
});
