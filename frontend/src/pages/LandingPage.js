import React from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

export default function LandingPage() {
    return (
        <div className="landing-container">
            <div className="card">
                <div className="top-right">
                    <Link to="/search" className="icon-button">
                        <svg className="icon" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                            <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                        </svg>
                    </Link>
                    <Link to="/login" className="signup-button">Log In</Link>
                </div>
                <h1 className="headline">Keep your circle tight</h1>
                <div className="logo-wrapper">
                    <div className="outer-circle">
                        <img src="/logo.png" alt="logo" className="logo" />
                    </div>
                </div>
            </div>
        </div>
    )
}
