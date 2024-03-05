require("dotenv").config();

const config = {
  get etherscanApiKey() {
    return process.env.ETHERSCAN_API_KEY;
  },
  get polygonscanApiKey() {
    return process.env.POLYGONSCAN_API_KEY;
  },
  get basescanApiKey() {
    return process.env.BASESCAN_API_KEY;
  },
  get openaiApiKey() {
    return process.env.OPENAI_API_KEY;
  },
};

module.exports = config;
