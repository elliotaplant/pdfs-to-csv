import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const PDF_CO_API_KEY = process.env.PDF_CO_API_KEY;

async function uploadFile(apiKey: string, sourceFile: string) {
  const fileName = path.basename(sourceFile);
  const url = `https://api.pdf.co/v1/file/upload/get-presigned-url?name=${fileName}&contenttype=application/octet-stream`;
  const response: AxiosResponse = await axios.get(url, {
    headers: { 'x-api-key': apiKey },
  });
  if (response.data.error === false) {
    const fileData = fs.readFileSync(sourceFile);
    await axios.put(response.data.presignedUrl, fileData, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    return response.data.url;
  } else {
    throw new Error(response.data.message);
  }
}

async function convertPdfToText(apiKey: string, uploadedFileUrl: string) {
  const requestData = { url: uploadedFileUrl };

  const response: AxiosResponse = await axios.post(
    `https://api.pdf.co/v1/pdf/convert/to/text`,
    requestData,
    {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.data.error === false) {
    const resultResponse: AxiosResponse<string> = await axios.get(response.data.url, {
      responseType: 'text',
    });
    return resultResponse.data;
  } else {
    throw new Error(response.data.message);
  }
}

async function main() {
  if (!PDF_CO_API_KEY) {
    throw new Error('API key necessary');
  }
  // Local path to your PDF file
  const sourceFile: string = process.argv[2];
  const destinationFile: string = process.argv[3];

  if (!destinationFile || !sourceFile) {
    throw new Error('where did they come from, where did they go?');
  }

  try {
    const uploadedFileUrl = await uploadFile(PDF_CO_API_KEY, sourceFile);
    const result = await convertPdfToText(PDF_CO_API_KEY, uploadedFileUrl);
    console.log('result', result);
  } catch (error) {
    console.log(error.message);
  }
}

main();
