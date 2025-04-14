import React from 'react';
import './LinkCard.css';

export default function LinkCard({ title, url, icon }) {
    return (
        <div className="link-card">
            {icon && <img src={icon} alt="" className="link-card-icon" />}
            <a href={url} target="_blank" rel="noreferrer">
                {title}
            </a>
        </div>
    );
}
