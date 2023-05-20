import { promises as fs } from 'fs';
import axios from 'axios';
import { exec } from 'child_process';
import path from 'path';

const PDF_CO_API_KEY = process.env.PDF_CO_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const WORKING_DIR = './working'

async function main(): Promise<void> {
  const promptTemplate = await fs.readFile(process.argv[2], 'utf-8');
  const jsonSchemaStr = await fs.readFile(process.argv[3], 'utf-8');
  const jsonSchema = JSON.parse(jsonSchemaStr);
  const dirPath = process.argv[4];

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

  const keys = Object.keys(jsonSchema);
  await fs.appendFile(`${WORKING_DIR}/output.tsv`, keys.join('\t') + '\n');
  
  const files = await fs.readdir(dirPath);
  for (const file of files.filter(f => f.endsWith('.pdf'))) {
    const pdfFilePath = path.join(dirPath, file);
    const layedOutText = await extractValues(pdfFilePath);
    const result = await callOpenAI(layedOutText, promptTemplate, jsonSchema);
    await fs.appendFile(`${WORKING_DIR}/output.tsv`, Object.values(result).join('\t') + '\n');
  }
}

async function extractValues(pdfFilePath: string) {
  let text = '';
  try {
    text = await getPdfLayoutTextFromDockerRun(pdfFilePath);
    if (!text || text.length === 0 || isTextGarbled(text)) {
      throw new Error('No text, empty text, or garbled text from Docker Run');
    }
  } catch {
    try {
      text = await getPdfLayoutTextFromPdfCo(pdfFilePath);
      if (!text || text.length === 0 || isTextGarbled(text)) {
        throw new Error('No text, empty text, or garbled text from PDF.co');
      }
    } catch {
      text = '';
    }
  }
  return text;
}


async function getPdfLayoutTextFromDockerRun(pdfFilePath:string) {
  return new Promise<string>((resolve, reject) => {
    exec(`docker run -v $(pwd):/app madnight/pdf-layout-text-stripper ${pdfFilePath}`, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function getPdfLayoutTextFromPdfCo(pdfFilePath:string) {
  const res = await axios.post('https://api.pdf.co/v1/pdf/convert/to/text', {
    url: pdfFilePath,
    inline: true,
    ocr: true
  }, {
    headers: {
      'x-api-key': PDF_CO_API_KEY
    }
  });
  return res.data;
}

async function callOpenAI(layedOutText: string, promptTemplate: string, jsonSchema: string) {
  const prompt = `${promptTemplate}\n${jsonSchema}\n${layedOutText}`;
  const res = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
    prompt,
    max_tokens: 64
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    }
  });
  return res.data.choices[0].text.trim();
}

function isTextGarbled(text: string): boolean {
  const totalChars = text.length;
  let nonAsciiChars = 0;

  for (let i = 0; i < totalChars; i++) {
    const ascii = text.charCodeAt(i);
    if (ascii < 32 || ascii > 126) {
      nonAsciiChars++;
    }
  }

  // If more than half of the characters are non-standard ASCII, the text is "garbled"
  return nonAsciiChars / totalChars > 0.5;
}


main().catch(console.error);
