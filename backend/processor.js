const axios = require('axios');
const db = require('./db');
const cheerio = require('cheerio');
const OpenAI = require('openai');
require('dotenv').config();

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

const API_BASE_URL = `https://beyondchatsakshitaassignment-production.up.railway.app/api`;

async function processArticles() {
    try {
        const { rows: articles } = await db.query('SELECT * FROM articles WHERE is_updated = false');

        if (articles.length === 0) {
            console.log("No new articles to process.");
            return;
        }

        for (const article of articles) {
            console.log(`\n--- Processing: ${article.title} ---`);


            const searchRes = await axios.post('https://google.serper.dev/search', 
                { q: article.title },
                { headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' } }
            );
            
            
            const competitorLinks = searchRes.data.organic
                .map(l => l.link)
                .filter(link => !link.includes("beyondchats.com")) 
                .slice(0, 2); 

            console.log(`External References: ${competitorLinks.join(', ')}`);


            let referenceText = "";
            for (const link of competitorLinks) {
                try {
                    const { data } = await axios.get(link, { 
                        timeout: 5000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });
                    const $ = cheerio.load(data);
                    referenceText += `\nReference (${link}):\n` + $('p').text().substring(0, 1200);
                } catch (e) {
                    console.log(`Skipping ${link}: Access blocked by target site.`);
                }
            }

            const prompt = `Rewrite this article to improve depth and professional tone: ${article.original_content}. 
                           Use insights from these references: ${referenceText}`;

            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }]
            });

            const updatedBody = completion.choices[0].message.content;

            const finalContent = `${updatedBody}\n\n### References from Google Search\n${competitorLinks.join('\n')}`;

            await axios.put(`${API_BASE_URL}/articles/${article.id}`, {
                updated_content: finalContent,
                reference_links: competitorLinks 
            });

            console.log(`Successfully updated: ${article.title}`);
        }
    } catch (error) {
        console.error("Processor Error:", error.message);
    }
}

processArticles();