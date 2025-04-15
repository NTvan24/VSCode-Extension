import OpenAI from "openai";
const token = "";
const client = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: token
});
export async function askAzureGPT(question: string, devMode: boolean): Promise<string> {
    
      const rules = ["Bạn là 1 trợ lí chuyên hỗ trợ lập trình cho sinh viên. Bạn sẽ không bao giờ đưa trực tiếp ra code. Nếu sinh viên hỏi cần làm gì tiếp theo, bạn nên đưa ra ý tưởng, hướng đi, hoặc mã giả. Nếu sinh viên đưa ra code của bản thân sinh viên thì bạn nên nhận xét code đó. Bạn không nên đưa ra code của bản thân.",
        "Bạn là 1 trợ lí hỗ trợ lập trình cho người đi làm"
      ];
      let i=0;
      if (devMode) {
          i=1;
      }
      
      console.log("Rule: ", rules[i]);
      try {
        const response = await client.chat.completions.create({
          messages: [
            { role:"system", content: rules[i] },
            { role:"user", content: question }
          ],
          model: "gpt-4o-mini",
          temperature: 1,
          max_tokens: 1024,
          top_p: 1
        });

        return response.choices[0].message.content ?? "No response content";
      }
     catch (error) {
        console.error("Lỗi khi gọi API Azure OpenAI:", error);
        return "Lỗi khi gọi API Azure OpenAI!";
    }
}

export async function gptForRAG(question: string): Promise<string> {
  
    const rules = "Tôi sẽ đưa bạn 1 context . Nếu nội dung câu hỏi có liên quan trong phần context, hãy trả lời câu hỏi bằng thông tin có trong context, hạn chế lấy thông tin ngoài context , dòng cuối 1 dòng riêng ghi nguồn theo định dạng 'Nguồn:+tên file' . Nếu context không chứa thông tin gì có ích, hãy trả lời là thông tin không có trong database";
    
    console.log("Rule: ", rules);
    try {
      const response = await client.chat.completions.create({
        messages: [
          { role:"system", content: rules },
          { role:"user", content: question }
        ],
        model: "gpt-4o-mini",
        temperature: 1,
        max_tokens: 1024,
        top_p: 1
      });

      return response.choices[0].message.content ?? "No response content";
    }
   catch (error) {
      console.error("Lỗi khi gọi API Azure OpenAI:", error);
      return "Lỗi khi gọi API Azure OpenAI!";
  }
}

