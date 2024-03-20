const showdown = require("showdown");
const converter = new showdown.Converter();
const fs = require("fs");
const path = require("path");
// const openAi = require("./openai");

const getFileContent = async (filePath) => {
  const cssPath = path.join(__dirname, filePath);
  const parts = cssPath.split(path.sep);
  const libIndex = parts.indexOf("lib");
  if (libIndex > -1) {
    parts.splice(libIndex, 1);
  }

  const cssFilePath = parts.join(path.sep);
  const cssContent = await fs.promises.readFile(cssFilePath, "utf8");

  return cssContent;
};

// Generate HTML Report
async function generateHtml(data, projectName, githubUri) {
  const cssStyleContent = await getFileContent("styles/style.css");
  const cssGlobalContent = await getFileContent("styles/global.css");

  const mediumIconSvg = await getFileContent("assets/medium_icon.svg");
  const highIconSvg = await getFileContent("assets/high_icon.svg");
  const lowIconSvg = await getFileContent("assets/low_icon.svg");
  const informationalIconSvg = await getFileContent(
    "assets/informational_icon.svg",
  );
  const highBoldIconSvg = await getFileContent("assets/high_bold_icon.svg");
  const mediumBoldIconSvg = await getFileContent("assets/medium_bold_icon.svg");
  const lowBoldIconSvg = await getFileContent("assets/low_bold_icon.svg");

  const lowImpactIssues = data.results.detectors.filter(
    (item) =>
      item.impact === "Low" &&
      !item.first_markdown_element.toString().includes("node_modules"),
  );
  const mediumImpactIssues = data.results.detectors.filter(
    (item) =>
      item.impact === "Medium" &&
      !item.first_markdown_element.toString().includes("node_modules"),
  );
  const highImpactIssues = data.results.detectors.filter(
    (item) =>
      item.impact === "High" &&
      !item.first_markdown_element.toString().includes("node_modules"),
  );
  const informationalImpactIssues = data.results.detectors.filter(
    (item) =>
      item.impact === "Informational" &&
      !item.first_markdown_element.toString().includes("node_modules"),
  );
  const highHtmlContent = await generateResultsHTML(
    highImpactIssues,
    githubUri,
    "high",
  );
  const mediumHtmlContent = await generateResultsHTML(
    mediumImpactIssues,
    githubUri,
    "medium",
  );
  const lowHtmlContent = await generateResultsHTML(
    lowImpactIssues,
    githubUri,
    "low",
  );
  const informationalHtmlContent = await generateResultsHTML(
    informationalImpactIssues,
    githubUri,
    "informational",
  );

  const htmlTemplate = `
        <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Sora:wght@100..800&display=swap" rel="stylesheet">
        </head>
        <style>   
          ${cssGlobalContent}
          ${cssStyleContent}
        </style>
        <body>
          <div class="summary-section">
            <div class="summary-section-inner">
              <div class="bg-heading">Summary</div>
              <div class="heading">Finding Summary</div>
            </div>
            <p>The following issues were identified during the audit:</p>
          </div>
          <div class="table-box">
            <div class="table-box-high table-box-inner">
              <div class="table-box-inner-info">
                <div class="table-box-inner-icon">
                  ${highIconSvg}
                </div>
                <div class="table-box-inner-title">High</div>
              </div>
              <div class="table-box-inner-value">${highImpactIssues.length}</div>
            </div>
            <div class="table-box-medium table-box-inner">
              <div class="table-box-inner-info">
                <div class="table-box-inner-icon">
                ${mediumIconSvg}
                </div>
                <div class="table-box-inner-title">Medium</div>
              </div>
              <div class="table-box-inner-value">${mediumImpactIssues.length}</div>
            </div>
            <div class="table-box-low table-box-inner">
              <div class="table-box-inner-info">
                <div class="table-box-inner-icon">
                ${lowIconSvg}
                </div>
                <div class="table-box-inner-title">Low</div>
              </div>
              <div class="table-box-inner-value">${lowImpactIssues.length}</div>
            </div>
            <div class="table-box-informational table-box-inner">
              <div class="table-box-inner-info">
                <div class="table-box-inner-icon">
                ${informationalIconSvg}
                </div>
                <div class="table-box-inner-title">Informational</div>
              </div>
              <div class="table-box-inner-value">${informationalImpactIssues.length}</div>
            </div>
          </div>

          <div class="technical-section-inner">
            <div class="bg-heading">Technical</div>
            <div class="heading">Technical Details</div>
          </div>
          ${
            highImpactIssues.length > 0
              ? `<div>
                <div class="high_label label">
                <div style="
                  display : flex;
                  align-items: center;
                  justify-direction: row;
                  ">
                    <div style= "
                    padding-right: 10px;
                    ">${highBoldIconSvg}</div>
                    <div>High</div>
                  </div>
                  <div>
                    ${highImpactIssues.length}
                  </div>
                </div>
                <div>
                  ${highHtmlContent}
                </div>
              </div>`
              : ""
          }
  
          ${
            mediumImpactIssues.length > 0
              ? `<div>
                <div class="medium_label label">
                  <div style="
                  display : flex;
                  align-items: center;
                  justify-direction: row;
                  ">
                    <div style= "
                    padding-right: 10px;
                    ">${mediumBoldIconSvg}</div>
                    <div>Medium</div>
                  </div>
                  <div>
                    ${mediumImpactIssues.length}
                  </div>
                </div>
                <div>
                  ${mediumHtmlContent}
                </div>
              </div>`
              : ""
          }
  
          ${
            lowImpactIssues.length > 0
              ? `<div>
              <div class="low_label label">
              <div style="
                  display : flex;
                  align-items: center;
                  justify-direction: row;
                  ">
                    <div style= "
                    padding-right: 10px;
                    ">${lowBoldIconSvg}</div>
                    <div>Low</div>
                  </div>
              <div>
                ${lowImpactIssues.length}
              </div>
            </div>
                <div>
                  ${lowHtmlContent}
                </div>
              </div>`
              : ""
          }
  
          ${
            informationalImpactIssues.length > 0
              ? `<div>
                <div class="informational_label label">
                <div style="
                display : flex;
                align-items: center;
                justify-direction: row;
                justify-content: space-between;
                ">
                  <div style= "
                  padding-right: 10px;
                  ">${lowBoldIconSvg}</div>
                  <div>Informational</div>
                </div>
                <div>
                  ${informationalImpactIssues.length}
                </div>
              </div>
                <div>
                  ${informationalHtmlContent}
                </div>
              </div>`
              : ""
          }
        </body>
        </html>
      `;

  return htmlTemplate;
}

