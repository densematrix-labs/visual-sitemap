/**
 * Programmatic SEO Page Generator for Visual Sitemap
 * Generates static HTML pages for long-tail keywords
 */
const fs = require('fs');
const path = require('path');

const dimensions = require('./dimensions.json');

const OUTPUT_DIR = path.join(__dirname, '../public/p');
const SITEMAP_PATH = path.join(__dirname, '../public/sitemap-programmatic.xml');

// Page template
function generatePageHTML(combo, lang = 'en') {
  const { dim1, dim2, val1, val2, val1Display, val2Display, slug } = combo;
  const baseUrl = dimensions.base_url;
  const toolName = lang === 'zh' ? '网站结构可视化工具' : 'Visual Sitemap Scanner';
  
  const title = lang === 'zh' 
    ? `${val1Display} ${val2Display} - ${toolName}`
    : `${val1Display} ${val2Display} - ${toolName}`;
  
  const description = lang === 'zh'
    ? `使用 ${toolName} 扫描${val1Display}网站，进行${val2Display}。生成交互式可视化站点地图，发现页面关系和网站结构。`
    : `Use ${toolName} to scan ${val1Display} websites for ${val2Display}. Generate interactive visual sitemaps, discover page relationships and site structure.`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${baseUrl}/p/${slug}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${baseUrl}/p/${slug}">
  <meta property="og:type" content="website">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P4ZLGKH1E1"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P4ZLGKH1E1', { 'tool_name': 'visual-sitemap', 'page_type': 'programmatic' });
  </script>
  <style>
    :root { --bg: #0a0f0a; --text: #e0e0e0; --accent: #00ff64; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem; flex: 1; }
    h1 { color: var(--accent); font-size: 2rem; margin-bottom: 1rem; font-family: 'JetBrains Mono', monospace; }
    p { line-height: 1.8; margin-bottom: 1rem; }
    .cta { display: inline-block; background: var(--accent); color: var(--bg); padding: 1rem 2rem; text-decoration: none; font-weight: 600; margin-top: 2rem; transition: transform 0.2s; }
    .cta:hover { transform: translateY(-2px); }
    .features { margin: 2rem 0; }
    .features li { margin-bottom: 0.5rem; padding-left: 1.5rem; position: relative; }
    .features li::before { content: '✓'; position: absolute; left: 0; color: var(--accent); }
    footer { text-align: center; padding: 1rem; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>> ${title}_</h1>
    <p>${description}</p>
    
    <div class="features">
      <h2 style="color: var(--accent); margin-bottom: 1rem;">Key Features:</h2>
      <ul>
        <li>Deep crawl up to 500 pages</li>
        <li>Interactive force-directed graph visualization</li>
        <li>Discover internal link structure</li>
        <li>Export data as JSON</li>
        <li>Multi-language support (7 languages)</li>
        <li>No signup required - free to start</li>
      </ul>
    </div>
    
    <a href="${baseUrl}" class="cta">Start Free Scan →</a>
  </div>
  <footer>© 2026 DenseMatrix. All rights reserved.</footer>
</body>
</html>`;
}

// Generate all combinations
function generateCombinations() {
  const combos = [];
  
  for (const [dim1Name, dim2Name] of dimensions.combinations) {
    const dim1 = dimensions.dimensions.find(d => d.name === dim1Name);
    const dim2 = dimensions.dimensions.find(d => d.name === dim2Name);
    
    if (!dim1 || !dim2) continue;
    
    for (let i = 0; i < dim1.values.length; i++) {
      for (let j = 0; j < dim2.values.length; j++) {
        const val1 = dim1.values[i];
        const val2 = dim2.values[j];
        const slug = `${val1}-${val2}`;
        
        combos.push({
          dim1: dim1Name,
          dim2: dim2Name,
          val1,
          val2,
          val1Display: dim1.values_display.en[i],
          val2Display: dim2.values_display.en[j],
          slug
        });
      }
    }
  }
  
  return combos;
}

// Generate sitemap for programmatic pages
function generateSitemap(combos) {
  const baseUrl = dimensions.base_url;
  const today = new Date().toISOString().split('T')[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  
  for (const combo of combos) {
    xml += `  <url>
    <loc>${baseUrl}/p/${combo.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }
  
  xml += '</urlset>';
  return xml;
}

// Main execution
function main() {
  console.log('🚀 Starting Programmatic SEO generation...');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const combos = generateCombinations();
  console.log(`📊 Generated ${combos.length} page combinations`);
  
  // Generate HTML pages
  for (const combo of combos) {
    const html = generatePageHTML(combo);
    const filePath = path.join(OUTPUT_DIR, `${combo.slug}.html`);
    fs.writeFileSync(filePath, html);
  }
  console.log(`✅ Generated ${combos.length} HTML pages in ${OUTPUT_DIR}`);
  
  // Generate sitemap
  const sitemap = generateSitemap(combos);
  fs.writeFileSync(SITEMAP_PATH, sitemap);
  console.log(`✅ Generated sitemap at ${SITEMAP_PATH}`);
  
  console.log('🎉 Programmatic SEO generation complete!');
}

main();
