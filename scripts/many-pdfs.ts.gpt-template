

async function main(): Promise<void> {
  // Get the promptTemplate from the file in the first command line argument
  // Get the JSON Schema from the json file in the second command line argument

  // Append the keys of the JSON schema to an output TSV file in the working directory
  // For each PDF in the directory provided as the third command line argument
    // get the layed out text from the PDF
    // Using the prompt template with the jsonSchema string and the layed out text, hit the OpenAI API's gpt-4 chat endpoint 
    // Convert the values of the response JSON into TSV ordered the same as the schema
    // Append the TSV to the output TSV file
}

async function extractValues(pdfFilePath: string, jsonSchema: string, promptTemplate: string) {
  // Try getting the layed out text using getPdfLayoutTextFromDockerRun
  // If that failed, or the output was empty, or if the output is garbled,
    // Get the layed out text using getPdfLayoutTextFromPdfCo
  // If both failed, use an empty string
  // return the text 
}

async function extractValues(pdfFilePath: string, jsonSchema: string, promptTemplate: string) {
  // Try getting the layed out text using getPdfLayoutTextFromDockerRun
  // If that failed, or the output was empty, or if the output is garbled,
    // Get the layed out text using getPdfLayoutTextFromPdfCo
  // If both failed, use an empty string
  // return the text 
}

async function getPdfLayoutTextFromDockerRun(pdfFilePath:string) {
  // Run this docker image:
  //   docker run -v $(pwd):/app madnight/pdf-layout-text-stripper pdfFilePath
  // return the STDOUT output as a string
}

async function getPdfLayoutTextFromPdfCo(pdfFilePath:string) {
  // Use the PDF.co api's /pdf/convert/to/text (with layout and ocr) endpoint to convert the PDF file to layed out text
  // Return the full text as a string
}

main().catch(console.error)