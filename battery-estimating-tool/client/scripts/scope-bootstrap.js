// One-off generator: scopes bootstrap's CSS under `.bootstrap-scope` so its
// utility classes (e.g. .bg-primary, .rounded, .mb-3) stop colliding with
// Tailwind's identically-named utilities. Bootstrap marks its utilities
// `!important`, so without scoping they silently win over Tailwind's
// equivalents wherever both are loaded on the same page.
//
// Re-run this script (`node scripts/scope-bootstrap.js`) if bootstrap is
// upgraded. The output, src/bootstrap-scoped.css, is committed as a regular
// source file — it is not regenerated automatically as part of the build.
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const prefixSelector = require("postcss-prefix-selector");

const input = fs.readFileSync(
  require.resolve("bootstrap/dist/css/bootstrap.min.css"),
  "utf8"
);

postcss([
  prefixSelector({
    prefix: ".bootstrap-scope",
    transform(prefix, selector, prefixedSelector) {
      // `:root` holds bootstrap's CSS custom properties; prefixing it to
      // ".bootstrap-scope :root" would never match anything, since :root is
      // always the document root. Rewrite it to target the scope element's
      // own custom properties instead.
      if (selector === ":root") {
        return prefix;
      }
      return prefixedSelector;
    },
  }),
])
  .process(input, { from: undefined })
  .then((result) => {
    const outPath = path.join(__dirname, "../src/bootstrap-scoped.css");
    const banner = `/* GENERATED FILE — do not edit directly.\n   Produced by scripts/scope-bootstrap.js from bootstrap/dist/css/bootstrap.min.css.\n   Re-run that script after upgrading the bootstrap package. */\n`;
    fs.writeFileSync(outPath, banner + result.css);
    console.log(`Wrote ${outPath} (${result.css.length} bytes)`);
  });
