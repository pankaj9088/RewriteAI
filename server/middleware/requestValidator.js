const ALLOWED_MODES = new Set([
  'grammar',
  'professional',
  'friendly',
  'formal',
  'concise',
  'expand',
  'paraphrase',
  'translate',
  'custom',
]);

const MAX_TEXT_LENGTH = 15000; // 15,000 chars limit for text selection
const MAX_CUSTOM_INSTRUCTION_LENGTH = 500;

export function validateRewriteRequest(req, res, next) {
  const { text, mode, customInstruction, targetLanguage } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      error: 'Invalid or missing "text" field. Please provide text to rewrite.',
      code: 'INVALID_TEXT',
    });
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return res.status(400).json({
      error: 'Selected text cannot be empty.',
      code: 'EMPTY_TEXT',
    });
  }

  if (trimmedText.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      error: `Selected text is too long (${trimmedText.length} characters). Maximum allowed is ${MAX_TEXT_LENGTH} characters.`,
      code: 'TEXT_TOO_LONG',
    });
  }

  const normalizedMode = (mode || 'grammar').toLowerCase();
  if (!ALLOWED_MODES.has(normalizedMode)) {
    return res.status(400).json({
      error: `Invalid mode "${mode}". Supported modes are: ${Array.from(ALLOWED_MODES).join(', ')}`,
      code: 'INVALID_MODE',
    });
  }

  if (normalizedMode === 'custom' && customInstruction && typeof customInstruction === 'string') {
    if (customInstruction.length > MAX_CUSTOM_INSTRUCTION_LENGTH) {
      return res.status(400).json({
        error: `Custom instruction is too long (${customInstruction.length} characters). Maximum is ${MAX_CUSTOM_INSTRUCTION_LENGTH}.`,
        code: 'INSTRUCTION_TOO_LONG',
      });
    }
  }

  // Attach sanitized inputs to request object
  req.sanitized = {
    text: trimmedText,
    mode: normalizedMode,
    customInstruction: typeof customInstruction === 'string' ? customInstruction.trim() : '',
    targetLanguage: typeof targetLanguage === 'string' ? targetLanguage.trim() : 'Spanish',
  };

  next();
}
