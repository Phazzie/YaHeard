/**
 * @phazzie-file-generator
 * Automatically creates all files from Opus 4.1 output
 * Run: node phazzie-file-generator.js
 */

// @phazzie-checkpoint-1: Import required ES modules
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// @phazzie-checkpoint-2: Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output (works on most terminals)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

console.log(`${colors.cyan}${colors.bright}
╔═══════════════════════════════════════════╗
║   🚀 @PHAZZIE FILE GENERATOR v1.0 🚀      ║
║   Opus 4.1 → Real Files                   ║
╚═══════════════════════════════════════════╝
${colors.reset}`);

async function parseAndCreateFiles() {
  const inputFile = 'opus-output.txt';

  console.log(`${colors.blue}@phazzie-checkpoint-1: Looking for ${inputFile}...${colors.reset}`);

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.log(`${colors.red}❌ ERROR: ${inputFile} not found!${colors.reset}`);
    console.log(
      `${colors.yellow}Create a file called 'opus-output.txt' with Opus 4.1's output${colors.reset}`
    );
    rl.close();
    return;
  }

  // Read the entire file
  console.log(`${colors.blue}@phazzie-checkpoint-2: Reading ${inputFile}...${colors.reset}`);
  const content = fs.readFileSync(inputFile, 'utf-8');

  // Parse file blocks - use a simple, reliable line-by-line approach
  console.log(`${colors.green}@phazzie-checkpoint-3: Parsing file blocks...${colors.reset}`);

  const lines = content.split('\n');
  const files = [];
  let currentFile = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('### FILE_START: ')) {
      // Start of a new file
      const filePath = line.substring('### FILE_START: '.length).trim();
      currentFile = filePath;
      currentContent = [];
    } else if (line.startsWith('### FILE_END: ') && currentFile) {
      // End of current file
      const endFilePath = line.substring('### FILE_END: '.length).trim();
      if (endFilePath === currentFile) {
        // Valid file block
        files.push({
          path: currentFile,
          content: currentContent.join('\n'),
        });
      }
      currentFile = null;
      currentContent = [];
    } else if (currentFile) {
      // Content line for current file
      currentContent.push(line);
    }
  }

  console.log(
    `${colors.green}@phazzie-checkpoint-4: Found ${files.length} files to create${colors.reset}\n`
  );

  if (files.length === 0) {
    console.log(`${colors.red}❌ No file definitions found!${colors.reset}`);
    console.log(`${colors.yellow}Make sure files are wrapped with:${colors.reset}`);
    console.log('### FILE_START: /path/to/file');
    console.log('[content]');
    console.log('### FILE_END: /path/to/file');
    rl.close();
    return;
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  // Process each file
  for (const file of files) {
    const filePath = file.path;
    const fileContent = file.content;

    // Normalize path (remove leading slash if present for relative paths)
    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(process.cwd(), normalizedPath);
    const directory = path.dirname(fullPath);

    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}📄 Processing: ${normalizedPath}${colors.reset}`);

    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(directory)) {
        console.log(`${colors.yellow}  📁 Creating directory: ${directory}${colors.reset}`);
        fs.mkdirSync(directory, { recursive: true });
      }

      // Check if file already exists
      if (fs.existsSync(fullPath)) {
        console.log(`${colors.yellow}  ⚠️  File already exists!${colors.reset}`);
        const answer = await askQuestion(`  Overwrite ${normalizedPath}? (y/n): `);

        if (answer.toLowerCase() !== 'y') {
          console.log(`${colors.blue}  ⏭️  Skipped${colors.reset}`);
          skipped++;
          continue;
        }
      }

      // Write the file
      console.log(`${colors.green}  ✍️  Writing file...${colors.reset}`);
      fs.writeFileSync(fullPath, fileContent);
      console.log(`${colors.green}  ✅ Created successfully!${colors.reset}`);
      created++;
    } catch (error) {
      console.log(`${colors.red}  ❌ ERROR: ${error.message}${colors.reset}`);
      failed++;
    }
  }

  // Summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(
    `${colors.bright}${colors.green}🎉 @PHAZZIE FILE GENERATION COMPLETE!${colors.reset}\n`
  );
  console.log(`${colors.green}  ✅ Created: ${created} files${colors.reset}`);
  console.log(`${colors.yellow}  ⏭️  Skipped: ${skipped} files${colors.reset}`);
  console.log(`${colors.red}  ❌ Failed: ${failed} files${colors.reset}`);

  if (created > 0) {
    console.log(`\n${colors.bright}${colors.green}🚀 Your files are ready! Run:${colors.reset}`);
    console.log(`${colors.cyan}  npm install (if needed)${colors.reset}`);
    console.log(`${colors.cyan}  npm run dev${colors.reset}`);
  }

  rl.close();
}

// Run the parser
console.log(`${colors.blue}@phazzie-checkpoint-0: Starting file generator...${colors.reset}\n`);
parseAndCreateFiles().catch(error => {
  console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
  rl.close();
});
