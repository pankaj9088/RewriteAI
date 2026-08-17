import JSZip from 'jszip';

function getManifestJson() {
  return JSON.stringify(
    {
      manifest_version: 3,
      name: 'RewriteAI - AI Grammar & Text Rewriting Assistant',
      short_name: 'RewriteAI',
      version: '1.0.0',
      description: 'AI-powered grammar correction, tone rewriting, paraphrasing, expansion, and translation with Gemini.',
      permissions: ['contextMenus', 'storage', 'activeTab', 'scripting'],
      host_permissions: [
        'https://*/*',
      ],
      background: {
        service_worker: 'background.js',
      },
      action: {
        default_popup: 'popup.html',
        default_title: 'RewriteAI Assistant',
        default_icon: {
          '16': 'icons/icon16.png',
          '32': 'icons/icon32.png',
          '48': 'icons/icon48.png',
          '128': 'icons/icon128.png',
        },
      },
      content_scripts: [
        {
          matches: ['<all_urls>'],
          js: ['content.js'],
          css: ['content.css'],
          run_at: 'document_end',
        },
      ],
      commands: {
        'rewrite-selected-text': {
          suggested_key: {
            default: 'Ctrl+Shift+R',
            mac: 'Command+Shift+R',
          },
          description: 'Rewrite selected text with RewriteAI',
        },
      },
      icons: {
        '16': 'icons/icon16.png',
        '32': 'icons/icon32.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png',
      },
    },
    null,
    2
  );
}

const DEFAULT_CONFIG_JS = `/**
 * RewriteAI - Extension Configuration
 * Replace 'https://YOUR_PUBLIC_BACKEND_URL' with your actual deployed Render backend URL.
 */
const CONFIG = {
  ENV: 'production',
  PRODUCTION_API_URL: 'https://YOUR_PUBLIC_BACKEND_URL',
  DEVELOPMENT_API_URL: 'http://localhost:3000',
  get API_BASE_URL() {
    return this.ENV === 'production' ? this.PRODUCTION_API_URL : this.DEVELOPMENT_API_URL;
  },
  get REWRITE_ENDPOINT() {
    return \`\${this.API_BASE_URL.replace(/\\/$/, '')}/api/rewrite\`;
  },
  get HEALTH_ENDPOINT() {
    return \`\${this.API_BASE_URL.replace(/\\/$/, '')}/health\`;
  },
  isPlaceholder(url) {
    const target = url || this.PRODUCTION_API_URL;
    return target.includes('YOUR_PUBLIC_BACKEND_URL') || target.includes('YOUR-PUBLIC-BACKEND-URL');
  }
};

if (typeof self !== 'undefined') self.CONFIG = CONFIG;
if (typeof window !== 'undefined') window.CONFIG = CONFIG;
`;

const CONTENT_CSS = `/* RewriteAI Content Styles */
#rewriteai-extension-root {
  all: initial;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
`;

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="112" height="112" rx="28" fill="url(#brandGradient)" />
  <path d="M64 24 L72 56 L104 64 L72 72 L64 104 L56 72 L24 64 L56 56 Z" fill="#ffffff" />
  <path d="M88 32 L92 44 L104 48 L92 52 L88 64 L84 52 L72 48 L84 44 Z" fill="#ffffff" opacity="0.9" />
</svg>`;

/**
 * Creates a PNG icon via Canvas fallback
 */
function createIconBlob(size: number): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(new Blob());
      return;
    }

    // Gradient background
    const radius = Math.round(size * 0.22);
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#2563eb');
    grad.addColorStop(1, '#7c3aed');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();

    // White star / sparkle
    ctx.fillStyle = '#ffffff';
    const cx = size / 2;
    const cy = size / 2;
    const rOuter = size * 0.38;
    const rInner = size * 0.12;

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? rOuter : rInner;
      const x = cx + r * Math.sin(angle);
      const y = cy - r * Math.cos(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/png');
  });
}

export async function downloadExtensionZip(): Promise<void> {
  const zip = new JSZip();

  // 1. Add manifest
  zip.file('manifest.json', getManifestJson());

  // 2. Add config.js
  try {
    const configRes = await fetch('/extension/config.js').catch(() => null);
    if (configRes && configRes.ok) {
      zip.file('config.js', await configRes.text());
    } else {
      zip.file('config.js', DEFAULT_CONFIG_JS);
    }
  } catch {
    zip.file('config.js', DEFAULT_CONFIG_JS);
  }

  // 3. Add background.js, content.js, content.css, popup.html, popup.js, popup.css
  try {
    const [bJsRes, cJsRes, pHtmlRes, pJsRes, pCssRes] = await Promise.all([
      fetch('/extension/background.js').catch(() => null),
      fetch('/extension/content.js').catch(() => null),
      fetch('/extension/popup.html').catch(() => null),
      fetch('/extension/popup.js').catch(() => null),
      fetch('/extension/popup.css').catch(() => null),
    ]);

    if (bJsRes && bJsRes.ok) {
      zip.file('background.js', await bJsRes.text());
    }
    if (cJsRes && cJsRes.ok) {
      zip.file('content.js', await cJsRes.text());
    }
    if (pHtmlRes && pHtmlRes.ok) {
      zip.file('popup.html', await pHtmlRes.text());
    }
    if (pJsRes && pJsRes.ok) {
      zip.file('popup.js', await pJsRes.text());
    }
    if (pCssRes && pCssRes.ok) {
      zip.file('popup.css', await pCssRes.text());
    }
  } catch (err) {
    console.warn('[RewriteAI] File fetch error:', err);
  }

  zip.file('content.css', CONTENT_CSS);

  // 4. Add 16x16, 32x32, 48x48, 128x128 PNG icons
  try {
    const [i16Res, i32Res, i48Res, i128Res] = await Promise.all([
      fetch('/extension/icons/icon16.png').catch(() => null),
      fetch('/extension/icons/icon32.png').catch(() => null),
      fetch('/extension/icons/icon48.png').catch(() => null),
      fetch('/extension/icons/icon128.png').catch(() => null),
    ]);

    if (i16Res && i16Res.ok) zip.file('icons/icon16.png', await i16Res.blob());
    else zip.file('icons/icon16.png', await createIconBlob(16));

    if (i32Res && i32Res.ok) zip.file('icons/icon32.png', await i32Res.blob());
    else zip.file('icons/icon32.png', await createIconBlob(32));

    if (i48Res && i48Res.ok) zip.file('icons/icon48.png', await i48Res.blob());
    else zip.file('icons/icon48.png', await createIconBlob(48));

    if (i128Res && i128Res.ok) zip.file('icons/icon128.png', await i128Res.blob());
    else zip.file('icons/icon128.png', await createIconBlob(128));
  } catch (err) {
    const [b16, b32, b48, b128] = await Promise.all([
      createIconBlob(16),
      createIconBlob(32),
      createIconBlob(48),
      createIconBlob(128),
    ]);
    zip.file('icons/icon16.png', b16);
    zip.file('icons/icon32.png', b32);
    zip.file('icons/icon48.png', b48);
    zip.file('icons/icon128.png', b128);
  }

  zip.file('icons/icon.svg', ICON_SVG);

  // Generate zip file and prompt download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'RewriteAI-Chrome-Extension.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

