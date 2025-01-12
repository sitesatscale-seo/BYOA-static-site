const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');

// Template for wrapping converted Markdown
const template = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="/index.html">Home</a></li>
                <li><a href="/blog/index.html">Blog</a></li>
                <li><a href="/pages/about.html">About</a></li>
                <li><a href="/pages/faq.html">FAQ</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <article class="content">
            ${content}
        </article>
    </main>
    <footer>
        <p>&copy; 2024 My Website. All rights reserved.</p>
    </footer>
</body>
</html>
`;

// Create necessary directories
const dirs = ['content/blog', 'content/pages', 'blog', 'pages'];
dirs.forEach(dir => fs.ensureDirSync(dir));

// Convert a single markdown file to HTML
async function convertMarkdownFile(filePath) {
    const markdown = await fs.readFile(filePath, 'utf-8');
    const { attributes, body } = frontMatter(markdown);
    const html = marked.parse(body);
    const title = attributes.title || 'Untitled';
    
    return template(title, html);
}

// Process all markdown files
async function build() {
    try {
        // Process blog posts
        const blogFiles = await fs.readdir('content/blog');
        for (const file of blogFiles) {
            if (file.endsWith('.md')) {
                const html = await convertMarkdownFile(`content/blog/${file}`);
                const outputPath = `blog/${file.replace('.md', '.html')}`;
                await fs.writeFile(outputPath, html);
            }
        }

        // Process pages
        const pageFiles = await fs.readdir('content/pages');
        for (const file of pageFiles) {
            if (file.endsWith('.md')) {
                const html = await convertMarkdownFile(`content/pages/${file}`);
                const outputPath = `pages/${file.replace('.md', '.html')}`;
                await fs.writeFile(outputPath, html);
            }
        }

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
    }
}

build(); 