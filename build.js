const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');

// Load templates
const headerTemplate = fs.readFileSync('templates/header.html', 'utf-8');
const footerTemplate = fs.readFileSync('templates/footer.html', 'utf-8');
const homeTemplate = fs.readFileSync('templates/home.html', 'utf-8');
const blogListTemplate = fs.readFileSync('templates/blog-list.html', 'utf-8');

// Template for wrapping converted Markdown pages
const pageTemplate = (title, content) => {
    return headerTemplate.replace('${title}', title) +
    `<article class="content">
        ${content}
    </article>` +
    footerTemplate;
};

// Template for blog posts
const blogTemplate = (title, date, content) => {
    return headerTemplate.replace('${title}', title) +
    `<div class="container">
        <article class="blog-post">
            <header class="blog-header">
                <h1>${title}</h1>
                <time datetime="${date}">${new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</time>
            </header>
            <div class="blog-content">
                ${content}
            </div>
        </article>
    </div>` +
    footerTemplate;
};

// Create necessary directories
const dirs = ['content/blog', 'content/pages', 'blog', 'pages', 'templates'];
dirs.forEach(dir => fs.ensureDirSync(dir));

// Convert a single markdown file to HTML
async function convertMarkdownFile(filePath, isBlogPost = false) {
    const markdown = await fs.readFile(filePath, 'utf-8');
    const { attributes, body } = frontMatter(markdown);
    const html = marked.parse(body);
    const title = attributes.title || 'Untitled';
    
    if (isBlogPost) {
        const date = attributes.date || new Date().toISOString();
        return {
            html: blogTemplate(title, date, html),
            metadata: { title, date, slug: path.basename(filePath, '.md') }
        };
    }
    return { html: pageTemplate(title, html), metadata: { title } };
}

// Process all markdown files
async function build() {
    try {
        // Generate home page
        const homeHtml = headerTemplate.replace('${title}', 'Part-Time YouTuber Academy') +
            homeTemplate +
            footerTemplate;
        await fs.writeFile('index.html', homeHtml);

        // Process blog posts
        const blogFiles = await fs.readdir('content/blog');
        const blogPosts = [];
        
        for (const file of blogFiles) {
            if (file.endsWith('.md')) {
                const { html, metadata } = await convertMarkdownFile(`content/blog/${file}`, true);
                const outputPath = `blog/${file.replace('.md', '.html')}`;
                await fs.writeFile(outputPath, html);
                blogPosts.push(metadata);
            }
        }

        // Generate blog listing page
        blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        const blogListContent = blogPosts.map(post => `
            <article class="blog-preview">
                <h2><a href="/blog/${post.slug}.html">${post.title}</a></h2>
                <time datetime="${post.date}">${new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</time>
            </article>
        `).join('\n');

        const blogListHtml = headerTemplate.replace('${title}', 'Blog Posts') +
            blogListTemplate.replace('${blogListContent}', blogListContent) +
            footerTemplate;
        await fs.writeFile('blog/index.html', blogListHtml);

        // Process pages
        const pageFiles = await fs.readdir('content/pages');
        for (const file of pageFiles) {
            if (file.endsWith('.md')) {
                const { html } = await convertMarkdownFile(`content/pages/${file}`, false);
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