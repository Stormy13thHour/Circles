import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import "./Search.css";

const baseUrl = process.env.REACT_APP_API_URL;

export default function Search() {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`${baseUrl}/api/users`);
                const data = await res.json();
                setUsers(data);
                setFiltered(data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const q = query.toLowerCase();
        setFiltered(
            users.filter(
                (u) =>
                    u.username?.toLowerCase().includes(q) ||
                    u.name?.toLowerCase().includes(q)
            )
        );
    }, [query, users]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const res = await fetch(
                    `${baseUrl}/api/users/email/${encodeURIComponent(user.email)}`
                );
                const data = await res.json();
                setCurrentUser(data);
            } else {
                setCurrentUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const usernamePath = currentUser?.username?.replace(/^@/, "") || "";

    return (
        <div className="search-page">
            <div className="search-box">
                <div className="search-header">
                    <Link
                        to={currentUser ? `/${usernamePath}` : "/"}
                        className="close-button"
                    >
                        ✕
                    </Link>

                    {currentUser ? (
                        <span className="signed-in-user">
                            Signed in as: <strong>{currentUser.username}</strong>
                        </span>
                    ) : (
                        <Link to="/login" className="signup-link">
                            Log In
                        </Link>
                    )}
                </div>

                <div className="search-input-wrapper">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="search-results">
                    {filtered.map((user) => (
                        <Link
                            to={`/${user.username.replace(/^@/, "")}`}
                            key={user._id}
                            className="search-user-card"
                        >
                            <img
                                src={
                                    user.profileImage
                                        ? `${baseUrl}${user.profileImage}`
                                        : "/default.png"
                                }
                                alt={user.name}
                                className="user-avatar"
                            />

                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span className="user-name">{user.name}</span>
                                    <span className="user-username" style={{ opacity: 0.8 }}>
                                        ({user.username})
                                    </span>
                                </div>

                                {user.headline && (
                                    <div className="user-headline">{user.headline}</div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );

}
