import OpenAI from "openai";
const token = "NAH";
export async function askAzureGPT(question: string): Promise<string> {
    const client = new OpenAI({
        baseURL: "https://models.inference.ai.azure.com",
        apiKey: token
      });
      const rules = "Bạn là 1 trợ lí chuyên hỗ trợ lập trình cho sinh viên. Bạn sẽ không bao giờ đưa trực tiếp ra code. Nếu sinh viên hỏi cần làm gì tiếp theo, bạn nên đưa ra ý tưởng, hướng đi, hoặc mã giả. Nếu sinh viên đưa ra code của bản thân sinh viên thì bạn nên nhận xét code đó. Bạn không nên đưa ra code của bản thân.";
      try {
        const response = await client.chat.completions.create({
          messages: [
            { role:"system", content: rules },
            { role:"user", content: question }
          ],
          model: "gpt-4o",
          temperature: 1,
          max_tokens: 4096,
          top_p: 1
        });

        return response.choices[0].message.content ?? "No response content";
      }
     catch (error) {
        console.error("Lỗi khi gọi API Azure OpenAI:", error);
        return "Lỗi khi gọi API Azure OpenAI!";
    }
}
