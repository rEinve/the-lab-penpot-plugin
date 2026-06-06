// ─────────────────────────────────────────────────────────────────────────────
// The Lab Design System — Penpot Plugin Worker
// Source of truth: src/scss theme (OKLCH → hex, converted at build time)
// Idempotent: re-running skips tokens/typographies that already exist.
// No external dependencies — pure Penpot Plugin API.
// ─────────────────────────────────────────────────────────────────────────────

// UI is served from the same origin as the manifest (http://localhost:4321)
const PLUGIN_ORIGIN = 'http://localhost:4321';
penpot.ui.open('The Lab Design System', `${PLUGIN_ORIGIN}/index.html`, { width: 300, height: 520 });

penpot.ui.onmessage = async (msg) => {
  if (msg.type === 'apply')  await handleApply();
  if (msg.type === 'clear')  await handleClear();
  if (msg.type === 'status') await handleStatus();
};

// ─── STATUS ──────────────────────────────────────────────────────────────────

async function handleStatus() {
  const tokens = penpot.library.local.tokens;
  const lib    = penpot.library.local;
  penpot.ui.sendMessage({
    type: 'status',
    sets: tokens.sets.map(s => ({ name: s.name, active: s.active, count: s.tokens.length })),
    typographies: lib.typographies.length,
    file: penpot.currentFile?.name ?? '(unknown)',
  });
}

// ─── APPLY ───────────────────────────────────────────────────────────────────

