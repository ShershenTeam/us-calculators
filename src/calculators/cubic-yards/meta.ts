import { defineCalculator } from '@/lib/define-calculator';

export default defineCalculator({
  id: 'cubic-yards',
  name: 'Cubic Yards Calculator',
  blurb: 'Cubic yards to order for beds, fill and holes, with a different depth for each area.',
  slugs: { en: 'cubic-yards-calculator' },
  primaryKeyword: 'cubic yards calculator',
  category: 'construction',
  related: ['square-footage', 'gravel', 'mulch', 'topsoil', 'concrete'],
  next: ['gravel', 'mulch', 'topsoil'],
  aliases: [
    'cubic yard calculator',
    'yardage calculator',
    'cu yd calculator',
    'cubic yards of dirt',
    'fill dirt calculator',
    'how many cubic yards do i need',
    'yards of material calculator',
  ],
  ymyl: false,
  status: { en: 'published' },
  applicationCategory: 'UtilitiesApplication',
  island: 'CubicYardsCalculator',
});
