import { seedDatabase } from './seedData';

const forzar = process.argv.includes('--force');
seedDatabase(forzar);