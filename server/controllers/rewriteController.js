import { rewriteText } from '../services/geminiService.js';

export async function handleRewrite(req, res, next) {
  try {
    const { text, mode, customInstruction, targetLanguage } = req.sanitized;

    const startTime = Date.now();
    const rewriteResponse = await rewriteText({
      text,
      mode,
      customInstruction,
      targetLanguage,
    });
    const durationMs = Date.now() - startTime;

    const originalWords = text.trim().split(/\s+/).filter(Boolean).length;
    const resultWords = rewriteResponse.result.trim().split(/\s+/).filter(Boolean).length;

    res.json({
      result: rewriteResponse.result,
      mode: rewriteResponse.mode,
      model: rewriteResponse.model,
      stats: {
        originalLength: text.length,
        resultLength: rewriteResponse.result.length,
        originalWords,
        resultWords,
        durationMs,
      },
    });
  } catch (error) {
    next(error);
  }
}
