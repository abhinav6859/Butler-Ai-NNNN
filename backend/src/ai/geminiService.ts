import axios from "axios";

export class GeminiService {

    private static readonly API_KEY =
        process.env.GEMINI_API_KEY!;

    private static readonly URL =
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.API_KEY}`;

    // ============================================
    // General Chat
    // ============================================

    static async generate(prompt: string): Promise<string> {

        try {

            const response = await axios.post(

                this.URL,

                {

                    contents: [

                        {

                            role: "user",

                            parts: [

                                {

                                    text: prompt

                                }

                            ]

                        }

                    ]

                },

                {

                    headers: {

                        "Content-Type": "application/json"

                    }

                }

            );

            return (

                response.data
                ?.candidates?.[0]
                ?.content?.parts?.[0]
                ?.text || "No response."

            );

        }

        catch (error: any) {

            console.error(

                "Gemini Error",

                error.response?.data || error.message

            );

            throw new Error(

                "Unable to communicate with Gemini."

            );

        }

    }

}