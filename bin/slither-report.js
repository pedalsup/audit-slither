#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { spawn } = require("child_process");
const { fetchContractSourceCode } = require("../src/fetch-contract");

// Paths
const jsonReportPath = path.join(process.cwd(), "slither.json");
const htmlReportPath = path.join(process.cwd(), "slither.html");
const pdfReportPath = path.join(
  process.cwd(),
  `slither-${Date.now().toString()}.pdf`
);
const contractFilePath = path.join(process.cwd(), "contract.sol");

let contractAddress;
let projectName;
let slitherProcess;
let networkName;

const arg = process.argv;
for (let i = 0; i < arg.length; i++) {
  if (arg[i] === "-c" || arg[i] === "--contract") {
    contractAddress = arg[i + 1];
  } else if (arg[i] === "-p" || arg[i] === "--project") {
    projectName = arg[i + 1];
  } else if (arg[i] === "-n" || arg[i] === "--network") {
    networkName = arg[i + 1];
  }
}

if (contractAddress && !networkName) {
  throw new Error("Please provider network name");
}

deleteFile(jsonReportPath);

if (contractAddress) {
  fetchContractSourceCode(contractAddress, networkName)
    .then((data) => {
      if (data) {
        slitherProcess = spawn("slither", [
          contractFilePath,
          "--json",
          jsonReportPath,
        ]);
        main();
      }
    })
    .catch((err) => {
      console.log(err);
    });
} else {
  slitherProcess = spawn("slither", [".", "--json", jsonReportPath]);
  main();
}

// Main function
async function main() {
  slitherProcess.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  slitherProcess.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  slitherProcess.on("close", () => {
    const jsonData = require(jsonReportPath);
    if (jsonData.success) {
      const html = generateHTMLReport(jsonData);
      fs.writeFileSync(htmlReportPath, html);

      (async () => {
        generatePDF(htmlReportPath, pdfReportPath);
      })();
    }
  });
}

// Generate PDF
async function generatePDF(inputHtmlPath, outputPdfPath) {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  const content = fs.readFileSync(inputHtmlPath, "utf8");

  await page.goto(`data:text/html,${content}`, {
    waitUntil: "domcontentloaded",
  });

  await page.setContent(content);
  await page.pdf({
    path: outputPdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: 10, left: 10, right: 10, bottom: 10 },
  });

  await browser.close();

  deleteFile(inputHtmlPath);
  deleteFile(jsonReportPath);
  deleteFile(contractFilePath);

  console.log("Slither report generated successfully");
}

// Delete file
function deleteFile(path) {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
}

// Generate HTML Report
function generateHTMLReport(data) {
  const htmlTemplate = `
      <html>
      <head>
        <title>Report</title>
      </head>
      <style>
        * {
          margin: 0;
          padding: 0;
        }
        body {
          max-width: 100vw;
          width: 100%;
          overflow-x: hidden;
          font-size: 12px;
        }
        table {
          border: 1px solid black;
          border-collapse: collapse;
          max-width: 100vw;
          width: 100%;
          margin-top: 10px;
        }
        th,
        td {
          border: 1px solid black;
          padding: 4px;
          word-break: break-all;
          vertical-align: super;
        }
      </style>
      <body>
        <h1>${projectName ? projectName + " -" : ""} Slither Report</h1>
  
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

// Generate HTML (Table Row) for results
function generateResultsHTML(results) {
  let html = "";
  for (const result of results) {
    html += `
        <tr class="result">
          <td style="min-width: 70px;">${result.impact}</td>
          <td style="min-width: 70px;">${result.confidence}</td>
          <td style="min-width: 150px;">${result.first_markdown_element}</td>
          <td>${result.description}</td>
          <td style="min-width: 100px;">${result.check}</td>
        </tr>
      `;
  }
  return html;
}
