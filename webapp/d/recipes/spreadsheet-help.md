<webui-data data-page-title="Get Help with a Spreadsheet" data-page-subtitle="A recipe for formulas that work" data-page-description="A step-by-step recipe, with a prompt to copy, for getting a spreadsheet formula from your AI assistant, with an explanation and a way to check it."></webui-data>

<webui-quote theme="title">
You know what you want your spreadsheet to tell you, but not the formula to get there. Describe your sheet and the answer you want, and your assistant will write the formula, explain it, and tell you how to check it.
</webui-quote>

## What you'll need

<webui-page-segment elevation="10">

- Which spreadsheet app you use: Excel, Google Sheets, Numbers, or another. Formulas differ a little between them.
- How your sheet is set up: what's in each column, and which row your data starts on.
- What you want to work out, in plain words.

</webui-page-segment>

## Your prompt

<webui-page-segment elevation="10">
<app-prompt-cards recipe="spreadsheet-help"></app-prompt-cards>
</webui-page-segment>

Everything here runs in your browser. Nothing you type is sent anywhere until you paste it into your assistant yourself.

## How to use it

<webui-page-segment elevation="10">

1. **Describe your columns,** like "column A is the date, column B the customer, column C the amount, and the data starts in row 2". Include the column letters.
1. **Copy the prompt** and paste it into a new chat with your assistant.
1. **Try the formula on a copy** of your sheet first, or in an empty column.
1. **Check the result** against a few rows you can add up yourself.
1. **If it doesn't work,** paste the error message or describe what went wrong, and ask it to fix the formula.

</webui-page-segment>

## Tips from your squire

<webui-page-segment elevation="10">

- **Describe the data, don't paste it.** Leave out real names, account numbers, and anything private. A made-up example row works just as well.
- **Ask what each part does.** You'll be able to fix the formula yourself next time, and you'll notice if something looks wrong.
- **Check with numbers you know.** Assistants can get formulas slightly wrong, like using the wrong column or missing the last row. A quick test catches it.
- **Ask for a simpler way.** Sometimes a filter, a sort, or a pivot table is easier than a formula. Ask "Is there an easier way to do this?"

</webui-page-segment>

## An example

<webui-page-segment elevation="10">

A small business owner keeps sales in Google Sheets: the date in column A, the customer in column B, and the amount in column C. They want each customer's total for the month. The assistant suggests a SUMIFS formula, explains which part picks the customer and which part picks the dates, and tells them to check one customer's total by hand. It matches, so they copy the formula down the column.

</webui-page-segment>

More recipes are in the [Prompt Cards](/prompt-cards) tool.
