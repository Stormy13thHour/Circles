import { auth, googleProvider } from "../firebase";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const baseUrl = process.env.REACT_APP_API_URL;

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleAuth = async () => {
        setErrorMessage("");
        try {
            if (isSignUp) {
                if (!name || !email || !username || !password || !confirmPassword) {
                    setErrorMessage("All fields are required.");
                    return;
                }
                if (password !== confirmPassword) {
                    setErrorMessage("Passwords do not match.");
                    return;
                }
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
                if (!passwordRegex.test(password)) {
                    setErrorMessage(
                        "Password must be at least 8 characters long and include a lowercase letter, uppercase letter, number, and special symbol."
                    );
                    return;
                }
                const result = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(result.user, { displayName: name });

                const finalUsername = username.startsWith("@") ? username : `@${username}`;
                const success = await createUserInDatabase(result.user, name, finalUsername);
                if (success) {
                    const savedUsername = localStorage.getItem("username");
                    navigate(`/${savedUsername.replace(/^@/, "")}`);
                }
            } else {
                const result = await signInWithEmailAndPassword(auth, email, password);
                await redirectToUserDashboard(result.user);
            }
        } catch (err) {
            if (err.code === "auth/email-already-in-use") {
                setErrorMessage("This email is already associated with an account.");
            } else if (err.code === "auth/invalid-email") {
                setErrorMessage("Invalid email address.");
            } else if (err.code === "auth/weak-password") {
                setErrorMessage("Password is too weak.");
            } else if (err.code === "auth/user-not-found") {
                setErrorMessage("User not found.");
            } else if (err.code === "auth/wrong-password") {
                setErrorMessage("Incorrect password.");
            } else {
                setErrorMessage("An unexpected error occurred.");
                console.error(err);
            }
        }
    };

    const loginWithGoogle = async () => {
        setErrorMessage("");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const res = await fetch(`${baseUrl}/api/users/${user.displayName}`);
            const data = await res.json();

            if (data?.error === "User not found") {
                const created = await createUserInDatabase(user, user.displayName, null);
                if (!created) return;
                const saved = localStorage.getItem("username");
                navigate(`/${saved}`);
            } else {
                localStorage.setItem("username", data.username);
                navigate(`/${data.username}`);
            }
        } catch (err) {
            setErrorMessage("Google login failed.");
            console.error(err);
        }
    };

    const createUserInDatabase = async (user, displayName, customUsername) => {
        try {
            const finalUsername = customUsername || user.displayName;
            const finalId = finalUsername.startsWith("@") ? finalUsername : `@${finalUsername}`;

            const response = await fetch(`${baseUrl}/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: displayName,
                    email: user.email,
                    username: finalId,
                    profileImage: user.photoURL || "",
                }),
            });

            const result = await response.json();
            if (result.error) {
                setErrorMessage(result.error);
                return false;
            } else {
                localStorage.setItem("username", result.username);
                return true;
            }
        } catch (err) {
            setErrorMessage("Error saving user to database.");
            console.error(err);
            return false;
        }
    };

    const redirectToUserDashboard = async (user) => {
        const emailKey = user.email?.toLowerCase();
        if (!emailKey) return;

        const res = await fetch(`${baseUrl}/api/users/email/${encodeURIComponent(emailKey)}`);
        const data = await res.json();

        if (data.username) {
            localStorage.setItem("username", data.username);
            navigate(`/${data.username.replace(/^@/, "")}`);
        }
    };

    return (
        <div className="login-container">
            <div className="login-bg" />
            <div className="login-box">
                <div className="login-header">
                    <button className="close-button" onClick={() => navigate("/")}>✕</button>
                    <h1>{isSignUp ? "Sign Up" : "Login"}</h1>
                </div>

                {errorMessage && <div className="error-message">{errorMessage}</div>}

                {isSignUp && (
                    <>
                        <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="login-input" />
                        <input placeholder="Permanent ID (e.g. johndoe)" value={username} onChange={(e) => setUsername(e.target.value)} className="login-input" />
                    </>
                )}

                <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="login-input" />
                <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="login-input" />

                {isSignUp && (
                    <>
                        <input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="login-input" />
                        <div className="password-hint">
                            Must be at least 8 characters, include uppercase, lowercase, number, and symbol.
                        </div>
                    </>
                )}

                <button onClick={handleAuth} className="login-button">
                    {isSignUp ? "Create Account" : "Login with Email"}
                </button>

                <button onClick={loginWithGoogle} className="login-button">
                    Login with Google
                </button>

                <p className="switch-text">
                    {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
                    <button onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(""); }} className="switch-button">
                        {isSignUp ? "Login" : "Sign Up"}
                    </button>
                </p>
            </div>
        </div>
    );
}
