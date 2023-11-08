require("dotenv").config();
const fs = require("fs");
const path = require("path");

let etherscanApiKey = process.env.ETHERSCAN_API_KEY;
let polygonscanApiKey = process.env.POLYGONSCAN_API_KEY;
let basescanApiKey = process.env.BASESCAN_API_KEY;
const contractPath = path.join(process.cwd(), "contract.sol");
const folderPath = path.join(process.cwd(), `slither-${Date.now().toString()}`);

async function fetchContractSourceCode(contractAddress, networkName) {
  let url;

  if (networkName === "polygon") {
    if (!polygonscanApiKey) {
      throw new Error(
        "Please provide polygonscan api key in env configuration with name of `POLYGONSCAN_API_KEY`"
      );
    }
    url = `https://api.polygonscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${polygonscanApiKey}`;
  } else if (networkName === "ethereum") {
    if (!etherscanApiKey) {
      throw new Error(
        "Please provide etherscan api key in env configuration with name of `ETHERSCAN_API_KEY`"
      );
    }
    url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${etherscanApiKey}`;
  } else if (networkName === "base") {
    if (!basescanApiKey) {
      throw new Error(
        "Please provide etherscan api key in env configuration with name of `BASESCAN_API_KEY`"
      );
    }
    url = `https://api.basescan.org/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${basescanApiKey}`;
  } else {
    throw new Error("Invalid network name");
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const rJson = await response.json();

    if (rJson.status === "1") {
      const sourceCode = rJson.result[0].SourceCode;

      if (!sourceCode) {
        throw new Error(`Contract not found on ${networkName}`);
      }
      if (sourceCode[0] !== "{") {
        fs.writeFileSync(contractPath, sourceCode);
        return true;
      } else {
        throw new Error("Contract address has more than one contract");
      }
    } else {
      throw new Error("Contract source code not found on Etherscan.");
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error fetching contract source code:", error);
  }
}

module.exports = { fetchContractSourceCode };
