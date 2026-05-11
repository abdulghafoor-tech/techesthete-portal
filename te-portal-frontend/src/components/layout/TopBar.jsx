import React, { useState, useEffect } from 'react';
import { Search, Clock, HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import SearchModal from '../common/SearchModal';

const TopBar = () => {
    const { user } = useSelector(state => state.auth);
    const [searchOpen, setSearchOpen] = useState(false);

    console.log('🔥 TopBar rendered, searchOpen:', searchOpen);

    // Keyboard shortcut for search (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                console.log('🔥 Ctrl+K pressed, opening search');
                setSearchOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSearchClick = () => {
        console.log('🔥 Search button clicked');
        setSearchOpen(true);
    };

    const handleSearchClose = () => {
        console.log('🔥 Search modal closed');
        setSearchOpen(false);
    };

    return (
        <>
            <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 text-slate-700 shrink-0">
                {/* Left: History Navigation & Spacer */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><ArrowLeft size={16} /></button>
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><ArrowRight size={16} /></button>
                    </div>
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <Clock size={18} />
                    </button>
                </div>

                {/* Center: Search */}
                <div className="flex-2 max-w-2xl mx-4">
                    <div className="relative group">
                        <button
                            onClick={handleSearchClick}
                            className="w-full h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center px-3 text-slate-500 text-[13px] transition-all border border-slate-200 group-hover:border-slate-300"
                        >
                            <Search size={14} className="mr-2 text-slate-400" />
                            <span className="flex-1 text-left">Search Techesthete</span>
                            <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] bg-slate-200 px-1 rounded font-bold border border-slate-300">Ctrl</span>
                                <span className="text-[10px] bg-slate-200 px-1 rounded font-bold border border-slate-300">K</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Right: Help */}
                <div className="flex items-center justify-end gap-3 flex-1">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <HelpCircle size={20} />
                    </button>
                </div>
            </div>

            {/* Search Modal */}
            <SearchModal isOpen={searchOpen} onClose={handleSearchClose} />
        </>
    );
};

export default TopBar;
