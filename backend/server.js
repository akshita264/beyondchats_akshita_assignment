const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db');  
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


const scrapeBeyondChats = async () => {
    let allArticles = [];
    let currentPage = 15; 
    try {
        while (allArticles.length < 5 && currentPage > 0) {
            const URL = `https://beyondchats.com/blogs/page/${currentPage}/`;
            const { data } = await axios.get(URL, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });

            const $ = cheerio.load(data);
            const pageArticles = [];
            $('article, .elementor-post').each((i, el) => {
                const title = $(el).find('h2').text().trim();
                const url = $(el).find('a').attr('href');
                const content = $(el).find('.entry-content, p').first().text().trim();
                if (title && url) pageArticles.push({ title, content, url });
            });

            allArticles = [...allArticles, ...pageArticles.reverse()];
            if (allArticles.length < 5) currentPage--;
            else break;
        }

        const finalFive = allArticles.slice(0, 5);
        for (const art of finalFive) {
            await db.query(
                `INSERT INTO articles (title, original_content, source_url) 
                 VALUES ($1, $2, $3) ON CONFLICT (source_url) DO NOTHING`,
                [art.title, art.content, art.url]
            );
        }
        return finalFive.length;
    } catch (error) {
        console.error("Scraping Error:", error.message);
        return 0;
    }
};

const processArticlesWithAI = async () => {
    try {
        const { rows: unprocessed } = await db.query('SELECT * FROM articles WHERE is_updated = false');
        if (unprocessed.length === 0) return;

        for (const article of unprocessed) {
            if (!article.original_content) continue;

            console.log(`AI Generating: ${article.title}`);
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: `Write a short blog post: ${article.original_content.substring(0, 1000)}` }]
                },
                { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } }
            );

            await db.query(
                'UPDATE articles SET updated_content = $1, is_updated = true WHERE id = $2',
                [response.data.choices[0].message.content, article.id]
            );
        }
    } catch (error) {
        console.error("Detailed AI Error:", error.response ? error.response.data : error.message);
    }
};

app.get('/api/articles', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM articles ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    try {
        console.log("[Automation] Triggering startup scrape...");
        await scrapeBeyondChats(); 
        
        console.log("[Automation] Triggering AI processing...");
        await processArticlesWithAI(); 
        
        console.log("Automation] All tasks complete. System is live!");
    } catch (err) {
        console.error("Startup Automation failed:", err.message);
    }
});