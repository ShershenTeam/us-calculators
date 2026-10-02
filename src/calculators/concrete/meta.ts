import { defineCalculator } from '@/lib/define-calculator';

export default defineCalculator({
  id: 'concrete',
  name: 'Concrete Calculator',
  blurb: 'Cubic yards and 40–90 lb bags for slabs, footings, post holes and stairs.',
  slugs: { en: 'concrete-calculator' },
  primaryKeyword: 'concrete calculator',
  category: 'construction',
  related: ['cubic-yards', 'square-footage', 'gravel', 'mulch', 'topsoil'],
  next: ['gravel', 'cubic-yards', 'square-footage'],
  aliases: [
    'concrete slab calculator',
    'concrete bag calculator',
    'how many bags of concrete do i need',
    'cement calculator',
    'quikrete calculator',
    'concrete yardage calculator',
    'concrete footing calculator',
    'concrete stairs calculator',
    'post hole concrete calculator',
  ],
  ymyl: false,
  status: { en: 'published' },
  applicationCategory: 'UtilitiesApplication',
  island: 'ConcreteCalculator',
});
