---
title: "JWT: How JSON Web Tokens Power Modern Authentication"
slug: jwt-authentication
date: 2025-07-12
tags:
  - JWT
  - Authentication
  - Security
  - OAuth
  - Web
category: Web Development
cover: ./images/cover.png
series: security
seriesOrder: 9
---

# JWT: How JSON Web Tokens Power Modern Authentication

## Introduction: The Stateless Authentication Revolution

Traditional web authentication relied on **server-side sessions**: when a user logs in, the server creates a session record (storing user ID, permissions, expiry) in its own database or memory, and gives the client a simple, opaque "session ID" cookie. On every request, the client sends this cookie, and the server looks up the record to verify who the user is.

This works, but it has a fundamental scalability problem: to validate a session, every server in a load-balanced fleet must have access to the same session store. This requires a shared, centralized session database (like Redis), which becomes its own high-availability concern.

**JWT (JSON Web Token)** solves this with a elegant insight: instead of storing the session on the server, store it in the token itself—and **cryptographically sign** it so the server can verify it hasn't been tampered with. The server validates the token using a secret key without any database lookup. This makes authentication stateless, horizontally scalable, and architecturally clean.

---

## 1. The JWT Structure: Three Base64-Encoded Parts

A JWT is a string of the format: `xxxxx.yyyyy.zzzzz`—three Base64URL-encoded sections joined by periods.

### 1.1 Part 1: The Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```
Specifies the token type (`JWT`) and the signing algorithm (`HS256` for HMAC-SHA256, `RS256` for RSA-SHA256, `ES256` for ECDSA).

### 1.2 Part 2: The Payload (Claims)
```json
{
  "sub": "user_42",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "roles": ["user", "admin"],
  "iat": 1704067200,
  "exp": 1704070800
}
```
The payload contains **claims**—statements about the entity (the user) and additional metadata.

**Standard Claims**:
- `sub` (Subject): The user identifier
- `iss` (Issuer): Which server issued the token
- `aud` (Audience): Which server should accept the token
- `iat` (Issued At): Unix timestamp of token creation
- `exp` (Expires): Unix timestamp of token expiry
- `nbf` (Not Before): Token is invalid before this timestamp

### 1.3 Part 3: The Signature
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```
The signature binds the header and payload together with a secret key. If anyone modifies the payload (e.g., changes `"roles": ["user"]` to `"roles": ["admin"]`), the signature will no longer match, and the server will reject the token.

**Critical**: JWT data is Base64URL-encoded, NOT encrypted. The payload is completely readable by anyone who has the token. Never put passwords, credit card numbers, or other sensitive data in a JWT payload.

---

## 2. Symmetric vs. Asymmetric Signing

### 2.1 HS256 (HMAC-SHA256): Shared Secret
Both the token issuer and the token verifier use the **same secret key**. Simple to implement for single-service architectures, but the secret must be securely shared with every service that needs to verify tokens. Leaked secret = compromised authentication.

### 2.2 RS256 / ES256: Public/Private Key Pairs
The token issuer signs with a **private key**. Any verifier can validate using the matching **public key**, which can be freely distributed (often via a JWKS endpoint: `/.well-known/jwks.json`). This is the required architecture for multi-service systems and third-party token verification (e.g., verifying a Google OAuth token).

**RS256** (RSA) is more common but produces larger keys. **ES256** (ECDSA) provides equivalent security with much smaller key sizes and faster signing—recommended for new systems.

---

## 3. The Access Token / Refresh Token Pattern

A JWT access token with a very long expiry is dangerous: if stolen, the attacker has access until the token expires, and you cannot revoke it without building a revocation list (which reintroduces state). The standard pattern addresses this with two tokens:

**Access Token**:
- Short-lived: 5-15 minutes
- Contains user identity and permissions
- Used by the client for every API request
- Stored in memory (JS variable)—never in localStorage

**Refresh Token**:
- Long-lived: 7-90 days
- Opaque (a random string stored in your database, not a JWT)
- Used only to get a new access token when the current one expires
- Stored in an **HttpOnly, Secure, SameSite=Strict cookie**
- Can be revoked by deleting it from the database (logout)

**The Flow**:
1. Login → Server validates credentials → Issues access token (body) + refresh token (HttpOnly cookie)
2. Client includes access token in `Authorization: Bearer <token>` header for API requests
3. Access token expires → Client calls `/auth/refresh` → Server validates refresh token cookie → Issues new access token
4. Logout → Server deletes refresh token from database → Both tokens invalidated

---

## 4. JWT Validation: What Servers Must Check

On every protected API request, your server must verify:

1. **Signature**: Validate the cryptographic signature using the secret/public key.
2. **`exp` (Expiry)**: Reject tokens past their expiry timestamp.
3. **`nbf` (Not Before)**: Reject tokens used before their valid start time.
4. **`iss` (Issuer)**: Verify the token was issued by the expected authority.
5. **`aud` (Audience)**: Verify the token is intended for this specific API.
6. **Algorithm**: Explicitly whitelist allowed algorithms. Never accept `"alg": "none"` (a classic JWT attack vector that allows signature bypass).

---

## 5. Common JWT Vulnerabilities

### 5.1 The `alg: none` Attack
Early JWT libraries had a critical vulnerability: if the header specified `"alg": "none"`, they would skip signature verification. An attacker could craft a malicious token with `"alg": "none"` and arbitrary payload claims without any secret. **Fix**: Always explicitly specify and whitelist the allowed algorithms.

### 5.2 Algorithm Confusion (RS256 to HS256)
If a server issues RS256 tokens but also supports HS256, an attacker can take a legitimate RS256 token, change the header to `HS256`, and sign it with the server's **public key** (which is, by definition, publicly known). If the library uses the public key as the HS256 secret, it will verify the attacker's malicious token. **Fix**: Use separate key validation logic per algorithm.

### 5.3 Storing JWTs in localStorage
As discussed in the cookies article, storing access tokens in localStorage exposes them to any JavaScript on the page—including injected malicious JS from XSS vulnerabilities. **Fix**: Store access tokens in memory; store refresh tokens in HttpOnly cookies.

---

## 6. When NOT to Use JWT

JWTs are not the right tool for every authentication problem:

- **Simple monolithic apps**: Server-side sessions with Redis are simpler, more revocable, and perfectly scalable for most single-service applications.
- **When you need instant revocation**: JWTs are valid until expiry unless you build a revocation list (a "Token Denylist"), which reintroduces the database lookup you were trying to avoid.
- **Storing large amounts of user data**: JWTs are sent with every request. A 10KB JWT with complex role structures creates 10KB of overhead per HTTP request.

---

## 7. Conclusion: JWTs Are a Tool, Not a Silver Bullet

JWTs are an elegant solution to a specific problem: stateless authentication in distributed systems. When implemented correctly—short-lived access tokens, opaque refresh tokens in HttpOnly cookies, proper algorithm pinning, and careful claim validation—they provide a secure and scalable foundation for modern API authentication.

When implemented carelessly—long-lived tokens, sensitive data in payloads, storage in localStorage, missing claim validation—they become a critical security vulnerability. The token itself is not the security; the implementation is the security.

---

*Next reading: OAuth 2.0: The Authorization Framework Behind "Sign in with Google" →*
