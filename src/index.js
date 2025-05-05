const path = require('path');
const dotenv = require('dotenv');

// Load environment variables based on NODE_ENV

let result;
// Load the environment variables
if(process.env.NODE_ENV === 'development'){
  result = dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });
}else{
 result = dotenv.config({ path: path.resolve("/etc/secrets/.env") });
}

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
