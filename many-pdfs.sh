#!/bin/bash

PDF_DIR="$1";

for PDF in $PDF_DIR/*;
  do echo $PDF;
done;