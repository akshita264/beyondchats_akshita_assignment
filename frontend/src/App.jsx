import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_BASE_URL + '/api/articles')
      .then(res => {
        setArticles(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("API Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600">
      Loading Scraped Articles...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      {/* 1. Navbar moved outside the container to span full width */}
      <Navbar />

      {/* 2. Main content container remains constrained and centered */}
      <div className="mx-auto max-w-7xl p-6 md:p-12">
        <div className="space-y-8">
          {articles.map((article) => (
            <div key={article.id} className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
              {/* Header section */}
              <div className="bg-slate-900 px-6 py-4">
                <h2 className="text-xl font-semibold text-white truncate">
                  {article.title}
                </h2>
              </div>
              
              {/* Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                
                {/* Original Section */}
                <div className="p-8">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600">
                    Original Scraped Content
                  </span>
                  <div className="mt-6 text-slate-600 leading-relaxed text-sm">
                    {article.original_content}
                  </div>
                  <div className="mt-8">
                    <a href={article.source_url} target="_blank" rel="noreferrer" 
                       className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                      🔗 View Source Article
                    </a>
                  </div>
                </div>

                {/* AI Enhanced Section */}
                <div className="p-8 bg-slate-50/50">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600">
                    AI Enhanced Version (Groq + Serper)
                  </span>
                  <div className="mt-6">
                    {article.is_updated ? (
                      <div className="whitespace-pre-wrap text-slate-900 leading-relaxed text-sm">
                        {article.updated_content}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-slate-400 italic text-sm">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-slate-400"></div>
                        <span>Processing with AI... Run processor.js</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;