import { promises as fs } from 'fs';
import axios from 'axios';
import { exec } from 'child_process';
import path from 'path';
import { convertPdfToTextFromPdfCo } from './pdf.co';

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
  for (const file of files.filter((f) => f.endsWith('.pdf'))) {
    const pdfFilePath = path.join(dirPath, file);
    console.log('Processing', pdfFilePath);

    let result: object = {};
    // Try extracting text with Docker Run and calling GPT-4
    const layedOutText = await getPdfLayoutTextFromDockerRun(pdfFilePath);
    console.log('  Got layedOutText from Docker Run');
    result = await callOpenAI(layedOutText, promptTemplate, jsonSchemaStr);
    if (gotValues(result)) {
      console.log('  GPT-4 API called successfully. Result:');
      console.log('  ', JSON.stringify(result));
    } else {
      // If failed, try extracting text with PDF.co and calling GPT-4 again
      console.log('  Failed to find values from Docker Run results, trying with PDF.co...');
      const layedOutText = await convertPdfToTextFromPdfCo(PDF_CO_API_KEY, pdfFilePath);
      console.log('  Got layedOutText from PDF.co');
      result = await callOpenAI(layedOutText, promptTemplate, jsonSchemaStr);
      console.log('  GPT-4 API called successfully. Result:');
      console.log('  ', JSON.stringify(result));
    }

    await fs.appendFile(`${WORKING_DIR}/output.tsv`, Object.values(result).join('\t') + '\n');
    console.log('  Done');
  }
}

async function getPdfLayoutTextFromDockerRun(pdfFilePath: string) {
  return new Promise<string>((resolve, reject) => {
    const child = exec(
      `docker run -v $(pwd):/app pdf-layout-text-stripper ${pdfFilePath}`,
      { timeout: 60000 }, // Timeout after 60 seconds
      (error, stdout, stderr) => {
        if (error) {
          console.error(`stderr: ${stderr}`);
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      },
    );

    child.on('exit', (code, signal) => {
      console.log(`  Docker process exited with code ${code} and signal ${signal}`);
    });
  });
}

async function callOpenAI(
  layedOutText: string,
  promptTemplate: string,
  jsonSchemaStr: string,
): Promise<{ success: boolean }> {
  const prompt = [
    {
      role: 'user',
      content: promptTemplate
        .replace('{{ schema }}', jsonSchemaStr)
        .replace('{{ layedOutPdf }}', layedOutText),
    },
  ];
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',

    {
      model: 'gpt-4',
      messages: prompt,
      max_tokens: 400,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      timeout: 2 * 60 * 1000, // 2 minute timeout
    },
  );
  const jsonFormattedResponse = res.data.choices[0].message.content.trim();
  return JSON.parse(jsonFormattedResponse);
}

function gotValues(openAiResult: object) {
  return Object.values(openAiResult).filter(Boolean).length > 0;
}

main().catch(console.error);
