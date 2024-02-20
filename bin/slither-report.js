#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { spawn } = require("child_process");
const { fetchContractSourceCode } = require("../src/fetch-contract");
const showdown = require("showdown");

const converter = new showdown.Converter();

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
let github_uri;

const arg = process.argv;
for (let i = 0; i < arg.length; i++) {
  if (arg[i] === "-c" || arg[i] === "--contract") {
    contractAddress = arg[i + 1];
  } else if (arg[i] === "-p" || arg[i] === "--project") {
    projectName = arg[i + 1];
  } else if (arg[i] === "-n" || arg[i] === "--network") {
    networkName = arg[i + 1];
  } else if (arg[i] === "-g" || arg[i] === "--github_uri") {
    github_uri = arg[i + 1];
  }
}

if (contractAddress && !networkName) {
  throw new Error("Please provider network name");
}

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
  slitherProcess = spawn("slither", [
    ".",
    "--json",
    jsonReportPath,
    "--checklist",
    "--markdown-root",
    github_uri,
  ]);
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

  console.log("------Slither report generated successfully------");
}

// Delete file
function deleteFile(path) {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
}

// Generate HTML Report
function generateHTMLReport(data) {
  const lowImapactIssues = data.results.detectors.filter(
    (item) => item.impact === "Low"
  );
  const mediumImapactIssues = data.results.detectors.filter(
    (item) => item.impact === "Medium"
  );
  const highImapactIssues = data.results.detectors.filter(
    (item) => item.impact === "High"
  );
  const imformationalImapactIssues = data.results.detectors.filter(
    (item) => item.impact === "Informational"
  );

  const htmlTemplate = `
      <html>
      <head>
        <title>Report</title>
      </head>
      <style>
        body {
          
          overflow-x: hidden;
          font-size: 12px;
        }
        .page-break-before {
          page-break-before: always;
        }
        
        .page-break-after {
          page-break-after: always;
        }
        
        .avoid-page-break-inside {
          page-break-inside: avoid;
        }

        table {
          border: 1px solid black;
          border-collapse: collapse;
          width: 100%;
          margin-top: 10px;
        }
        th,
        td {
          border: 1px solid black;
          padding: 4px;
          word-break: break-all;
          vertical-align: super;
          text-align: center;
        }
      </style>
      <body>
        <h1>${projectName ? projectName + " -" : ""} Slither Report</h1>

        <div class="page-break-after">
        <h2>Findings Summary</h2>
<p>The following issues were identified during the audit:</p>

        <table>
          <tr>
            <th style="color: red;">High</th>
            <th style="color: orange;">Medium</th>
            <th style="color: blue;">Low</th>
            <th style="color: gray;">Informational</th>
          </tr>
          <tr>
            <td>${highImapactIssues.length}</td>
            <td>${mediumImapactIssues.length}</td>
            <td>${lowImapactIssues.length}</td>
            <td>${imformationalImapactIssues.length}</td>
          </tr>
        </table>
        </div>
        
        <h2>Technical Details</h2>
        ${
          highImapactIssues.length > 0
            ? `<div class="page-break-after">
              <h3>High</h3>
              <div>
                ${generateResultsHTML(
                  data.results.detectors.filter(
                    (item) => item.impact === "High"
                  )
                )}
              </div>
            </div>`
            : ``
        }

        ${
          mediumImapactIssues.length > 0
            ? `<div class="page-break-after">
              <h3>Medium</h3>
              <div>
                ${generateResultsHTML(
                  data.results.detectors.filter(
                    (item) => item.impact === "Medium"
                  )
                )}
              </div>
            </div>`
            : ``
        }

        ${
          lowImapactIssues.length > 0
            ? `<div class="page-break-after">
              <h3>Low</h3>
              <div>
                ${generateResultsHTML(
                  data.results.detectors.filter((item) => item.impact === "Low")
                )}
              </div>
            </div>`
            : ``
        }

        ${
          imformationalImapactIssues.length > 0
            ? `<div>
              <h3>Informational</h3>
              <div>
                ${generateResultsHTML(
                  data.results.detectors.filter(
                    (item) => item.impact === "Informational"
                  )
                )}
              </div>
            </div>`
            : ``
        }
      </body>
      </html>
    `;

  return htmlTemplate;
}

// Generate HTML (Table Row) for results
function generateResultsHTML(results) {
  let html = "";
  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    html += `
          <div class="result">
            <h2>PU-${i < 9 ? "0" + (i + 1) : i + 1} - ${result.impact}: ${
      result.elements.length > 0
        ? result.elements[0].type + result.elements[0].name
        : "Unknown"
    }</h2>
            <div>${converter.makeHtml(result.markdown)}</div>
            <div>
              <p>Files affected:</p>
              <ul class="list">${printElements(result.elements)}</ul>
            </div>
          </div>
        `;
  }
  return html;
}

function printElements(elements) {
  let html = "";
  for (const element of elements) {
    html += `
          <li>${element.name}:${element.type} - ${element.source_mapping.filename_relative}</li>
      `;
  }
  return html;
}
