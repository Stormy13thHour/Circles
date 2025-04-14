import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './UserProfile.module.css';
import {
    DragDropContext,
    Droppable,
    Draggable
} from "@hello-pangea/dnd";


const baseUrl = process.env.REACT_APP_API_URL;

export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editHeadline, setEditHeadline] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [newLinkTitle, setNewLinkTitle] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [socials, setSocials] = useState({
        facebook: '',
        x: '',
        instagram: '',
        linkedin: '',
        github: ''
    });

    const navigate = useNavigate();
    const { username } = useParams();

    useEffect(() => {
        if (!username) return;
        const withAt = username.startsWith("@") ? username : `@${username}`;
        fetch(`${baseUrl}/api/users/${withAt}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setErrorMessage(data.error);
                } else {
                    setUser(data);
                    setEditName(data.name);
                    setEditBio(data.bio);
                    setEditHeadline(data.headline || '');
                    setEditUsername(data.username);
                    setSocials(data.socials || {});
                }
            })
            .catch(() => setErrorMessage("Failed to fetch user data."));
    }, [username]);

    function handleAddLink() {
        if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
        fetch(`${baseUrl}/api/users/${user._id}/links`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newLinkTitle, url: newLinkUrl }),
        })
            .then((res) => res.json())
            .then((updatedUser) => {
                setUser(updatedUser);
                setNewLinkTitle("");
                setNewLinkUrl("");
            })
            .catch((err) => console.error("Add Link Error:", err));
    }

    function handleDeleteLink(linkId) {
        fetch(`${baseUrl}/api/users/${user._id}/links/${linkId}`, {
            method: "DELETE",
        })
            .then((res) => res.json())
            .then((updatedUser) => setUser(updatedUser))
            .catch((err) => console.error("Delete Link Error:", err));
    }

    function handleSaveAllLinks() {
        fetch(`${baseUrl}/api/users/${user._id}/links/save`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ links: user.links }),
        })
            .then((res) => res.json())
            .then((updatedUser) => setUser(updatedUser))
            .catch((err) => console.error("Save All Links Error:", err));
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        fetch(`${baseUrl}/api/users/${user._id}/profile-image`, {
            method: "POST",
            body: formData,
        })
            .then((res) => res.json())
            .then((updatedUser) => setUser(updatedUser))
            .catch((err) => console.error("Upload Error:", err));
    }

    function handleSaveProfile() {
        if (!user) return;
        fetch(`${baseUrl}/api/users/${user._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: editName,
                bio: editBio,
                headline: editHeadline,
                username: editUsername,
                socials
            }),
        })
            .then((res) => res.json())
            .then((updatedUser) => {
                if (updatedUser.error) {
                    setErrorMessage(updatedUser.error);
                } else {
                    setUser(updatedUser);
                    setIsEditing(false);
                    setErrorMessage('');
                }
            })
            .catch(() => setErrorMessage("Error updating profile."));
    }

    const handleAddCircle = async () => {
        const res = await fetch(`${baseUrl}/api/users/${user._id}/circles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Untitled Circle" }),
        });
        const updated = await res.json();
        setUser({ ...user, circles: updated });
    };

    const handleRenameCircle = async (index, name) => {
        const res = await fetch(`${baseUrl}/api/users/${user._id}/circles/${index}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        const updatedCircle = await res.json();
        const updatedCircles = [...user.circles];
        updatedCircles[index] = updatedCircle;
        setUser({ ...user, circles: updatedCircles });
    };

    const handleDeleteCircle = async (index) => {
        const res = await fetch(`${baseUrl}/api/users/${user._id}/circles/${index}`, {
            method: "DELETE"
        });
        const updated = await res.json();
        setUser({ ...user, circles: updated });
    };

    const handleRemoveMember = async (index, memberId) => {
        const res = await fetch(`${baseUrl}/api/users/${user._id}/circles/${index}/members/${memberId}`, {
            method: "DELETE"
        });
        const updated = await res.json();
        const newCircles = [...user.circles];
        newCircles[index] = updated;
        setUser({ ...user, circles: newCircles });
    };

    const handleAddMember = async (index, memberId) => {
        const res = await fetch(`${baseUrl}/api/users/${user._id}/circles/${index}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId })
        });
        const updatedCircle = await res.json();
        const updatedCircles = [...user.circles];
        updatedCircles[index] = updatedCircle;
        setUser({ ...user, circles: updatedCircles });
    };

    const handleReorder = async (circleIndex, result) => {
        if (!result.destination) return;

        const newOrder = Array.from(user.circles[circleIndex].order);
        const [moved] = newOrder.splice(result.source.index, 1);
        newOrder.splice(result.destination.index, 0, moved);

        const res = await fetch(`${baseUrl}/api/users/${user._id}/circles/${circleIndex}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: newOrder }),
        });
        const updated = await res.json();

        const updatedCircles = [...user.circles];
        updatedCircles[circleIndex] = updated;
        setUser({ ...user, circles: updatedCircles });
    };

    if (errorMessage) return <div className="error">{errorMessage}</div>;
    if (!user) return <div>Loading...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.profileHeader}>
                <div className={styles.profileHeaderContent}>
                    <div className={styles.imageUploadWrapper}>
                        <img
                            src={`${baseUrl}${user.profileImage}`}
                            alt={user.name}
                            className={styles.profileImage}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className={styles.imageUploadInput}
                            title=" "
                        />
                    </div>

                    {!isEditing ? (
                        <div className={styles.centerButtons}>
                            <button className={styles.button} onClick={() => setIsEditing(true)}>Edit Profile</button>
                            <button className={styles.button} onClick={() => navigate(`/${username.replace(/^@/, "")}`)}>Back to Dashboard</button>
                        </div>
                    ) : (
                        <div className={styles.editProfile}>
                            <label>Name:
                                <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                            </label>
                            <label>Headline:
                                <input maxLength={30} value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)} />
                            </label>
                            <label>Bio:
                                <textarea maxLength={144} value={editBio} onChange={(e) => setEditBio(e.target.value)} />
                            </label>
                            <label>Facebook:
                                <input value={socials.facebook || ''} onChange={(e) => setSocials({ ...socials, facebook: e.target.value })} />
                            </label>
                            <label>X (Twitter):
                                <input value={socials.x || ''} onChange={(e) => setSocials({ ...socials, x: e.target.value })} />
                            </label>
                            <label>Instagram:
                                <input value={socials.instagram || ''} onChange={(e) => setSocials({ ...socials, instagram: e.target.value })} />
                            </label>
                            <label>LinkedIn:
                                <input value={socials.linkedin || ''} onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })} />
                            </label>
                            <label>GitHub:
                                <input value={socials.github || ''} onChange={(e) => setSocials({ ...socials, github: e.target.value })} />
                            </label>
                            <button className={styles.button} onClick={handleSaveProfile}>Save</button>
                            <button className={styles.button} onClick={() => setIsEditing(false)}>Cancel</button>
                        </div>
                    )}
                </div>
            </header>

            <section className={styles.editLinksSection}>
                <h1>Edit Links</h1>
                {user.links?.map((link) => (
                    <div key={link._id} className={styles.linkEditItem}>
                        <a href={link.url} target="_blank" rel="noreferrer">{link.title}</a>
                        <button className={styles.button} onClick={() => handleDeleteLink(link._id)}>Delete</button>
                    </div>
                ))}
                <input
                    type="text"
                    placeholder="New Link Title"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="New Link URL"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                />
                <button className={styles.button} onClick={handleAddLink}>Add Link</button>
                <button className={styles.button} onClick={handleSaveAllLinks}>Save All Links</button>
            </section>

            <section className={styles.circleManager}>
                <h2>Manage Your Circles</h2>

                {user.circles?.map((circle, index) => (
                    <div key={index} className={styles.editCircleCard}>
                        <input
                            className={styles.circleNameInput}
                            value={circle.name}
                            onChange={(e) => handleRenameCircle(index, e.target.value)}
                        />

                        <DragDropContext onDragEnd={(result) => handleReorder(index, result)}>
                            <Droppable droppableId={`circle-${index}`}>
                                {(provided) => (
                                    <div
                                        className={styles.editCircleMembers}
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        {circle.order?.map((memberId, i) => {
                                            const member = user.circleMembers?.find(u => u._id === memberId);
                                            return (
                                                <Draggable key={memberId} draggableId={memberId} index={i}>
                                                    {(provided) => (
                                                        <div
                                                            className={styles.circleMemberTag}
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            {member?.name || memberId}
                                                            <button onClick={() => handleRemoveMember(index, memberId)}>✕</button>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>


                        <div className={styles.assignDropdown}>
                            <label>Add Member to Circle:</label>
                            <select
                                onChange={(e) => handleAddMember(index, e.target.value)}
                                defaultValue=""
                            >
                                <option value="" disabled>Select a user</option>
                                {user.circleMembers?.filter(
                                    (u) => !circle.members.includes(u._id)
                                ).map((u) => (
                                    <option key={u._id} value={u._id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button onClick={() => handleDeleteCircle(index)} className={styles.button}>Delete Circle</button>
                    </div>
                ))}

                <button onClick={handleAddCircle} className={styles.button}>+ Add New Circle</button>
            </section>

        </div>
    );
}
