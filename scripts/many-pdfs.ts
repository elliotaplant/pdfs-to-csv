import { promises as fs } from 'fs';
import axios from 'axios';
import { exec } from 'child_process';
import path from 'path';
import { convertPdfToTextFromPdfCo } from './pdf.co';
import { processPdf } from './process-pdf';

// Environment Variables
const PDF_CO_API_KEY = process.env.PDF_CO_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Working directory
const WORKING_DIR = './working';

async function main(): Promise<void> {
  // Command line arguments validation
  if (process.argv.length !== 5) {
    throw new Error(
      '3 args required: <prompt template file> <json schema file> <PDF files directory>',
    );
  }

  // Reading template and schema
  const promptTemplate = await fs.readFile(process.argv[2], 'utf-8');
  const jsonSchemaStr = await fs.readFile(process.argv[3], 'utf-8');
  const jsonSchema: { properties: any } = JSON.parse(jsonSchemaStr);
  const dirPath = process.argv[4];

  // Arguments validation
  if (!promptTemplate) {
    throw new Error('Prompt template path required as 1st arg');
  }
  if (!jsonSchemaStr) {
    throw new Error('JSON Schema path required as 2nd arg');
  }
  if (!dirPath) {
    throw new Error('PDF directory path required as 3rd arg');
  }
  if (!PDF_CO_API_KEY) {
    throw new Error('PDF_CO_API_KEY required as env variable');
  }
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY required as env variable');
  }

  // Initialize output.tsv
  const keys = Object.keys(jsonSchema.properties);
  await fs.writeFile(`${WORKING_DIR}/output.tsv`, keys.join('\t') + '\n');
  console.log('Output file initialized.');

  // Process all PDFs
  const files = await fs.readdir(dirPath);
  const results = await Promise.all(
    files
      .filter((f) => f.endsWith('.pdf'))
      .map((file) =>
        processPdf(
          dirPath,
          file,
          WORKING_DIR,
          promptTemplate,
          jsonSchemaStr,
          OPENAI_API_KEY,
          PDF_CO_API_KEY,
        ),
      ),
  );

  for (const result of results) {
    await fs.appendFile(`${WORKING_DIR}/output.tsv`, Object.values(result).join('\t') + '\n');
  }
  console.log('  Done');
}

main().catch(console.error);
