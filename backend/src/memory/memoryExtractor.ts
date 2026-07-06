import { GroqService } from "../ai/groqService";
import { MemoryService } from "./memoryService";

export class MemoryExtractor {

    static async extract(

        userId: string,

        userMessage: string,

        aiResponse: string

    ) {

        try {

            const prompt = `

You are an AI memory extractor.

Extract ONLY long-term information.

Do NOT store greetings.

Do NOT store temporary questions.

Do NOT store today's weather.

Store only information useful for future conversations.

Examples:

"My name is Abhinav"

"My favourite breakfast is Poha"

"I am vegetarian"

"I wake up at 6 AM"

"I am allergic to peanuts"

Return JSON only.

Format:

{

 "memories":[

   {

      "category":"food",

      "key":"favorite_breakfast",

      "value":"Poha",

      "importance":10

   }

 ]

}

Conversation

USER

${userMessage}

ASSISTANT

${aiResponse}

`;

  const response = await GroqService.generate(prompt);

const cleanJson = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

const json = JSON.parse(cleanJson);

            if (!json.memories) return;

            for (const memory of json.memories) {

                await MemoryService.saveMemory(

                    userId,

                    memory

                );

            }

        }

        catch (err) {

            console.error(

                "Memory Extraction Failed",

                err

            );

        }

    }

}