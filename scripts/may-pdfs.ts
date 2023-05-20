import { promises as fs } from 'fs';
import axios from 'axios';
import { exec } from 'child_process';
import path from 'path';

async function main(): Promise<void> {
  const promptTemplate = await fs.readFile(process.argv[2], 'utf-8');
  const jsonSchema = JSON.parse(await fs.readFile(process.argv[3], 'utf-8'));
  const dirPath = process.argv[4];

  const keys = Object.keys(jsonSchema);
  await fs.appendFile('./output.tsv', keys.join('\t') + '\n');
  
  const files = await fs.readdir(dirPath);
  for (const file of files.filter(f => f.endsWith('.pdf'))) {
    const pdfFilePath = path.join(dirPath, file);
    const layedOutText = await extractValues(pdfFilePath, jsonSchema, promptTemplate);
    const result = await callOpenAI(layedOutText, promptTemplate, jsonSchema);
    await fs.appendFile('./output.tsv', Object.values(result).join('\t') + '\n');
  }
}

async function extractValues(pdfFilePath: string, jsonSchema: string, promptTemplate: string) {
  let text = '';
  try {
    text = await getPdfLayoutTextFromDockerRun(pdfFilePath);
    if (!text || text.length === 0) {
      throw new Error('No text or empty text from Docker Run');
    }
  } catch {
    try {
      text = await getPdfLayoutTextFromPdfCo(pdfFilePath);
      if (!text || text.length === 0) {
        throw new Error('No text or empty text from PDF.co');
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
      'x-api-key': '<PDF_CO_API_KEY>'
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
      'Authorization': `Bearer <OPENAI_API_KEY>`
    }
  });
  return res.data.choices[0].text.trim();
}

main().catch(console.error);
