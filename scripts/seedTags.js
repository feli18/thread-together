import mongoose from 'mongoose';
import Tag from '../models/Tag.js';
import '../config/db.js';

const tags = [
  { name: 'Vintage',    category: 'style'     },
  { name: 'Minimalist', category: 'style'     },
  { name: 'Cottagecore',category: 'style'     },
  { name: 'Cotton',     category: 'material'  },
  { name: 'Linen',      category: 'material'  },
  { name: 'Denim',      category: 'material'  },
  { name: 'Appliqué',   category: 'technique' },
  { name: 'Patchwork',  category: 'technique' },
  { name: 'Handsewn',   category: 'technique' },

];

async function seed() {
  await Tag.deleteMany({});
  await Tag.insertMany(tags);
  console.log('Seeded tags');
  process.exit(0);
}

seed().catch(console.error);
