import { promises as fs } from 'fs';
import axios from 'axios';
import { exec } from 'child_process';
import path from 'path';
import { convertPdfToTextFromPdfCo } from './pdf.co';

export async function processPdf(
  dirPath: string,
  file: string,
  workingDir: string,
  promptTemplate: string,
  jsonSchemaStr: string,
  openAiApiKey: string,
  pdfCoApiKey: string,
) {
  const pdfFilePath = path.join(dirPath, file);
  console.log('Processing', pdfFilePath);

  let layedOutText: string = '';
  let result: object | null = null;

  const textCachePath = `${workingDir}/cache/${path.basename(file, '.pdf')}.txt`;

  // Check for cached text file
  try {
    layedOutText = await fs.readFile(textCachePath, 'utf-8');
    console.log('  Loaded text from cache');
    if (layedOutText) {
      result = await callOpenAI(layedOutText, promptTemplate, jsonSchemaStr, openAiApiKey);
      console.log('  GPT-4 API called successfully. Result:');
      console.log('  ', JSON.stringify(result));
    }
  } catch {
    console.log('  Cache miss, extracting text');
  }

  if (!result || !gotValues(result)) {
    // Try extracting text with Docker Run and calling GPT-4
    try {
      layedOutText = await getPdfLayoutTextFromDockerRun(pdfFilePath);
      console.log('  Got layedOutText from Docker Run');
      result = await callOpenAI(layedOutText, promptTemplate, jsonSchemaStr, openAiApiKey);
    } catch (error) {
      console.log('  Failed to get layedOutText from Docker Run');
    }
    if (result && gotValues(result)) {
      await fs.writeFile(textCachePath, layedOutText);
      console.log('  Text cached for future use');
      console.log('  GPT-4 API called successfully. Result:');
      console.log('  ', JSON.stringify(result));
    } else {
      // If failed, try extracting text with PDF.co and calling GPT-4 again
      console.log('  Failed to find values from Docker Run results, trying with PDF.co');
      layedOutText = await convertPdfToTextFromPdfCo(pdfCoApiKey, pdfFilePath);
      console.log('  Got layedOutText from PDF.co');
      await fs.writeFile(textCachePath, layedOutText);
      console.log('  Text cached for future use');
      result = await callOpenAI(layedOutText, promptTemplate, jsonSchemaStr, openAiApiKey);
      console.log('  GPT-4 API called successfully. Result:');
      console.log('  ', JSON.stringify(result));
    }
  }

  return result;
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
  openAiApiKey: string,
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
        'Authorization': `Bearer ${openAiApiKey}`,
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
