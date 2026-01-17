
import * as schema from './src/shared/api/schema';

try {
    console.log('Successfully loaded schema keys:', Object.keys(schema));
} catch (error) {
    console.error('Failed to load schema:', error);
}
