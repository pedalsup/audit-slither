#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { spawn } = require("child_process");
const { fetchContractSourceCode } = require("../src/fetch-contract");
const generateHtml = require("../src/generateHtml");

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
let githubUri;

const arg = process.argv;
for (let i = 0; i < arg.length; i++) {
  if (arg[i] === "-c" || arg[i] === "--contract") {
    contractAddress = arg[i + 1];
  } else if (arg[i] === "-p" || arg[i] === "--project") {
    projectName = arg[i + 1];
  } else if (arg[i] === "-n" || arg[i] === "--network") {
    networkName = arg[i + 1];
  } else if (arg[i] === "-g" || arg[i] === "--github_uri") {
    githubUri = arg[i + 1];
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
    githubUri,
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
      const html = generateHtml(jsonData, projectName, githubUri);
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
    margin: { top: 40, left: 40, right: 40, bottom: 40 },
    displayHeaderFooter: true,
    headerTemplate: `<header style='
      width: 100%;
      font-size: 10px;
      color: #000;
      padding-inline: 40px;
      padding-bottom: 10px;
      margin-bottom: 10px;
      border-bottom: 1px solid #000;
    '>
      <div>
        Pedalsup
      </div>
    </header>`,
    footerTemplate: `<footer style=' 
      width: 100%;
      font-size: 10px;
      color: #000;
      padding-inline: 40px;
      padding-top: 10px;
      border-top: 1px solid #000;
    '>
      <div
        style='
          text-align: right;
        '
      >
        <span class='pageNumber'></span> / <span class='totalPages'></span>  
      </div>
    </footer>`,
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
