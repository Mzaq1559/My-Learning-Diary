---
title: "REST API Design: Principles, Patterns, and Best Practices"
slug: rest-api
date: 2025-06-25
tags:
  - REST
  - API
  - HTTP
  - Backend
  - Web
category: Web Development
cover: ./images/cover.png
series: backend-and-apis
seriesOrder: 1
---

# REST API Design: Principles, Patterns, and Best Practices

## Introduction: The Architecture of the Web's Backbone

**REST (Representational State Transfer)** is the dominant architectural style for web APIs. Defined by Roy Fielding in his 2000 doctoral dissertation, REST is not a protocol or a standard—it is a set of architectural constraints that, when followed, produce APIs that are scalable, stateless, and interoperable.

Almost every major web service you interact with exposes a REST API: GitHub, Stripe, Twitter, AWS, and Slack all use REST. Understanding how to design REST APIs well—not just make them work, but make them correct, consistent, and consumer-friendly—is one of the most valuable skills in backend engineering.

---

## 1. The Six REST Constraints

Fielding's original dissertation defined six constraints that differentiate a REST API from a random HTTP API:

1. **Client-Server**: Concerns are separated. The client manages the UI; the server manages the data. They communicate via a standard interface.
2. **Stateless**: Every request must contain all information necessary to understand and process it. The server stores no client session state between requests. Authentication information must be in every request (via token, not session).
3. **Cacheable**: Responses must indicate whether they are cacheable. Clients (and intermediary proxies) can cache responses to improve performance.
4. **Uniform Interface**: The defining constraint of REST. The interface between client and server must follow consistent conventions (resources identified by URLs, manipulation via representations, self-descriptive messages, HATEOAS).
5. **Layered System**: The client doesn't know whether it's talking to the origin server or a proxy/CDN. This enables load balancers and caching layers.
6. **Code on Demand** (optional): The server can send executable code to the client (e.g., JavaScript).

---

## 2. Resource-Oriented Design: The URL as a Noun

### 2.1 Resources, Not Actions
REST URLs should identify **resources** (nouns), not actions (verbs). The HTTP method expresses the action.

```
❌ /getUser/123
❌ /createPost
❌ /deleteComment?id=456

✅ GET    /users/123
✅ POST   /posts
✅ DELETE /comments/456
```

### 2.2 URL Structure Conventions
```
Collection:           GET    /users
Single resource:      GET    /users/123
Sub-collection:       GET    /users/123/posts
Single sub-resource:  GET    /users/123/posts/456

Create:    POST   /users           → 201 Created + Location: /users/789
Read:      GET    /users/123       → 200 OK
Update all: PUT   /users/123       → 200 OK (replaces entire resource)
Patch:     PATCH  /users/123       → 200 OK (partial update)
Delete:    DELETE /users/123       → 204 No Content
```

### 2.3 Plural vs. Singular
Always use **plural nouns** for collections (`/users`, `/posts`, `/comments`). It's consistent: `/users` gets the collection, `/users/123` gets one user. Mixing singular/plural is a common inconsistency.

---

## 3. HTTP Status Codes: Communicating Intent

Status codes are the semantic vocabulary of REST. Using them correctly makes your API self-documenting.

| Code | Meaning | When to Use |
|---|---|---|
| `200 OK` | Success | GET, PUT, PATCH success |
| `201 Created` | Resource created | POST success (include `Location` header) |
| `204 No Content` | Success, no body | DELETE success |
| `400 Bad Request` | Invalid input | Validation errors, malformed JSON |
| `401 Unauthorized` | Not authenticated | Missing or invalid token |
| `403 Forbidden` | Not authorized | Authenticated but no permission |
| `404 Not Found` | Resource doesn't exist | Unknown ID |
| `409 Conflict` | State conflict | Duplicate unique field, optimistic locking conflict |
| `422 Unprocessable` | Semantic validation error | Valid JSON but failed business validation |
| `429 Too Many Requests` | Rate limited | Include `Retry-After` header |
| `500 Internal Server Error` | Server bug | Should never be intentional |

