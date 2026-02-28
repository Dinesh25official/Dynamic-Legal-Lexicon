import { X } from "lucide-react";

export default function ReadMorePopup({ isOpen, onClose, title, content }) {
    if (!isOpen) return null;

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <button className="popup-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>
                <h3>{title}</h3>
                <div className="popup-body">
                    <p>{content}</p>
                </div>
            </div>
        </div>
    );
}
