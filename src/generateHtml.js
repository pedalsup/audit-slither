const showdown = require("showdown");
const converter = new showdown.Converter();

// Generate HTML Report
function generateHtml(data, projectName, githubUri) {
  const lowImpactIssues = data.results.detectors.filter(
    (item) =>
      item.impact === "Low" &&
      !item.first_markdown_element.toString().includes("node_modules")
  );
  const mediumImpactIssues = data.results.detectors.filter(
    (item) =>
      item.impact === "Medium" &&
      !item.first_markdown_element.toString().includes("node_modules")
  );
  const highImpactIssues = data.results.detectors.filter(
    (item) =>
      item.impact === "High" &&
      !item.first_markdown_element.toString().includes("node_modules")
  );
  const informationalImpactIssues = data.results.detectors.filter(
    (item) =>
      item.impact === "Informational" &&
      !item.first_markdown_element.toString().includes("node_modules")
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
            width: 25%;
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
              <td>${highImpactIssues.length}</td>
              <td>${mediumImpactIssues.length}</td>
              <td>${lowImpactIssues.length}</td>
              <td>${informationalImpactIssues.length}</td>
            </tr>
          </table>
          </div>
          
          <h2>Technical Details</h2>
          ${
            highImpactIssues.length > 0
              ? `<div class="page-break-after">
                <h3>High</h3>
                <div>
                  ${generateResultsHTML(highImpactIssues, githubUri)}
                </div>
              </div>`
              : ``
          }
  
          ${
            mediumImpactIssues.length > 0
              ? `<div class="page-break-after">
                <h3>Medium</h3>
                <div>
                  ${generateResultsHTML(mediumImpactIssues, githubUri)}
                </div>
              </div>`
              : ``
          }
  
          ${
            lowImpactIssues.length > 0
              ? `<div class="page-break-after">
                <h3>Low</h3>
                <div>
                  ${generateResultsHTML(lowImpactIssues, githubUri)}
                </div>
              </div>`
              : ``
          }
  
          ${
            informationalImpactIssues.length > 0
              ? `<div>
                <h3>Informational</h3>
                <div>
                  ${generateResultsHTML(informationalImpactIssues, githubUri)}
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
function generateResultsHTML(results, githubUri) {
  let html = "";
  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    html += `
            <div class="result">
              <h4>PU-${i < 9 ? "0" + (i + 1) : i + 1} - ${result.impact}: ${
      result.elements.length > 0
        ? result.elements[0].type + result.elements[0].name
        : "Unknown"
    }</h4>
              <div>${
                githubUri
                  ? converter.makeHtml(result.markdown)
                  : result.description
              }</div>
              <div>
                <p>Files affected:</p>
                <ul class="list">${printElements(result.elements)}</ul>
              </div>
            </div>
          `;
  }
  return html;
}

// Generate HTML (List) for elements
function printElements(elements) {
  let html = "";
  for (const element of elements) {
    html += `
              <li>${element.name}:${element.type} - ${element.source_mapping.filename_relative}</li>
          `;
  }
  return html;
}

module.exports = generateHtml;
