import { GoogleGenAI } from '@google/genai';

let aiInstance = null;

function getAiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

const MODE_PROMPTS = {
  grammar: (text) => ({
    system: 'You are an expert editor and grammarian. Your job is to correct all grammar, spelling, punctuation, syntax, and phrasing mistakes while strictly preserving the original meaning, voice, and structure. Do NOT add preamble, markdown code blocks, conversational filler, or commentary. Output ONLY the corrected text.',
    prompt: `Improve the grammar, spelling, and punctuation of the following text:\n\n"""\n${text}\n"""`,
  }),
  professional: (text) => ({
    system: 'You are an executive communication coach. Rewrite the input text into polished, professional, diplomatic, and courteous business language suitable for workplace emails, reports, or client discussions. Do NOT add preamble, markdown code blocks, conversational filler, or commentary. Output ONLY the rewritten text.',
    prompt: `Rewrite the following text in a professional tone:\n\n"""\n${text}\n"""`,
  }),
  friendly: (text) => ({
    system: 'You are an expert communicator. Rewrite the text into a warm, engaging, friendly, and approachable tone while keeping the underlying message clear and authentic. Do NOT add preamble, markdown code blocks, conversational filler, or commentary. Output ONLY the rewritten text.',
    prompt: `Rewrite the following text to be friendly and conversational:\n\n"""\n${text}\n"""`,
  }),
  formal: (text) => ({
    system: 'You are a formal writing specialist. Rewrite the text using dignified, formal, precise vocabulary, and well-structured sentences suitable for academic papers, legal notices, or high-level official correspondence. Do NOT add preamble, markdown code blocks, conversational filler, or commentary. Output ONLY the rewritten text.',
    prompt: `Rewrite the following text in a formal tone:\n\n"""\n${text}\n"""`,
  }),
  concise: (text) => ({
    system: 'You are a master of concise writing. Rewrite the text to make it punchy, succinct, and direct by eliminating unnecessary fluff, filler words, and redundancy without losing essential meaning. Do NOT add preamble, markdown code blocks, conversational filler, or commentary. Output ONLY the concise text.',
    prompt: `Make the following text concise and clear:\n\n"""\n${text}\n"""`,
  }),
  expand: (text) => ({
    system: 'You are a creative writer and content developer. Expand the input text by enriching the descriptions, providing clearer context, elaborating key points, and improving flow while staying faithful to the user intention. Do NOT add preamble, markdown code blocks, conversational filler, or commentary. Output ONLY the expanded text.',
    prompt: `Elaborate and expand the following text with richer detail and explanation:\n\n"""\n${text}\n"""`,
  }),
  paraphrase: (text) => ({
    system: 'You are a linguistic rephrasing expert. Paraphrase the text using fresh vocabulary, varied sentence structure, and dynamic expression while maintaining the identical semantic meaning. Do NOT add preamble, markdown code blocks, conversational filler, or commentary. Output ONLY the paraphrased text.',
    prompt: `Paraphrase the following text:\n\n"""\n${text}\n"""`,
  }),
  translate: (text, _, targetLanguage = 'Spanish') => ({
    system: `You are an expert translator. Translate the text accurately and fluently into ${targetLanguage}, respecting cultural nuances, natural idiom, and tone. Do NOT add preamble, markdown code blocks, conversational filler, or commentary. Output ONLY the translated text.`,
    prompt: `Translate the following text into ${targetLanguage}:\n\n"""\n${text}\n"""`,
  }),
  custom: (text, customInstruction) => ({
    system: `You are an adaptable AI writing assistant. Follow the user's specific instruction to transform the text: "${customInstruction || 'Rewrite appropriately'}". Do NOT add preamble, markdown code blocks, conversational filler, or commentary. Output ONLY the rewritten text.`,
    prompt: `Transform the following text according to this instruction: "${customInstruction || 'Rewrite to improve clarity'}"\n\n"""\n${text}\n"""`,
  }),
};

export async function rewriteText({
  text,
  mode = 'grammar',
  customInstruction = '',
  targetLanguage = 'Spanish',
}) {
  const ai = getAiClient();
  const promptBuilder = MODE_PROMPTS[mode] || MODE_PROMPTS.grammar;
  const { system, prompt } = promptBuilder(text, customInstruction, targetLanguage);

  const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];
  let lastError = null;
  let response = null;
  let usedModel = 'gemini-3.6-flash';

  for (const modelName of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: system,
            temperature: mode === 'grammar' || mode === 'translate' ? 0.2 : 0.7,
            topP: 0.95,
          },
        });
        if (response && response.text) {
          usedModel = modelName;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[RewriteAI] Model ${modelName} attempt ${attempt} issue: ${err.message}`);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
    if (response && response.text) {
      break;
    }
  }

  if (!response || !response.text) {
    throw lastError || new Error('No content returned from Gemini models');
  }

  let output = response.text || '';

  // Clean up any surrounding quote wraps if the model enclosed it
  output = output.trim();
  if (output.startsWith('```') && output.endsWith('```')) {
    output = output.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  return {
    result: output,
    mode,
    model: usedModel,
  };
}
