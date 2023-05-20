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

async function convertUploadedPdfToText(apiKey: string, uploadedFileUrl: string) {
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

export async function convertPdfToTextFromPdfCo(apiKey: string, sourceFile: string) {
  const uploadedFileUrl = await uploadFile(apiKey, sourceFile);
  return await convertUploadedPdfToText(apiKey, uploadedFileUrl);
}
