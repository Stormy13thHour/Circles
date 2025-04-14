import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { useNavigate, useParams } from "react-router-dom";
import { auth, signOut, onAuthStateChanged } from "../firebase";

const baseUrl = process.env.REACT_APP_API_URL;

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { username } = useParams();
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsLoggedIn(true);
                setUserEmail(user.email);
                const res = await fetch(`${baseUrl}/api/users/email/${encodeURIComponent(user.email)}`);
                const data = await res.json();
                setCurrentUser(data);
            } else {
                setIsLoggedIn(false);
                setUserEmail(null);
                setCurrentUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!username) return;

        const fetchUserData = async () => {
            try {
                const res = await fetch(`${baseUrl}/api/users/@${username}`);
                const data = await res.json();
                setUser(data);
                setIsOwner(userEmail && data.email === userEmail);
            } catch (err) {
                console.error("Fetch Error:", err);
            }
        };

        fetchUserData();
    }, [username, userEmail]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem("username");
            setUser(null);
            navigate("/");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    const handleJoinCircle = async (ownerId, circleIndex) => {
        try {
            const res = await fetch(`${baseUrl}/api/users/circle/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fromUserId: currentUser._id, toUserId: ownerId })
            });
            const data = await res.json();
            alert(data.message || "Request sent!");
        } catch (err) {
            console.error("Join Circle failed:", err);
        }
    };

    return (
        <div className="dashboard-container">
            {!isOwner && (
                <button
                    className="dashboard-exit-button"
                    onClick={() =>
                        navigate(
                            currentUser?.username
                                ? `/${currentUser.username.replace(/^@/, "")}`
                                : "/"
                        )
                    }
                >
                    ✕
                </button>
            )}

            {user && (
                <>
                    <div className="dashboard-header-grid">
                        <div className="profile-grid-left">
                            <img
                                src={
                                    user.profileImage?.trim()
                                        ? `${baseUrl}${user.profileImage}`
                                        : `${baseUrl}/uploads/default.png`
                                }
                                alt="Profile"
                                className="profile-image"
                            />
                            <div className="profile-text">
                                <h1 className="profile-name">{user.name}</h1>
                                <h2 className="profile-headline">{user.headline || "\u00A0"}</h2>
                                <p className="profile-bio">{user.bio || "\u00A0"}</p>

                                {user.socials && Object.values(user.socials).some(Boolean) && (
                                    <div className="social-icons">
                                        {user.socials.facebook && (
                                            <a href={user.socials.facebook} target="_blank" rel="noreferrer">
                                                <img src="/socials/facebook.png" alt="Facebook" />
                                            </a>
                                        )}
                                        {user.socials.x && (
                                            <a href={user.socials.x} target="_blank" rel="noreferrer">
                                                <img src="/socials/twitter.png" alt="X" />
                                            </a>
                                        )}
                                        {user.socials.instagram && (
                                            <a href={user.socials.instagram} target="_blank" rel="noreferrer">
                                                <img src="/socials/instagram.png" alt="Instagram" />
                                            </a>
                                        )}
                                        {user.socials.linkedin && (
                                            <a href={user.socials.linkedin} target="_blank" rel="noreferrer">
                                                <img src="/socials/linkedin.png" alt="LinkedIn" />
                                            </a>
                                        )}
                                        {user.socials.github && (
                                            <a href={user.socials.github} target="_blank" rel="noreferrer">
                                                <img src="/socials/github.png" alt="GitHub" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="profile-grid-right">
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", transform: "translateY(-20px)" }}>
                                <button
                                    className="icon-button"
                                    onClick={() => navigate("/search")}
                                >
                                    <svg
                                        className="icon"
                                        viewBox="0 0 24 24"
                                        stroke="black"
                                        fill="none"
                                        strokeWidth="1"
                                        width="20"
                                        height="20"
                                    >
                                        <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                                    </svg>
                                </button>

                                {isLoggedIn && (
                                    <button
                                        className="icon-button"
                                        onClick={() => navigate("/user/notifications")}
                                        aria-label="Notifications"
                                    >
                                        <img src="/icons/bell.png" alt="Bell Icon" style={{ width: "20px", height: "20px" }} />
                                    </button>
                                )}
                            </div>

                            <div className="button-group">
                                {isOwner && (
                                    <button
                                        className="dashboard-button"
                                        onClick={() => navigate(`/userprofile/${username.replace(/^@/, "")}`)}
                                    >
                                        Edit Profile
                                    </button>
                                )}
                                {isLoggedIn ? (
                                    <button className="dashboard-button" onClick={handleLogout}>
                                        Log Out
                                    </button>
                                ) : (
                                    <button className="dashboard-button" onClick={() => navigate("/login")}>
                                        Login
                                    </button>
                                )}
                            </div>

                            <img src="/logo.png" alt="Logo" className="dashboard-logo" />
                        </div>
                    </div>

                    <section className="links-section">
                        {user.links?.length > 0 && (
                            <div className="links-list">
                                {user.links.map((link) => (
                                    <div
                                        key={link._id}
                                        className="link-card"
                                        onClick={() => window.open(link.url, "_blank")}
                                    >
                                        <span style={{ flex: 1, textAlign: "center" }}>{link.title}</span>
                                        <div style={{ fontSize: "3rem", color: "#555" }}>⋮</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="circle-section">
                        {user.circles?.length > 0 && user.circles.map((circle, index) => {
                            const isMember = circle.members?.some(id => currentUser?._id === id);
                            const previewUsers = user.circleMembers?.filter(u =>
                                circle.order?.includes(u._id)
                            ).slice(0, 5);

                            return (
                                <div key={index} className="circle-card">
                                    <h3 className="circle-title">{circle.name}</h3>

                                    <div className="circle-avatars">
                                        {previewUsers.map(member => (
                                            <div
                                                key={member._id}
                                                className="circle-avatar"
                                                onClick={() => navigate(`/${member.username.replace(/^@/, "")}`)}
                                                title={`${member.name} – ${member.headline || ""}`}
                                            >
                                                <img
                                                    src={member.profileImage?.trim()
                                                        ? `${baseUrl}${member.profileImage}`
                                                        : `${baseUrl}/uploads/default.png`}
                                                    alt={member.name}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        className="circle-action-button"
                                        onClick={() =>
                                            isLoggedIn
                                                ? (isMember
                                                    ? navigate(`/circle/${username.replace(/^@/, "")}/${index}`)
                                                    : handleJoinCircle(user._id, index))
                                                : navigate("/login")
                                        }
                                    >
                                        {isLoggedIn ? (isMember ? "View All" : "Join Circle") : "Join Circle"}
                                    </button>
                                </div>
                            );
                        })}
                        {isLoggedIn && currentUser?.username && (
                            <div style={{ fontSize: "0.9rem", color: "#666" }}>
                                Logged in as: <strong>{currentUser.username}</strong>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
