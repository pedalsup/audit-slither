# slither-audit

**Version:** 1.0.1

![npm](https://img.shields.io/npm/v/slither-audit)

![npm](https://img.shields.io/npm/dw/slither-audit)

## Overview

The "slither-audit" npm CLI tool is a utility for generating detailed Slither reports for Ethereum smart contracts and converting them into PDF format. It simplifies the process of analyzing Ethereum smart contracts for security vulnerabilities using the Slither static analysis framework.

Key features of the tool include:

- Automated Slither Analysis: Easily run Slither analysis on Ethereum smart contracts directly from the command line.
- Customizable PDF Reports: Convert Slither reports into well-structured PDF documents for easy sharing and documentation.
- Detailed Insights: Get insights into contract vulnerabilities, including impact, confidence, location, description, and check information.
- User-Friendly Interface: The generated PDF reports are presented in a user-friendly tabular format for easy understanding.

## Installation

You can install the "slither-audit" CLI tool globally using npm. Make sure you have Node.js and npm installed on your system.

```bash
npm install -g slither-audit
```

OR

```bash
npx slither-audit
```

## Usage

After installation, you can use the "slither-audit" CLI tool as follows:

1. Navigate to the directory containing your Ethereum smart contracts.
2. Open your terminal and run the following command:

   ```bash
   slither-audit
   ```

3. The tool will automatically perform Slither analysis on the Ethereum smart contracts in the current directory.
4. It will generate a detailed Slither report and convert it into a PDF document for easy access and sharing.
5. run following command for analysis of contract address:

   ```base
   slither-audit contract=<contract_address> network=<network_name>
   ```

- network can be ethereum, polygon or base.

6. pass project name for pdf title, run command:

   ```base
   slither-audit contract=<contract_address> network=<network_name> project=<project_name>
   ```

## Dependencies

The "slither-audit" CLI tool relies on the following dependencies:

- Puppeteer: Used for converting HTML reports into PDF format.
- Dotenv: Used for keep secrets with key and value.