**`401` vs `403`**: `401` means "I don't know who you are—please authenticate." `403` means "I know who you are, but you don't have permission." These are commonly confused.

---

## 4. Request and Response Design

### 4.1 Consistent Response Envelopes
Wrap responses in a consistent format:

```json
// Success
{
  "data": { "id": "123", "name": "Alice" },
  "meta": { "requestId": "req_abc123" }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  },
  "meta": { "requestId": "req_def456" }
}
```

**Never mix successful and error responses in the same schema.**

### 4.2 Filtering, Sorting, and Pagination
```
# Filtering
GET /users?status=active&role=admin

# Sorting  
GET /posts?sort=-createdAt          # - prefix = descending
GET /posts?sort=title,-publishedAt  # Multiple sort fields

# Cursor-based pagination (recommended for large datasets)
GET /posts?cursor=eyJpZCI6MTIz&limit=20
Response: {
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTQz",
    "hasMore": true
  }
}

# Offset pagination (simple but has deep-page performance issues)
GET /posts?page=5&per_page=20
```

**Cursor-based pagination** is strongly preferable to offset pagination for feeds and large datasets. Offset pagination (`LIMIT 20 OFFSET 1000`) requires the database to scan and discard 1,000 rows. Cursor pagination starts from the exact row, using an indexed value.

---

## 5. Versioning Strategies

APIs must evolve without breaking existing clients. Three common strategies:

| Strategy | Example | Trade-offs |
|---|---|---|
| URL Versioning | `/v1/users` | Most visible, easy to route differently |
| Header Versioning | `API-Version: 2024-06-15` | Cleaner URLs, harder to test in browser |
| Content Negotiation | `Accept: application/vnd.api.v2+json` | Standards-compliant, complex |

**URL versioning** is by far the most common in practice and is recommended for its simplicity.

**Semantic versioning for APIs**: A non-breaking change (adding a new optional field) is a minor version bump. A breaking change (removing a field, changing a type) requires a major version bump (`v1` → `v2`).

---

## 6. HATEOAS: Hypermedia as the Engine of Application State

HATEOAS is the most advanced (and least implemented) REST constraint. In a HATEOAS API, every response includes links to related actions the client can take:

```json
{
  "data": { "id": "123", "status": "pending" },
  "links": {
    "self": "/orders/123",
    "cancel": "/orders/123/cancel",
    "payment": "/orders/123/payment"
  }
}
```

The client discovers API capabilities from the response itself rather than hardcoding endpoint URLs. This makes clients resilient to URL changes and enables "navigable" APIs. In practice, HATEOAS is rare—the overhead of implementing it correctly often outweighs the benefits for most teams.

---

## 7. Security Essentials

### 7.1 Authentication and Authorization
Always use HTTPS. Use JWTs or opaque tokens in the `Authorization: Bearer <token>` header. Never in URL query strings (URLs are logged in access logs).

### 7.2 Rate Limiting
Return `429 Too Many Requests` with `Retry-After: 30` (seconds to wait). Include usage information in headers: `X-RateLimit-Limit: 1000`, `X-RateLimit-Remaining: 847`, `X-RateLimit-Reset: 1704070800`.

### 7.3 Input Validation
Always validate and sanitize input server-side. Never trust client-provided data. Validate types, ranges, lengths, and allowed values. Return structured validation errors (field + message) for every failed field.

---

## 8. OpenAPI / Swagger: The API Contract

**OpenAPI Specification** (formerly Swagger) is the standard for describing REST APIs in a machine-readable format (YAML/JSON). A well-maintained OpenAPI spec enables:
- Auto-generated API documentation (Swagger UI, Redoc)
- Auto-generated client SDKs (in any language)
- Contract testing
- Mock server generation for parallel frontend/backend development

---

## 9. Conclusion: Convention over Configuration

Great REST API design is about consistency and following conventions so well that developers can correctly guess how your API works before reading a single line of documentation. When your URL structure is resource-oriented, your HTTP methods are semantically correct, your status codes are informative, and your error responses are structured and machine-parseable, you've built an API that treats its consumers as first-class citizens.

---

*Next reading: WebSockets: Full-Duplex Communication on the Web →*
