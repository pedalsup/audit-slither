const { OpenAI } = require("openai");
const dotenv = require("dotenv");
dotenv.config("../../.env");

const assistantAttributePrompt =
  "You are a helpful assistant. You are familiar with Solidity. You will be provided with slither issues description. You will have to respond back with human explanation of the solidity issues description. It should be very clear information providing brief about the issue. The description will also contain code snippets which will give better understanding of issue. Also you should not change the context of issue. Human readable description should be between 20-35 words.";

async function openAi(prompt) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY Key is missing in your environment variables. Please add it and try again.",
    );
  }

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const gptResponse = await openai.chat.completions.create({
    model: "gpt-4", // or another suitable model
    messages: [
      { role: "assistant", content: assistantAttributePrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    n: 1,
  });

  return gptResponse.choices[0].message.content.trim();
}

module.exports = openAi;

// openAi("Reentrancy in StakingContract.unstake(uint256) : External calls: - safeRewardTransfer(msg.sender,pendingReward) - returndata = address(token).functionCall(data,SafeERC20: low-level call failed) - exntToken.safeTransfer(to,amount) - (success,returndata) = target.call{value: value}(data) External calls sending eth: - safeRewardTransfer(msg.sender,pendingReward) - (success,returndata) = target.call{value: value}(data) State variables written after the call(s): - userInfo[msg.sender].amount -= amount StakingContract.userInfo can be used in cross function reentrancies: - StakingContract.getPendingReward() - StakingContract.stake(uint256) - StakingContract.unstake(uint256) - StakingContract.userInfo - userInfo[msg.sender].rewardDebt = (userInfo[msg.sender].amount * accRewardPerShare / 1e16) StakingContract.userInfo can be used in cross function reentrancies: - StakingContract.getPendingReward() StakingContract.stake(uint256) - StakingContract.unstake(uint256) - StakingContract.userInfo").then((data)=>{
//     console.log(data);
// }).catch((err)=>{
//     console.log(err);
// });
