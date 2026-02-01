import * as fs from 'fs';
import * as path from 'path';

// Read the API key from the file
const apiKeyPath = path.join('D:', 'Projects', 'OpenAI_API_Key.txt');

try {
  const apiKey = fs.readFileSync(apiKeyPath, 'utf-8').trim();
  
  // Write to .env file in the root directory (not src/)
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, `OPENAI_API_KEY=${apiKey}\n`);
  
  console.log('✓ API Key loaded and written to .env file');
} catch (error) {
  console.error('✗ Error loading API key:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
