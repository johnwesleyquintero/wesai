
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

let ai: GoogleGenAI | null = null;
const MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const initializeGeminiClient = (apiKey: string): void => {
  try {
    ai = new GoogleGenAI({ apiKey });
    // console.log("Gemini client initialized successfully."); // Removed for cleaner console
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    ai = null; 
    throw new Error("Failed to initialize Gemini client. Check API key format or SDK issue.");
  }
};

export const clearGeminiClient = (): void => {
  ai = null;
  // console.log("Gemini client cleared."); // Removed for cleaner console
};

// Updated interface for the simplified streaming parts
interface RefactorStreamingPart {
  type: 'chunk' | 'error' | 'finish_reason';
  data?: string; // For chunk
  message?: string; // For error
  reason?: string; // For finish_reason
  safetyRatings?: any; // For finish_reason (optional)
}


const getAiInstance = (): GoogleGenAI => {
  if (!ai) {
    if (process.env.API_KEY) {
        console.warn("Attempting to initialize Gemini client from environment variable as it was not previously initialized.");
        initializeGeminiClient(process.env.API_KEY);
        if (ai) return ai;
    }
    throw new Error("Gemini API client is not initialized. Please set your API key in the application settings.");
  }
  return ai;
};

export const reviewCodeWithGemini = async (code: string): Promise<string> => {
  const currentAi = getAiInstance();
  const prompt = `
You are an expert AI code reviewer with a strong understanding of TypeScript and React.
Please provide a detailed review of the following code.
Focus on:
- Potential bugs and logical errors.
- Clarity, readability, and maintainability.
- Performance optimizations and potential bottlenecks (especially React-specific ones like re-renders, memoization, and hook usage).
- Adherence to best practices and language-specific conventions (particularly for TypeScript and React, including component structure, state management, and prop typing).
- Security vulnerabilities.

Format your feedback clearly and concisely using Markdown. Use bullet points or numbered lists for specific suggestions.
If suggesting code changes, try to show small, illustrative snippets.
If the code appears to be TypeScript or React, pay special attention to common patterns, best practices, and potential issues specific to those technologies.
Do not repeat the provided code in your review unless it's part of a specific suggestion.

The code to review is:
\`\`\`typescript
${code}
\`\`\`
`;

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
    
    const text = response.text;
    if (!text || text.trim() === '') {
        throw new Error("Received an empty review from the API.");
    }
    return text;

  } catch (error) {
    console.error("Error calling Gemini API for review:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid") || error.message.includes("invalid api key") || error.message.includes("API key is not valid")) {
             throw new Error("Invalid or unauthorized Gemini API key. Please check your key and permissions.");
        }
         throw new Error(`Gemini API request for review failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API for review.");
  }
};

export async function* refactorCodeWithGeminiStream(code: string): AsyncIterable<RefactorStreamingPart> {
  const currentAi = getAiInstance();
  const prompt = `
You are an expert AI code refactoring assistant, particularly skilled in TypeScript and React.
Given the following TypeScript/React code, please refactor it to improve its quality, readability, performance, and maintainability, adhering to modern TypeScript and React best practices.

Your response MUST be structured as follows:

1.  Start with a concise summary of the key improvements and changes you made. This summary MUST be in Markdown format and begin with the heading:
    ## Refactoring Summary:
    [Your summary content here]

2.  After the summary, provide the complete refactored source code. This code MUST be enclosed in a single TypeScript Markdown code block, and it should be preceded by the heading:
    ## Refactored Code:
    \`\`\`typescript
    // Your refactored code here
    \`\`\`

Please ensure there is no other text, explanation, or formatting outside this specified structure. For example, do not add any text after the final code block's closing backticks.

The code to refactor is:
\`\`\`typescript
${code}
\`\`\`
`;

  try {
    const stream = await currentAi.models.generateContentStream({
      model: MODEL_NAME,
      contents: prompt,
    });

    for await (const chunk of stream) {
      const chunkText = chunk.text;
      const finishReason = chunk.candidates?.[0]?.finishReason;
      const safetyRatings = chunk.candidates?.[0]?.safetyRatings;

      if (chunkText) {
        yield { type: 'chunk', data: chunkText };
      }

      if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        yield { type: 'finish_reason', reason: finishReason, safetyRatings };
        return; 
      }
    }
  } catch (error) {
    console.error("Error in refactorCodeWithGeminiStream:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred during refactoring stream.";
    if (message.includes("API key not valid") || message.includes("invalid api key")) {
      yield { type: 'error', message: "Invalid or unauthorized Gemini API key." };
    } else {
      yield { type: 'error', message: `Gemini API request for refactor stream failed: ${message}` };
    }
  }
}


