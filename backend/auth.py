"""Local SQLite account storage and password/session helpers for LUNA.

Passwords are never stored in plaintext. This module uses a unique salt and
scrypt password hashing, and stores only hashes of opaque session tokens.
"""
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets
import sqlite3
from typing import Any

from database import get_db_connection

PASSWORD_SALT_BYTES = 16
SESSION_TOKEN_BYTES = 32
SESSION_HOURS = 24
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1


def init_auth_tables() -> None:
    """Create account/session tables; safe to call during each app startup."""
    with get_db_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL COLLATE NOCASE UNIQUE,
                email TEXT NOT NULL COLLATE NOCASE UNIQUE,
                display_name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'Reader',
                bio TEXT NOT NULL DEFAULT '',
                skill TEXT NOT NULL DEFAULT 'Reading',
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry ON user_sessions(expires_at)")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _password_hash(password: str, salt: bytes) -> str:
    derived = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, dklen=64
    )
    return derived.hex()


def validate_registration(username: str, email: str, display_name: str, password: str) -> None:
    """Raise ValueError with a safe validation message for invalid fields."""
    if not 3 <= len(username) <= 24 or not username.replace("_", "").replace("-", "").isalnum():
        raise ValueError("Username must be 3–24 characters and use letters, numbers, underscores, or hyphens.")
    if len(display_name.strip()) < 2 or len(display_name) > 60:
        raise ValueError("Display name must be 2–60 characters.")
    if len(email) > 254 or "@" not in email or email.startswith("@") or email.endswith("@"):
        raise ValueError("Enter a valid email address.")
    if len(password) < 10 or len(password) > 128:
        raise ValueError("Password must be 10–128 characters.")
    if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one letter and one number.")


def create_user(username: str, email: str, display_name: str, password: str) -> dict[str, Any]:
    """Validate input and create an account without persisting plaintext password."""
    username, email, display_name = username.strip(), email.strip().lower(), display_name.strip()
    validate_registration(username, email, display_name, password)
    salt = secrets.token_bytes(PASSWORD_SALT_BYTES)
    hashed = _password_hash(password, salt)
    now = _now().isoformat()
    try:
        with get_db_connection() as conn:
            cursor = conn.execute(
                """INSERT INTO users (username,email,display_name,role,bio,skill,password_salt,password_hash,created_at)
                   VALUES (?, ?, ?, 'Reader', '', 'Reading', ?, ?, ?)""",
                (username, email, display_name, salt.hex(), hashed, now),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError as exc:
        raise ValueError("That username or email is already registered.") from exc
    return get_public_user(user_id)


def verify_credentials(username_or_email: str, password: str) -> dict[str, Any] | None:
    """Check credentials with a constant-time hash comparison."""
    with get_db_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE",
            (username_or_email.strip(), username_or_email.strip()),
        ).fetchone()
    if not row:
        # Perform a dummy scrypt calculation to reduce username-enumeration timing clues.
        _password_hash(password, b"luna-dummy-salt!")
        return None
    try:
        actual = _password_hash(password, bytes.fromhex(row["password_salt"]))
    except (ValueError, TypeError):
        return None
    if not hmac.compare_digest(actual, row["password_hash"]):
        return None
    return get_public_user(int(row["id"]))


def create_session(user_id: int) -> tuple[str, str]:
    """Create a random bearer token and persist only its SHA-256 hash."""
    token = secrets.token_urlsafe(SESSION_TOKEN_BYTES)
    now = _now()
    expires = now + timedelta(hours=SESSION_HOURS)
    digest = hashlib.sha256(token.encode()).hexdigest()
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO user_sessions (user_id,token_hash,expires_at,created_at) VALUES (?, ?, ?, ?)",
            (user_id, digest, expires.isoformat(), now.isoformat()),
        )
        # Remove expired sessions and cap each user's retained active sessions.
        conn.execute("DELETE FROM user_sessions WHERE expires_at <= ?", (now.isoformat(),))
        conn.execute(
            """DELETE FROM user_sessions WHERE user_id = ? AND id NOT IN
               (SELECT id FROM user_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 10)""",
            (user_id, user_id),
        )
    return token, expires.isoformat()


def get_user_for_token(token: str) -> dict[str, Any] | None:
    """Return public user data only for a valid, unexpired bearer token."""
    digest = hashlib.sha256(token.encode()).hexdigest()
    now = _now().isoformat()
    with get_db_connection() as conn:
        row = conn.execute(
            """SELECT u.id, u.username, u.email, u.display_name, u.role, u.bio, u.skill, u.created_at
               FROM user_sessions s JOIN users u ON u.id = s.user_id
               WHERE s.token_hash = ? AND s.expires_at > ?""",
            (digest, now),
        ).fetchone()
    return dict(row) if row else None


def get_public_user(user_id: int) -> dict[str, Any] | None:
    """Return account fields without password or session secrets."""
    with get_db_connection() as conn:
        row = conn.execute(
            """SELECT id, username, email, display_name, role, bio, skill, created_at
               FROM users WHERE id = ?""",
            (user_id,),
        ).fetchone()
    return dict(row) if row else None


def update_user_profile(user_id: int, display_name: str, role: str, bio: str, skill: str) -> dict[str, Any] | None:
    """Validate and update editable public profile fields."""
    display_name, role, bio, skill = (display_name.strip(), role.strip(), bio.strip(), skill.strip())
    if not 2 <= len(display_name) <= 60:
        raise ValueError("Display name must be 2–60 characters.")
    if not 2 <= len(role) <= 60:
        raise ValueError("Role must be 2–60 characters.")
    if len(bio) > 300:
        raise ValueError("Bio must be 300 characters or fewer.")
    if not 2 <= len(skill) <= 40:
        raise ValueError("Skill must be 2–40 characters.")
    with get_db_connection() as conn:
        conn.execute(
            "UPDATE users SET display_name=?, role=?, bio=?, skill=? WHERE id=?",
            (display_name, role, bio, skill, user_id),
        )
    return get_public_user(user_id)


def delete_session(token: str) -> None:
    """Invalidate a session token on sign out."""
    digest = hashlib.sha256(token.encode()).hexdigest()
    with get_db_connection() as conn:
        conn.execute("DELETE FROM user_sessions WHERE token_hash = ?", (digest,))
