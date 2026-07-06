import axios from "axios";

export class GroqService {

    private static readonly API_KEY = process.env.GROQ_API_KEY!;

    private static readonly URL =
        "https://api.groq.com/openai/v1/chat/completions";

    // ============================================
    // General Chat
    // ============================================

    static async generate(prompt: string): Promise<string> {

        try {

            const response = await axios.post(

                this.URL,

                {
                    model: "llama-3.3-70b-versatile",

                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],

                    temperature: 0.7,
                    max_tokens: 1024
                },

                {
                    headers: {
                        Authorization: `Bearer ${this.API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }

            );

            return (
                response.data?.choices?.[0]?.message?.content ??
                "No response."
            );

        } catch (error: any) {

            console.error(
                "Groq Error",
                error.response?.data || error.message
            );

            throw new Error("Unable to communicate with Groq.");
        }

    }
}