// Generate HTML (Table Row) for results
async function generateResultsHTML(results, githubUri, issueType) {
  let html = "";
  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    // const gptDescription = await openAi(
    //   githubUri ? result.markdown : result.description,
    // );
    const gptDescription = "GPT Description";

    html += `
            <div class="result">
              ${i !== 0 ? "<p class='underline'/>" : ""}
              
              <p class="${issueType}-background background">AD${
                i < 9 ? "0" + (i + 1) : i + 1
              } - ${result.impact}</p>

              <p class="capitalize"> ${
                result.elements.length > 0
                  ? result.elements[0].type + " " + result.elements[0].name
                  : "Unknown"
              }</p>
    
              <div class="files-detail-wrapper">
                <p class="description">Description :</p>
                <div class="description-inner-text">
                    ${gptDescription}
                </div>
              </div>
              <div class="files-detail-wrapper">  
                <p class="description">Technical Description :</p>
                <div class="description-inner-text">
                  ${
                    githubUri
                      ? converter.makeHtml(result.markdown)
                      : result.description
                  }
                </div>
              </div>

              <div class="files-detail-wrapper">
                <p class="description">Files affected :</p>
                <ul class="description-inner-list">${printElements(result.elements)}</ul>
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

module.exports = {
  generateHtml,
  getFileContent,
};
