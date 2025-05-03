const path = require('path');
const dotenv = require('dotenv');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : process.env.NODE_ENV === 'development' 
    ? '.env.development' 
    : '.env';

// Load the environment variables
const result = dotenv.config({ path: path.resolve(process.cwd(), envFile) });

if (result.error) {
  console.error('Error loading .env file:', result.error);
}

const app = require('./app');

const port = process.env.PORT || 5000;
app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});
