import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const EmojiPicker = ({ onEmojiClick, isOpen, onClose }) => {
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Organized emoji categories for better UX
    const emojiCategories = {
        'Smileys & People': [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
            '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
            '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
            '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
            '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
            '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
            '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
            '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐'
        ],
        'Gestures': [
            '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
            '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
            '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'
        ],
        'Hearts & Symbols': [
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
            '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
            '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'
        ],
        'Nature & Weather': [
            '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️',
            '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄'
        ]
    };

    const handleEmojiClick = (emoji) => {
        onEmojiClick({ emoji });
    };

    return (
        <div className="fixed bottom-24 right-8 z-[100] bg-white border border-gray-300 rounded-lg shadow-2xl w-[420px]" ref={pickerRef}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">Emoji</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                    title="Close"
                >
                    <X size={20} />
                </button>
            </div>
            
            {/* Emoji Categories */}
            <div className="max-h-[450px] overflow-y-auto p-4 bg-white">
                {Object.entries(emojiCategories).map(([category, emojis]) => (
                    <div key={category} className="mb-5">
                        <h4 className="text-xs font-semibold text-gray-600 mb-3 sticky top-0 bg-white py-1 z-10">
                            {category}
                        </h4>
                        <div className="grid grid-cols-9 gap-2">
                            {emojis.map((emoji, index) => (
                                <button
                                    key={`${category}-${index}`}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="w-11 h-11 flex items-center justify-center text-2xl hover:bg-blue-100 rounded-md transition-all duration-100 hover:scale-125 transform cursor-pointer"
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmojiPicker;
