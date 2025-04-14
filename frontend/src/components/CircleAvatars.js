import React from 'react';
import './CircleAvatars.css';

export default function CircleAvatars({ circle }) {
    return (
        <div className="circle-avatars">
            {circle?.map((person) => (
                <div key={person._id} className="avatar-wrapper">
                    <img
                        src={person.profileImage}
                        alt={person.name}
                        className="circle-avatar"
                    />
                </div>
            ))}
        </div>
    );
}
