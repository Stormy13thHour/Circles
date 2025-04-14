import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const baseUrl = process.env.REACT_APP_API_URL;

export default function NotificationsPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem("username");
        if (!user) return navigate("/login");

        fetch(`${baseUrl}/api/users/${user}`)
            .then(res => res.json())
            .then(data => {
                setCurrentUser(data);
                setRequests(data.circleRequests || []);
            })
            .catch(() => navigate("/login"));
    }, [navigate]);

    const handleAction = async (type, fromUserId) => {
        const endpoint = `${baseUrl}/api/users/circle/${type}`;
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fromUserId, toUserId: currentUser._id }),
        });
        const data = await res.json();
        if (data) {
            setRequests(prev => prev.filter(id => id !== fromUserId));
        }
    };

    return (
        <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
            <h1>Notifications</h1>
            {requests.length === 0 ? (
                <p>No connection requests.</p>
            ) : (
                <ul>
                    {requests.map((id) => (
                        <li key={id} style={{ marginBottom: "1rem" }}>
                            <span>User ID: {id}</span>
                            <button onClick={() => handleAction("accept", id)}>Accept</button>
                            <button onClick={() => handleAction("decline", id)}>Decline</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
