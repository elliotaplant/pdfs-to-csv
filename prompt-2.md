Act as a PDF value extraction tool. Extract the following fields into an object with this schema:

```
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "Vendor": {
      "type": "string",
      "description": "The name of the vendor who issued the invoice"
    },
    "Description": {
      "type": "string",
      "description": "A description of what the invoice is for"
    },
    "Invoice Number": {
      "type": "string",
      "description": "An alphanumeric identifier for the invoice"
    },
    "From Email": {
      "type": "string",
      "description": "The email address of the company who issued the invoice",
      "format": "email"
    },
    "From Address": {
      "type": "string",
      "description": "The mailing address of the company who issued the invoice excluding newlines"
    },
    "Date Issued": {
      "type": "string",
      "description": "The date the invoice was issued",
      "format": "date"
    },
    "Payment Due Date": {
      "type": "string",
      "description": "The date payment is due, or the date issued if the payment is due upon receipt",
      "format": "date"
    },
    "Amount": {
      "type": "number",
      "description": "The numeric amount for the total amount due for the invoice with two decimal places"
    },
    "Currency": {
      "type": "string",
      "description": "The three digit currency code for the total amount due",
      "pattern": "^[A-Z]{3}$"
    }
  }
}
```

Return result in JSON format without any explanation. For unknown fields, use the empty string as a value. 

Here is a sample PDF represented by text:

"""
"""