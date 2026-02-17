import { useState, useEffect } from 'react';
import { listArticles, getArticle } from '../api';
import './Knowledge.css';

const CATEGORIES = [
    { key: null, label: 'All' },
    { key: 'types', label: 'PCOS Types' },
    { key: 'diet', label: 'Diet' },
    { key: 'exercise', label: 'Exercise' },
    { key: 'treatment', label: 'Treatment' },
    { key: 'mental_health', label: 'Mental Health' },
    { key: 'faq', label: 'FAQs' },
];

export default function Knowledge() {
    const [articles, setArticles] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadArticles();
    }, [activeCategory]);

    const loadArticles = async () => {
        setLoading(true);
        try {
            const data = await listArticles(activeCategory);
            setArticles(data);
        } catch (e) {
            console.error('Error loading articles:', e);
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

    const getCategoryIcon = (cat) => {
        const icons = {
            types: '🧬', diet: '🥗', exercise: '🏃‍♀️',
            treatment: '💊', mental_health: '🧠', faq: '❓'
        };
        return icons[cat] || '📄';
    };

    if (selectedArticle) {
        return (
            <div className="page-container fade-in">
                <button className="btn btn-outline btn-sm back-btn" onClick={() => setSelectedArticle(null)}>
                    ← Back to Articles
                </button>
                <article className="article-view">
                    <div className="article-meta">
                        <span className="badge badge-pink">{selectedArticle.category}</span>
                    </div>
                    <h1>{selectedArticle.title}</h1>
                    <div className="article-content" dangerouslySetInnerHTML={{ __html: selectedArticle.content?.replace(/\n/g, '<br/>') }} />
                </article>
            </div>
        );
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1>Knowledge Base</h1>
                <p>Learn about PCOS types, management, and wellness</p>
            </div>

            {/* Category Filter */}
            <div className="category-filter">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.key || 'all'}
                        className={`filter-btn ${activeCategory === cat.key ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.key)}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Articles Grid */}
            {loading ? (
                <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            ) : articles.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <h3>No articles found</h3>
                    <p>Try a different category</p>
                </div>
            ) : (
                <div className="articles-grid">
                    {articles.map(article => (
                        <button key={article.id} className="article-card card" onClick={() => openArticle(article.id)}>
                            <span className="article-icon">{getCategoryIcon(article.category)}</span>
                            <h3>{article.title}</h3>
                            <span className="badge badge-pink">{article.category}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
