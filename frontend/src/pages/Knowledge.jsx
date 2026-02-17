import { useState, useEffect } from 'react';
import { listArticles, getArticle } from '../api';
import { 
    Search, 
    BookOpen, 
    Clock, 
    X, 
    ChevronRight, 
    FileText,
    Filter
} from 'lucide-react';

const CATEGORIES = [
    { key: null, label: 'All Topics' },
    { key: 'types', label: 'PCOS Types' },
    { key: 'diet', label: 'Diet & Nutrition' },
    { key: 'exercise', label: 'Exercise & Fitness' },
    { key: 'treatment', label: 'Medical Treatment' },
    { key: 'mental_health', label: 'Mental Health' },
    { key: 'symptoms', label: 'Symptom Management' },
    { key: 'faq', label: 'FAQs' },
];

export default function Knowledge() {
    const [articles, setArticles] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadArticles();
    }, [activeCategory]);

    const loadArticles = async () => {
        setLoading(true);
        try {
            const data = await listArticles(activeCategory);
            setArticles(data || []);
        } catch (e) {
            console.error('Error loading articles:', e);
            setArticles([]); 
        }
        setLoading(false);
    };

    const openArticle = async (id) => {
        try {
            const data = await getArticle(id);
            setSelectedArticle(data);
        } catch (e) {
            console.error('Error loading article:', e);
        }
    };

    const filteredArticles = articles.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Simple Markdown Renderer for Seed Data
    const renderMarkdown = (content) => {
        if (!content) return null;
        return content.split('\n').map((line, index) => {
            if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold text-white mt-6 mb-4">{line.replace('# ', '')}</h1>;
            if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-pink-400 mt-5 mb-3">{line.replace('## ', '')}</h2>;
            if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold text-purple-400 mt-4 mb-2">{line.replace('### ', '')}</h3>;
            if (line.startsWith('- ')) return <li key={index} className="ml-4 list-disc text-gray-300 mb-1 pl-1">{line.replace('- ', '')}</li>;
            if (line.startsWith('**') && line.endsWith('**')) return <p key={index} className="font-bold text-white mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
            if (line.trim() === '') return <br key={index} />;
            return <p key={index} className="text-gray-300 leading-relaxed mb-2">{line}</p>;
        });
    };

    return (
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-3xl font-bold font-['Lora'] bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
                    Knowledge Base
                </h1>
                <p className="text-gray-400">Expert-backed articles on PCOS types, management, and wellness.</p>
            </div>

            {/* Controls: Search & Category Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search articles..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-gray-600"
                    />
                </div>

                {/* Categories (Scrollable) */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide mask-fade-right">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.key || 'all'}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`
                                whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border
                                ${activeCategory === cat.key 
                                    ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-500/20' 
                                    : 'bg-[#111] border-[#333] text-gray-400 hover:border-gray-500 hover:text-white'}
                            `}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Articles Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-[#111] border border-[#222] rounded-2xl h-64 p-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="h-4 w-24 bg-neutral-800 rounded-full" />
                                <div className="h-6 w-3/4 bg-neutral-800 rounded" />
                                <div className="h-4 w-full bg-neutral-800 rounded" />
                                <div className="h-4 w-2/3 bg-neutral-800 rounded" />
                            </div>
                            <div className="h-4 w-24 bg-neutral-800 rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#333] rounded-2xl bg-[#111]/50">
                    <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-300 mb-2">No articles found</h3>
                    <p className="text-gray-500 max-w-sm">We couldn't find any articles matching "{searchQuery}" in this category.</p>
                    <button 
                        onClick={() => {setSearchQuery(""); setActiveCategory(null);}}
                        className="mt-6 text-pink-500 hover:text-pink-400 font-medium hover:underline"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map(article => (
                        <button 
                            key={article.id} 
                            onClick={() => openArticle(article.id)}
                            className="group bg-[#111] border border-[#222] hover:border-pink-500/30 rounded-2xl p-6 text-left transition-all hover:bg-[#151515] flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-400 uppercase tracking-wide">
                                    {article.category?.replace('_', ' ') || 'General'}
                                </span>
                                {article.read_time_minutes && (
                                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        {article.read_time_minutes} min
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-gray-100 mb-3 group-hover:text-pink-400 transition-colors line-clamp-2">
                                {article.title}
                            </h3>

                            <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                                {article.summary}
                            </p>

                            <div className="mt-auto flex items-center gap-2 text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                                Read Article 
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Article Modal */}
            {selectedArticle && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedArticle(null)}
                >
                    <div 
                        className="bg-[#111] border border-[#333] w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-6 border-b border-[#222] bg-[#111] sticky top-0 z-10 rounded-t-2xl">
                            <div>
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 uppercase tracking-wide mb-3">
                                    {selectedArticle.category?.replace('_', ' ') || 'Article'}
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold text-white font-['Lora'] leading-tight">
                                    {selectedArticle.title}
                                </h2>
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" /> 
                                        {selectedArticle.read_time_minutes} min read
                                    </span>
                                    {selectedArticle.author && (
                                        <span>• By {selectedArticle.author}</span>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedArticle(null)}
                                className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-white hover:bg-[#222] rounded-lg transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                           <div className="prose prose-invert prose-pink max-w-none">
                                {renderMarkdown(selectedArticle.content)}
                           </div>
                           
                           <div className="mt-12 pt-6 border-t border-[#222] text-center">
                                <p className="text-gray-500 text-sm mb-4">Was this article helpful?</p>
                                <button 
                                    onClick={() => setSelectedArticle(null)}
                                    className="px-6 py-2 bg-[#222] hover:bg-[#333] text-white rounded-lg font-medium text-sm transition-all"
                                >
                                    Close Article
                                </button>
                           </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
