#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { spawn } = require("child_process");

const jsonReportPath = path.join(process.cwd(), "slither-report.json");
const htmlReportPath = path.join(process.cwd(), "slither-report.html");
const pdfReportPath = path.join(process.cwd(), "slither-report.pdf");

if (fs.existsSync(jsonReportPath)) {
  fs.unlinkSync(jsonReportPath);
}

const slitherProcess = spawn("slither", [".", "--json", jsonReportPath]);

slitherProcess.stdout.on("data", (data) => {
  console.log(data.toString());
});

slitherProcess.stderr.on("data", (data) => {
  console.error(data.toString());
});

slitherProcess.on("close", (code) => {
  //   if (code === 0) {
  const jsonData = require(jsonReportPath);
  const html = generateHTMLReport(jsonData);

  fs.writeFileSync(htmlReportPath, html);

  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const content = fs.readFileSync(htmlReportPath, "utf8");

    await page.setContent(content);
    await page.pdf({ path: pdfReportPath, format: "A4" });

    await browser.close();

    if (fs.existsSync(htmlReportPath)) {
      fs.unlinkSync(htmlReportPath);
    }

    console.log("Slither report generated successfully and converted to PDF");
  })();
  //   } else {
  //     console.error("Slither report generation failed");
  //   }
});

function generateHTMLReport(data) {
  const htmlTemplate = `
      <html>
      <head>
        <title>Report</title>
      </head>
      <style>
      table {
        border: 1px solid black;
        border-collapse: collapse;
      }
      th,
      td {
        border: 1px solid black;
        padding: 4px;
      }
    </style>
      <body>
        <h1>Slither Report</h1>
  
        <table id="result-table">
          <tr>
            <th>Impact</th>
            <th>Confidence</th>
            <th>Location</th>
            <th>Description</th>
            <th>Check</th>
          </tr>
          ${generateResultsHTML(data.results.detectors)}
        </table>
  
       
      </body>
      </html>
    `;

  return htmlTemplate;
}

function generateResultsHTML(results) {
  let html = "";
  for (const result of results) {
    html += `
        <tr class="result">
          <td>${result.impact}</td>
          <td>${result.confidence}</td>
          <td>${result.first_markdown_element}</td>
          <td>${result.description}</td>
          <td>${result.check}</td>
        </tr>
      `;
  }
  return html;
}