export const getReactComponentPreview = async (code: string): Promise<string> => {
  const currentAi = getAiInstance();
  const prompt = `
You are an expert AI assistant specializing in analyzing React and TypeScript components.
Given the following React/TypeScript component code, provide a textual description of what the component likely does, its visual structure, its expected props, any internal state, and its basic behavior and interactivity.

Focus on:
- **Purpose:** What is the main goal or function of this component?
- **Visual Structure:** Describe what it would roughly look like on a page (e.g., "a form with two input fields and a submit button," "a card displaying user information").
- **Props:** List its primary props, their likely types (if discernible), and their purpose.
- **State:** Describe any internal state variables it manages and how they affect the component.
- **Interactivity:** Explain how a user might interact with this component and what happens as a result (e.g., "Clicking the 'Add to Cart' button likely dispatches an action or calls a prop function.").

Format your response as clear, concise Markdown. Use headings and bullet points for readability.

The component code is:
\`\`\`typescript
${code}
\`\`\`
`;

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
    
    const text = response.text;
    if (!text || text.trim() === '') {
        throw new Error("Received an empty preview from the API.");
    }
    return text;

  } catch (error) {
    console.error("Error calling Gemini API for component preview:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid") || error.message.includes("invalid api key") || error.message.includes("API key is not valid")) {
             throw new Error("Invalid or unauthorized Gemini API key. Please check your key and permissions.");
        }
         throw new Error(`Gemini API request for component preview failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API for component preview.");
  }
};


export const generateCodeWithGemini = async (description: string): Promise<string> => {
  const currentAi = getAiInstance();
  const prompt = `
You are an expert AI code generation assistant.
Please generate code based on the following description.
Focus on creating clean, efficient, and correct code.
If the description implies TypeScript or React, please use appropriate syntax and best practices.
Provide *only* the generated code, preferably within a single Markdown code block.
If a brief explanation is absolutely necessary before the code, keep it very short. Do not add explanations after the code block.

Description:
"${description}"

Generated Code:
`;

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
    });
    
    const text = response.text;
    if (!text || text.trim() === '') {
        throw new Error("Received empty generated code from the API.");
    }
    return text;

  } catch (error) {
    console.error("Error calling Gemini API for code generation:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid") || error.message.includes("invalid api key") || error.message.includes("API key is not valid")) {
             throw new Error("Invalid or unauthorized Gemini API key. Please check your key and permissions.");
        }
         throw new Error(`Gemini API request for code generation failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API for code generation.");
  }
};


// --- Chat Functions ---

export const startChatSession = async (systemInstruction: string): Promise<Chat> => {
  const currentAi = getAiInstance();
  try {
    const chatSession: Chat = currentAi.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    // console.log("Chat session started successfully."); // Removed for cleaner console
    return chatSession;
  } catch (error) {
    console.error("Error starting chat session:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to start chat session: ${error.message}`);
    }
    throw new Error("An unknown error occurred while starting chat session.");
  }
};

export const sendMessageToChatStream = async (chat: Chat, message: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  try {
    const stream = await chat.sendMessageStream({ message });
    return stream;
  } catch (error) {
    console.error("Error sending message to chat stream:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key not valid") || error.message.includes("invalid api key") || error.message.includes("API key is not valid")) {
        throw new Error("Invalid or unauthorized Gemini API key. Please check your key and permissions.");
      }
      throw new Error(`Failed to send message via stream: ${error.message}`);
    }
    throw new Error("An unknown error occurred while sending message to chat stream.");
  }
};
