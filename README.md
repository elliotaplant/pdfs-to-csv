# PDFLayoutTextStripper as docker container command-line utility

[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()
[![](https://images.microbadger.com/badges/image/madnight/pdf-layout-text-stripper.svg)](https://microbadger.com/images/madnight/pdf-layout-text-stripper "Get your own image badge on microbadger.com")
[![](https://travis-ci.org/madnight/pdf-layout-text-stripper.svg)](https://travis-ci.org/madnight/pdf-layout-text-stripper)
[![Code Climate](https://lima.codeclimate.com/github/madnight/pdf-layout-text-stripper/badges/gpa.svg)](https://lima.codeclimate.com/github/madnight/pdf-layout-text-stripper)
[![Issue Count](https://lima.codeclimate.com/github/madnight/pdf-layout-text-stripper/badges/issue_count.svg)](https://lima.codeclimate.com/github/madnight/pdf-layout-text-stripper)

Converts a PDF file into a text file while keeping the layout of the original PDF. Useful to extract the content from a table or a form in a PDF file. PDFLayoutTextStripper is a subclass of PDFTextStripper class (from the [Apache PDFBox](https://pdfbox.apache.org/) library).

* Use cases
* How to use

## Use cases
Data extraction from a table in a PDF file
![example](https://i.imgur.com/6z8OG2O.png)
-
Data extraction from a form in a PDF file
![example](https://i.imgur.com/JB7PxKJ.png)

## How to use

```bash
# i do it myself
docker build -t pdf-layout-text-stripper .
docker run -v $(pwd):/app pdf-layout-text-stripper "sample.pdf"

# i'm lazy
docker run -v $(pwd):/app madnight/pdf-layout-text-stripper "sample.pdf"
```

## How to use with GPT-4

Assuming you've built the image, use the run command to create a text version of the PDF:

```
docker run -v $(pwd):/app pdf-layout-text-stripper ./path/to/input.pdf > ./path/to/output.txt
```

Then, copy the the prompt2.md file into https://platform.openai.com/playground?mode=chat&model=gpt-4

Copy the text output between the `"""` marks in the prompt

Run the prompt

Turn the results into a TSV and paste into your spreadsheet

## Advanced GPT usage

Define your schema in JSON Schema format. See `prompt-2.md` for an example, and use ChatGPT to create your own.

Create your prompt with your schema (again, see `prompt-2.md`).

Get your folder of PDF files.

For each PDF in a folder:
- Run the PDFLayoutTextStripper script on the PDF: 
```
docker run -v $(pwd):/app madnight/pdf-layout-text-stripper $PDF > ./path/to/output/$PDF.txt
```
- If the tool failed (either an error, the output file is garbage, or the output file is empty)
  - Go to the PDF.co https://app.pdf.co/request-tester#
  - Use the /pdf/convert/to/text (with layout and ocr) example
  - Hit "+ add file"
  - Select the PDF that failed to upload
  - Hit "Run Request"
  - Wait
  - Click the link that follows "Output files (click to preview):"
  - Copy the layed-out text and save it to a file
- Put the layed-out text inside the template location in your prompt into the OpenAI API playground
- Copy the JSON output and turn it into a TSV line. I did that like this:
```
pbpaste | jq -r '[.Vendor, .Description, ."Invoice Number", ."From Email", ."From Address", ."Date Issued", ."Payment Due Date", .Amount, .Currency] | @tsv' | pbcopy
```
- Paste the output into your spreadsheet

