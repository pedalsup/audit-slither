#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { spawn } = require("child_process");
const { fetchContractSourceCode } = require("../src/lib/fetch-contract");
const {generateHtml} = require("../src/lib/generateHtml");

// Paths
const jsonReportPath = path.join(process.cwd(), "slither.json");
const htmlReportPath = path.join(process.cwd(), "slither.html");
const pdfReportPath = path.join(
  process.cwd(),
  `Audai-Audit-Report-${new Date().toDateString()}.pdf`
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

  slitherProcess.on("close", async() => {
    const jsonData = require(jsonReportPath);
    if (jsonData.success) {
      const html = await generateHtml(jsonData, projectName, githubUri);
      fs.writeFileSync(htmlReportPath, html);

      (async () => {
        generatePDF(htmlReportPath, pdfReportPath);
      })();
    }
  });
}

const getFileContent = async (filePath) => {
  const cssPath = path.join(__dirname, filePath);
  const parts = cssPath.split(path.sep);
  const libIndex = parts.indexOf('bin');
  if (libIndex > -1) {
      parts.splice(libIndex, 1);
  }

  const cssFilePath = parts.join(path.sep);
  const cssContent = await fs.promises.readFile(cssFilePath, 'utf8');

  return cssContent;
};

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

  const logoIconSvg = await getFileContent('src/assets/logo_icon.svg');
  const logoNameIconSvg = await getFileContent('src/assets/logo_name_icon.svg');

  await page.addStyleTag({
    content: "@page:first {margin-top: 0; margin-bottom: 150px;}"
  });
  await page.setContent(content);
  await page.pdf({
    path: outputPdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "80px", bottom: "20px", left: "40px", right: "40px" },
    displayHeaderFooter: true, 
    headerTemplate: `<!doctype html>
    <html>
    <style>
    html {
      -webkit-print-color-adjust: exact;
    }
    </style>
      <body>
        <div style='
          position: fixed;
          top: 0;
          width: 100%;
          height: 80px;
          font-size: 10px;
          background-color: #000;
      ' >
          <div style='
          background-color: #000000;
            font-size: 32px;
            display: flex;
            flex-direction: column;
            padding-inline: 40px;
          '>
            <a href="https://www.audai.xyz/" style="
            text-decoration: none;
            color: #ffffff;
            display : flex;
            align-items: center;
            justify-direction: row;
            ">
            <div style= "
            padding-right: 10px;
            ">
              ${logoIconSvg}
              </div>
              <div>
              ${logoNameIconSvg}
              </div>
            </a>
            <div style='
              font-size: 20px;
              color: #ffffff;
            '>
            Audit Report
          </div>
        </div>
      </div>
      </body>
    </html>`,
    
    footerTemplate: `<footer style=' 
      position: fixed;
      bottom: 0;
      width: 100%;
      height: 20px;
      font-size: 10px;
      color: Black;
      background-color:Black;
      '>
        <div style=' 
          font-size: 10px;
          color: rgb(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-inline: 40px;
          margin-top: 5px;
        ' >
          <div>
            Audit Report
          </div>
          <div style='
            text-align: right;
          '>
            <span>Page</span> <span class='pageNumber'></span>
          </div>
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