async function handleApply() {
  const out = { createdTokens: [], createdTypographies: [], skipped: 0, errors: [] };

  try {
    const tokens = penpot.library.local.tokens;
    const lib    = penpot.library.local;

    function getSet(name) {
      let s = tokens.sets.find(x => x.name === name);
      if (!s) s = tokens.addSet({ name });
      if (!s.active) s.toggleActive();
      return s;
    }

    function addToken(set, type, name, value) {
      try {
        if (set.tokens.find(t => t.name === name)) { out.skipped++; return; }
        set.addToken({ type, name, value: String(value) });
        out.createdTokens.push(name);
      } catch (e) { out.errors.push(name + ': ' + e.message); }
    }

    const prim = getSet('primitives');
    const sem  = getSet('semantic');

    // ── Primitive colors ─────────────────────────────────────────────────────
    const COLORS = {
      'color.brand.accent':          '#D2080D',
      'color.brand.accent-strong':   '#BE0000',
      'color.brand.accent-contrast': '#FDFCF9',
      'color.neutral.900':           '#232930',
      'color.neutral.700':           '#3C424A',
      'color.neutral.600':           '#5D646E',
      'color.neutral.500':           '#79818D',
      'color.surface.0':             '#232930',
      'color.surface.64':            '#878E99',
      'color.surface.81':            '#BBC2CC',
      'color.surface.85':            '#CCD1D9',
      'color.surface.90':            '#D6DBE1',
      'color.surface.91':            '#DFE3E8',
      'color.surface.93':            '#E7EAEE',
      'color.surface.99':            '#F8F9FA',
      'color.surface.100':           '#FCFDFE',
      'color.surface.base':          '#EEF0F0',
      'color.danger.default':        '#DB2B33',
      'color.danger.text':           '#9E141E',
      'color.danger.soft':           '#F4D9DA',
      'color.outline.default':       '#A9B3B6',
      'color.outline.variant':       '#CDD6D8',
      'color.link.default':          '#006898',
      'color.link.on-dark':          '#6BB6D9',
      'color.background.light':      '#FFFFFF',
      'color.background.dark':       '#16171D',
    };
    for (const [n, v] of Object.entries(COLORS)) addToken(prim, 'color', n, v);

    // ── Semantic aliases (reference primitives) ───────────────────────────────
    const SEMANTIC = {
      'color.text.primary':        '{color.neutral.900}',
      'color.text.secondary':      '{color.neutral.700}',
      'color.text.tertiary':       '{color.neutral.600}',
      'color.text.muted':          '{color.neutral.500}',
      'color.text.inverse':        '{color.surface.100}',
      'color.text.link':           '{color.link.default}',
      'color.text.link-on-dark':   '{color.link.on-dark}',
      'color.bg.page':             '{color.surface.base}',
      'color.bg.elevated':         '{color.surface.100}',
      'color.bg.sunken':           '{color.surface.93}',
      'color.bg.inverse':          '{color.background.dark}',
      'color.accent.default':      '{color.brand.accent}',
      'color.accent.hover':        '{color.brand.accent-strong}',
      'color.accent.on-accent':    '{color.brand.accent-contrast}',
      'color.border.default':      '{color.outline.default}',
      'color.border.subtle':       '{color.outline.variant}',
      'color.feedback.danger':     '{color.danger.default}',
      'color.feedback.danger-text':'{color.danger.text}',
      'color.feedback.danger-soft':'{color.danger.soft}',
    };
    for (const [n, v] of Object.entries(SEMANTIC)) addToken(sem, 'color', n, v);

    // ── Spacing (px) ──────────────────────────────────────────────────────────
    const SPACING = {
      'spacing.s': 8, 'spacing.m': 16, 'spacing.l': 24, 'spacing.xl': 32, 'spacing.xxl': 80,
      'spacing.section.min': 40, 'spacing.section': 96, 'spacing.section.max': 128,
    };
    for (const [n, v] of Object.entries(SPACING)) addToken(prim, 'spacing', n, v);

    // ── Border radius (px) ────────────────────────────────────────────────────
    const RADIUS = {
      'radius.s': 6, 'radius.m': 12, 'radius.l': 16, 'radius.xl': 24, 'radius.pill': 999,
    };
    for (const [n, v] of Object.entries(RADIUS)) addToken(prim, 'borderRadius', n, v);

    // ── Font families ─────────────────────────────────────────────────────────
    addToken(prim, 'fontFamilies', 'font.family.display', 'Inter');
    addToken(prim, 'fontFamilies', 'font.family.body',    'Montserrat');
    addToken(prim, 'fontFamilies', 'font.family.mono',    'Roboto Mono');

    // ── Font weights ──────────────────────────────────────────────────────────
    const WEIGHTS = {
      'font.weight.regular': 400, 'font.weight.medium': 500, 'font.weight.semibold': 600,
      'font.weight.bold': 700,    'font.weight.black': 800,
    };
    for (const [n, v] of Object.entries(WEIGHTS)) addToken(prim, 'fontWeights', n, v);

    // ── Font sizes (px) ───────────────────────────────────────────────────────
    const SIZES = {
      'font.size.xs': 14, 'font.size.sm': 16, 'font.size.base': 18, 'font.size.lg': 20,
      'font.size.xl': 24, 'font.size.2xl': 32, 'font.size.3xl': 40,
      'font.size.4xl': 56, 'font.size.5xl': 72,
    };
    for (const [n, v] of Object.entries(SIZES)) addToken(prim, 'fontSizes', n, v);

    // ── Letter spacing (em) ───────────────────────────────────────────────────
    const LS = {
      'letter.tight': -0.02, 'letter.tighter': -0.04,
      'letter.normal': 0,    'letter.wide': 0.05,
    };
    for (const [n, v] of Object.entries(LS)) addToken(prim, 'letterSpacing', n, v);

    // ── Opacity ───────────────────────────────────────────────────────────────
    addToken(prim, 'opacity', 'opacity.muted',    0.7);
    addToken(prim, 'opacity', 'opacity.disabled', 0.45);

    // ── Library typographies (one-click apply in assets panel) ────────────────
    function createTypo(name, fam, size, weight, lh, ls, transform) {
      try {
        if (lib.typographies.find(t => t.name === name)) { out.skipped++; return; }
        const t = lib.createTypography();
        t.name = name;
        const font = penpot.fonts.findByName(fam);
        if (font) {
          const variant = font.variants.find(v => String(v.fontWeight) === String(weight))
            ?? font.variants[0];
          t.setFont(font, variant);
        }
        t.fontFamilies  = fam;
        t.fontSize      = String(size);
        t.fontWeight    = String(weight);
        t.lineHeight    = String(lh);
        t.letterSpacing = String(ls);
        if (transform) t.textTransform = transform;
        out.createdTypographies.push(name);
      } catch (e) { out.errors.push('typo ' + name + ': ' + e.message); }
    }

    //           name              family        sz   wt    lh     ls     transform
    createTypo('Display/Hero',   'Inter',       72,  800,  1.02, -1.4);
    createTypo('Display/Large',  'Inter',       56,  700,  1.05, -1.1);
    createTypo('Heading/XL',     'Inter',       40,  700,  1.10, -0.6);
    createTypo('Heading/L',      'Inter',       32,  700,  1.15, -0.3);
    createTypo('Heading/M',      'Inter',       24,  600,  1.25, -0.2);
    createTypo('Heading/S',      'Inter',       20,  600,  1.30,  0);
    createTypo('Body/Large',     'Montserrat',  20,  400,  1.60,  0);
    createTypo('Body/Default',   'Montserrat',  18,  400,  1.60,  0);
    createTypo('Body/Small',     'Montserrat',  16,  400,  1.55,  0);
    createTypo('Label/Caption',  'Montserrat',  14,  500,  1.40,  0.2);
    createTypo('Label/Overline', 'Montserrat',  14,  600,  1.40,  1.1,  'uppercase');

  } catch (e) {
    out.errors.push('FATAL: ' + e.message);
  }

  penpot.ui.sendMessage({ type: 'apply-done', result: out });
}

// ─── CLEAR ───────────────────────────────────────────────────────────────────

async function handleClear() {
  const out = { removed: 0, errors: [] };
  try {
    const tokens = penpot.library.local.tokens;
    const lib    = penpot.library.local;

    // Remove token sets created by this plugin
    for (const name of ['primitives', 'semantic']) {
      const s = tokens.sets.find(x => x.name === name);
      if (s) {
        // Remove each token individually (Penpot API)
        for (const t of [...s.tokens]) { try { t.remove(); out.removed++; } catch(e){} }
      }
    }
    // Remove typographies created by this plugin
    const ours = ['Display/Hero','Display/Large','Heading/XL','Heading/L','Heading/M','Heading/S',
      'Body/Large','Body/Default','Body/Small','Label/Caption','Label/Overline'];
    for (const name of ours) {
      const t = lib.typographies.find(x => x.name === name);
      if (t) { try { t.remove(); out.removed++; } catch(e){} }
    }
  } catch (e) { out.errors.push(e.message); }
  penpot.ui.sendMessage({ type: 'clear-done', result: out });
}
