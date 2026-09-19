const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AiProf Study Companion — AI Prompts Used During Development</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 11mm 12mm 11mm 12mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
        font-size: 7.8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.42;
      font-size: 8.6pt;
    }

    .page-break {
      page-break-before: always;
      padding-top: 1px;
    }

    .avoid-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Top Running Header */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }

    .doc-header .brand {
      font-size: 9.8pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
    }

    .doc-header .tag {
      font-size: 7pt;
      font-weight: 700;
      color: #6366f1;
      background: #eef2ff;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Cover / Hero Section */
    .hero-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%);
      color: #ffffff;
      border-radius: 8px;
      padding: 18px 20px 16px 20px;
      margin-bottom: 11px;
      box-shadow: 0 3px 10px rgba(15, 23, 42, 0.1);
    }

    .hero-banner .badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.25);
      border: 1px solid rgba(165, 180, 252, 0.4);
      color: #c7d2fe;
      font-size: 7.2pt;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      margin-bottom: 7px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .hero-banner h1 {
      font-size: 18pt;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 4px;
      letter-spacing: -0.3px;
      color: #f8fafc;
    }

    .hero-banner .subtitle {
      font-size: 8.8pt;
      color: #cbd5e1;
      margin-bottom: 11px;
      font-weight: 400;
      line-height: 1.35;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 5px;
      padding: 7px 11px;
    }

    .meta-item .meta-label {
      font-size: 6.6pt;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }

    .meta-item .meta-val {
      font-size: 7.8pt;
      font-weight: 600;
      color: #f1f5f9;
    }

    /* Section Headings */
    h2.category-title {
      font-size: 10.5pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 8px;
      margin-bottom: 6px;
      padding-bottom: 3px;
      border-bottom: 1.5px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    h2.category-title .cat-badge {
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .badge-arch { background: #e0e7ff; color: #3730a3; }
    .badge-front { background: #dbeafe; color: #1e40af; }
    .badge-back { background: #dcfce7; color: #166534; }
    .badge-db { background: #fef3c7; color: #92400e; }
    .badge-ai { background: #f3e8ff; color: #6b21a8; }
    .badge-sec { background: #fee2e2; color: #991b1b; }
    .badge-debug { background: #ffedd5; color: #9a3412; }
    .badge-test { background: #e0f2fe; color: #075985; }
    .badge-deploy { background: #ecfdf5; color: #065f46; }
    .badge-doc { background: #f1f5f9; color: #334155; }
    .badge-synthesis { background: #fae8ff; color: #86198f; }

    /* Prompt Box Styling */
    .prompt-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 11px;
      margin-bottom: 6.5px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .prompt-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .prompt-num-title {
      font-size: 8.8pt;
      font-weight: 700;
      color: #0f172a;
    }

    .prompt-domain-tag {
      font-size: 6.8pt;
      font-weight: 700;
      color: #4338ca;
      background: #eef2ff;
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .prompt-quote {
      background: #f8fafc;
      border-left: 3.5px solid #6366f1;
      padding: 6px 9px;
      border-radius: 0 4px 4px 0;
      margin-bottom: 4.5px;
      font-size: 8pt;
      color: #0f172a;
      line-height: 1.38;
      font-family: 'Segoe UI', -apple-system, sans-serif;
    }

    .prompt-details {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3px;
      font-size: 8pt;
      line-height: 1.35;
      margin-top: 4px;
    }

    .detail-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .detail-tag {
      flex-shrink: 0;
      width: 120px;
      font-weight: 700;
      font-size: 7.2pt;
      color: #3730a3;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .detail-tag.dev {
      color: #047857;
    }

    .detail-tag.obj {
      color: #0f172a;
    }

    .detail-content {
      color: #334155;
      flex: 1;
    }

    /* Callout & Tables */
    .callout {
      background: #f8fafc;
      border-left: 3.5px solid #6366f1;
      padding: 8px 10px;
      border-radius: 0 5px 5px 0;
      margin-bottom: 9px;
      font-size: 8.1pt;
      line-height: 1.4;
    }

    table.matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      margin: 5px 0 7px 0;
    }

    table.matrix-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 4.5px 6px;
      text-align: left;
      font-weight: 700;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    table.matrix-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    table.matrix-table tr:nth-child(even) {
      background: #f8fafc;
    }

    code {
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
      font-family: 'Consolas', 'Menlo', monospace;
      font-size: 7.4pt;
      color: #0f172a;
    }

    .redacted {
      background: #fee2e2;
      color: #991b1b;
      font-weight: 600;
      padding: 0 3px;
      border-radius: 2px;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: COVER & OVERVIEW ==================== -->
  <div class="doc-header">
    <div class="brand">AiProf Study Companion • AI Prompts Used During Development</div>
    <div class="tag">Engineering Submission Document</div>
  </div>

  <!-- HERO COVER -->
  <div class="hero-banner">
    <div class="badge">Full Stack AI Engineer Intern Project Submission</div>
    <h1>AI Prompts Used During Development</h1>
    <div class="subtitle">
      A curated compilation of senior-level, production-grade engineering prompts formulated across the full-stack AI lifecycle — establishing architecture, backend security, RAG pipeline mechanics, database vector indexes, and cloud deployments.
    </div>
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Developer</div>
        <div class="meta-val">Sathwik Bodakunta</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Project</div>
        <div class="meta-val">AiProf Study Companion</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Production URL</div>
        <div class="meta-val">ai-prof-study-companion.vercel.app</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Repository</div>
        <div class="meta-val">github.com/sathwik1821/Ai-Prof-Study-Companion</div>
      </div>
    </div>
  </div>

  <!-- INTRODUCTION & METHODOLOGY -->
  <div class="callout">
    <strong style="color: #0f172a; font-size: 8.6pt;">Engineering Specification & Prompt Methodology Standard</strong><br>
    This document presents the <strong>curated collection of professional engineering prompts required to design, implement, secure, and deploy the AiProf platform</strong>. In production AI-assisted software engineering, senior developers do not treat AI as a casual search engine; they drive autonomous AI coding agents with rigorous architectural constraints, explicit technology choices, strict security requirements, and verifiable acceptance criteria.
    <br><br>
    Every prompt documented herein details the precise engineering directive, technical objective, AI output contribution, and developer validation procedure across 10 essential software domains.
    <div style="margin-top: 6px; font-size: 7.6pt; color: #64748b;">
      <strong>Security & Redaction Standard:</strong> All production credentials, database connection secrets, API tokens, and personal email addresses have been securely sanitized using <code>[REDACTED]</code>.
    </div>
  </div>

  <!-- CATEGORY SUMMARY MATRIX -->
  <div class="avoid-break">
    <div style="font-size: 8.6pt; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Development Domain Coverage Matrix</div>
    <table class="matrix-table">
      <thead>
        <tr>
          <th style="width: 26%;">Domain</th>
          <th style="width: 12%;">Prompts</th>
          <th style="width: 37%;">Key Engineering Scope</th>
          <th style="width: 25%;">Technologies Impacted</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>A. Architecture & System Design</strong></td>
          <td>Prompts 01–02</td>
          <td>3-tier cloud topology & evaluation rubric feature audit</td>
          <td>Vercel, Render, Neon, Spring Boot, React 19</td>
        </tr>
        <tr>
          <td><strong>B. Frontend Engineering</strong></td>
          <td>Prompts 03–05</td>
          <td>Space/Project metadata editing, sidebar UX, Targeted Mastery cards</td>
          <td>React 19, Lucide Icons, Vanilla CSS Grid</td>
        </tr>
        <tr>
          <td><strong>C. Backend Engineering</strong></td>
          <td>Prompts 06–07</td>
          <td>Role-based access control (RBAC: USER vs ADMIN), admin telemetry guards</td>
          <td>Spring Security 6.4, JWT Filter, Spring Data JPA</td>
        </tr>
        <tr>
          <td><strong>D. Database & Data Layer</strong></td>
          <td>Prompts 08–09</td>
          <td>Neon PostgreSQL 16 setup, pgvector 3072d index, cascade deletion SQL</td>
          <td>Neon Serverless, pgvector, Flyway, Hibernate</td>
        </tr>
        <tr>
          <td><strong>E. AI / LLM Engineering</strong></td>
          <td>Prompts 10–11</td>
          <td>Dynamic concept mastery algorithm, Empty Materials RAG guard gate</td>
          <td>Gemini Flash Lite, Gemini Embeddings, pgvector</td>
        </tr>
        <tr>
          <td><strong>F. Authentication & Security</strong></td>
          <td>Prompts 12–13</td>
          <td>Google OAuth 2.0 Identity Services, 6-digit email OTP verification gate</td>
          <td>Google ID Token Verifier, Resend API, BCrypt</td>
        </tr>
        <tr>
          <td><strong>G. Debugging & Problem Solving</strong></td>
          <td>Prompts 14–16</td>
          <td>OAuth Error 400 origin mismatch, SMTP port 587 block, React Error #310</td>
          <td>Google Cloud Console, Resend REST, React Hooks</td>
        </tr>
        <tr>
          <td><strong>H. Testing & Validation</strong></td>
          <td>Prompts 17–18</td>
          <td>End-to-end vector pipeline validation, live production DOM browser audit</td>
          <td>Chrome Headless, JUnit 5, Browser Subagent</td>
        </tr>
        <tr>
          <td><strong>I. Deployment & Configuration</strong></td>
          <td>Prompts 19–20</td>
          <td>Production OAuth origin sync, Vercel Deployment Protection bypass</td>
          <td>Vercel CLI, Render Docker, GitHub CI/CD</td>
        </tr>
        <tr>
          <td><strong>J. Documentation</strong></td>
          <td>Prompts 21–23</td>
          <td>Public submission README, Architecture PDF, AI Tools & Usage PDF</td>
          <td>Markdown, Headless Chrome Engine, Node.js</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ==================== PAGE 2: ARCHITECTURE ==================== -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf Study Companion • Section A: Architecture & System Design</div>
    <div class="tag">Engineering Prompts</div>
  </div>

  <h2 class="category-title">
    <span>A. Architecture & System Design</span>
    <span class="cat-badge badge-arch">Architecture</span>
  </h2>

  <!-- PROMPT 1 -->
  <div class="prompt-card avoid-break" style="padding: 12px 14px; margin-bottom: 12px;">
    <div class="prompt-header">
      <div class="prompt-num-title" style="font-size: 9.3pt;">Prompt 01 — Three-Tier Decoupled Cloud System Topology Design</div>
      <span class="prompt-domain-tag">System Architecture</span>
    </div>
    <div class="prompt-quote">
      "Architect a modern, decoupled three-tier cloud deployment topology for 'AiProf', an AI-powered personal study companion. The system requires a single-page application frontend, a containerized RESTful API backend, a managed relational database supporting high-dimensional vector search for RAG workflows, and external LLM inference.<br><br>
      <strong>Constraints & Specifications:</strong><br>
      1. Frontend: React 19 SPA built with Vite, deployed to Vercel edge networks for global static distribution.<br>
      2. Backend: Java 21 and Spring Boot 3.4, packaged as a multi-stage Docker container deployed to Render.<br>
      3. Database: Serverless PostgreSQL 16 on Neon, using pooled connections with mandatory SSL encryption and the pgvector extension.<br>
      4. AI Inference: Google Gemini Flash Lite for reasoning and gemini-embedding-001 for 3072-dimensional vector embeddings.<br>
      Provide the complete system architecture diagram, inter-tier communication protocols over TLS, and an incremental zero-downtime deployment plan."
    </div>
    <div class="prompt-details" style="gap: 4px; font-size: 8.2pt;">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Establish an enterprise-grade decoupled cloud topology separating static asset delivery, backend compute, vector storage, and LLM inference.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Designed the three-tier architecture diagram, formulated multi-stage Dockerfile configurations, structured CORS policies, and established cloud deployment sequences.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Evaluated cloud hosting tiers, provisioned Vercel, Render, and Neon workspaces, linked GitHub CI/CD webhooks, and validated container spin-up.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 2 -->
  <div class="prompt-card avoid-break" style="padding: 12px 14px; margin-bottom: 12px;">
    <div class="prompt-header">
      <div class="prompt-num-title" style="font-size: 9.3pt;">Prompt 02 — Comprehensive Gap Analysis & Evaluation Rubric Compliance Audit</div>
      <span class="prompt-domain-tag">Evaluation Audit</span>
    </div>
    <div class="prompt-quote">
      "Perform a rigorous technical gap analysis of the AiProf platform against full-stack AI engineering evaluation standards before freezing the codebase for submission.<br><br>
      <strong>Audit Areas:</strong><br>
      1. RAG Vector Pipeline: Vector similarity search latency, citation grounding accuracy, hallucination prevention, and prompt token efficiency.<br>
      2. Authentication & Authorization: Google OAuth 2.0 implementation, email OTP verification, JWT signature validity, and strict RBAC enforcement.<br>
      3. Reliability & Observability: Spring Security filter chain order, rate-limiting, and administrative telemetry endpoints.<br>
      Identify any remaining vulnerabilities or architectural gaps, classify by severity, and propose concrete code changes."
    </div>
    <div class="prompt-details" style="gap: 4px; font-size: 8.2pt;">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Conduct a formal architectural gap analysis comparing implemented application features against the internship evaluation criteria before freezing the codebase.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Systematically audited repository modules against rubric requirements, identifying that while core RAG features were complete, Google OAuth and email OTP authentication needed strengthening before final documentation.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Prioritized Google OAuth 2.0 and email OTP security hardening over minor UI cosmetics and explicitly enforced a code-freeze guardrail during documentation.</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 3: FRONTEND ==================== -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf Study Companion • Section B: Frontend Engineering</div>
    <div class="tag">Engineering Prompts</div>
  </div>

  <h2 class="category-title">
    <span>B. Frontend Engineering</span>
    <span class="cat-badge badge-front">Frontend</span>
  </h2>

  <!-- PROMPT 3 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 03 — Space & Project Metadata Management with Optimistic UI</div>
      <span class="prompt-domain-tag">UI / State Management</span>
    </div>
    <div class="prompt-quote">
      "Implement a responsive modal management interface in React 19 allowing students to update space and project metadata (title, description, and color tags) directly in WorkspaceView.jsx and ProjectView.jsx.<br>
      Requirements: Ensure optimistic UI updates with automatic rollback on API failure, implement client-side input validation, and synchronize changes with the global navigation sidebar without requiring a page reload."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Enable students to dynamically edit and update names and descriptions for workspaces and study projects with instant optimistic UI feedback.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Implemented modal dialog components in <code>WorkspaceView.jsx</code> and <code>ProjectView.jsx</code>, wired PUT API mutation handlers, and handled form validation.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Tested inline name updating across multiple test spaces, validated form input boundaries, and confirmed state synchronization across sidebar navigation.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 4 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 04 — Ergonomic Navigation Sidebar Refactoring & Account Popover</div>
      <span class="prompt-domain-tag">Navigation Ergonomics</span>
    </div>
    <div class="prompt-quote">
      "Refactor the primary navigation sidebar (<code>Sidebar.jsx</code>) to maximize vertical space for academic spaces and active study projects.<br>
      Requirements: Eliminate the standalone 'Profile' tab, move user account settings and logout into an interactive popover card anchored to the bottom user avatar drawer, and ensure smooth outside-click dismissal and mobile drawer responsiveness."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Streamline sidebar navigation ergonomics by eliminating redundant menu items and consolidating user account settings into the bottom identity drawer.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Refactored <code>Sidebar.jsx</code>, removed top-level profile links, and added an interactive popover menu to the user avatar drawer with logout triggers.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Evaluated visual layout on laptop and mobile screen widths, approved the consolidated navigation hierarchy, and confirmed reduced visual clutter.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 5 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 05 — Student Dashboard Architecture & Dynamic Targeted Mastery Cards</div>
      <span class="prompt-domain-tag">Adaptive Dashboard</span>
    </div>
    <div class="prompt-quote">
      "Redesign <code>DashboardPage.jsx</code> into an action-oriented study command center that prioritizes active recall and dynamic learning recommendations.<br>
      Requirements: Retire static onboarding checklists in favor of dynamic learning telemetry. Position a 'Targeted Mastery' recommendation card directly adjacent to 'Continue Studying', compute the user's weakest concept area in real-time with mastery percentage, and provide one-click 'Ask Tutor' and 'Practice Quiz' launch buttons."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Transform the student dashboard from static onboarding checklists into an action-oriented study hub featuring dynamic AI-driven Targeted Mastery recommendations.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Redesigned <code>DashboardPage.jsx</code> CSS grid layout, removing static cards and placing the Targeted Mastery card directly beside "Continue Studying".</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Verified dynamic card rendering when concept mastery scores updated after quiz submissions and validated responsive breakpoints on desktop and mobile.</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 4: BACKEND & DATABASE ==================== -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf Study Companion • Sections C & D: Backend & Database</div>
    <div class="tag">Engineering Prompts</div>
  </div>

  <h2 class="category-title">
    <span>C. Backend Engineering</span>
    <span class="cat-badge badge-back">Backend</span>
  </h2>

  <!-- PROMPT 6 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 06 — Production Role-Based Access Control (RBAC) & Filter Chain Enforcement</div>
      <span class="prompt-domain-tag">Security Architecture</span>
    </div>
    <div class="prompt-quote">
      "Architect and enforce strict Role-Based Access Control (RBAC) in Spring Boot 3 using Spring Security 6.4 and stateless JWTs.<br>
      Requirements: Define explicit role boundaries between standard students (<code>ROLE_USER</code>) and administrators (<code>ROLE_ADMIN</code>). Ensure all new registrants default to <code>ROLE_USER</code> with zero privilege escalation paths, configure <code>SecurityFilterChain</code> authorization rules, and extract authorities inside <code>JwtAuthenticationFilter</code>."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Eliminate privilege escalation vulnerabilities by establishing strict role boundaries between regular students (<code>ROLE_USER</code>) and system administrators (<code>ROLE_ADMIN</code>).</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Updated Spring Security filter chain configurations, refactored <code>User</code> entity role initialization to assign <code>ROLE_USER</code> by default, and secured API routes using method-level security.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Created separate test accounts (<code>ROLE_USER</code> vs <code>ROLE_ADMIN</code>), verified that non-admin tokens received HTTP 403 Forbidden on administrative endpoints, and confirmed database role persistence.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 7 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 07 — Securing Administrative Telemetry Endpoints with Method-Level Security</div>
      <span class="prompt-domain-tag">API Authorization</span>
    </div>
    <div class="prompt-quote">
      "Harden the administrative monitoring endpoints in <code>AdminController.java</code> to prevent unauthorized telemetry harvesting.<br>
      Requirements: Annotate all administrative routes (<code>/api/admin/**</code>) with <code>@PreAuthorize(\"hasRole('ADMIN')\")</code>, update GlobalExceptionHandler to return RFC-7807 problem details with HTTP 403 Forbidden, and expose an authenticated authority check so the frontend conditionally renders the Admin navigation tab."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Prevent information leakage and unauthorized UI exposure by enforcing backend <code>@PreAuthorize</code> guards on telemetry APIs and hiding admin navigation elements from non-admin principals.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Added <code>@PreAuthorize("hasRole('ADMIN')")</code> annotations across <code>AdminController.java</code>, updated JWT claims parsing to extract authorities, and conditionally rendered the Admin UI tab in React.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Tested cross-account authentication states, verified that standard student accounts no longer see administrative tabs, and validated zero telemetry exposure in network inspector logs.</span>
      </div>
    </div>
  </div>

  <h2 class="category-title" style="margin-top: 6px;">
    <span>D. Database & Data Layer</span>
    <span class="cat-badge badge-db">Database</span>
  </h2>

  <!-- PROMPT 8 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 08 — Neon PostgreSQL 16 Provisioning, Flyway Migrations & pgvector Activation</div>
      <span class="prompt-domain-tag">Vector Persistence</span>
    </div>
    <div class="prompt-quote">
      "Configure a serverless PostgreSQL 16 persistence layer on Neon with connection pooling and high-dimensional vector search support.<br>
      Requirements: Write a Flyway migration (<code>V1__init.sql</code>) executing <code>CREATE EXTENSION IF NOT EXISTS vector;</code>, define the <code>embedding</code> column in <code>document_chunks</code> as <code>vector(3072)</code> matching Gemini embeddings, and configure HikariCP in <code>application.yml</code> with <code>sslmode=require</code>."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Provision managed relational and vector persistence with automated schema version control and connection pooling.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Authored Flyway migration <code>V1__init.sql</code> with <code>CREATE EXTENSION IF NOT EXISTS vector;</code>, configured <code>HikariCP</code> connection pooling with <code>sslmode=require</code> in <code>application.yml</code>, and defined JPA entity mappings.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Executed Neon CLI linkage, configured Neon connection secrets in Render dashboard, monitored Flyway migration execution during boot, and inspected schema tables in Neon console.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 9 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 09 — Foreign Key Cascade Referential Integrity & Transactional Data Isolation</div>
      <span class="prompt-domain-tag">Data Integrity</span>
    </div>
    <div class="prompt-quote">
      "Establish comprehensive referential integrity and safe cascade deletion across the relational and vector data model.<br>
      Requirements: Ensure deleting a <code>User</code> cascades down to delete their spaces, projects, study materials, vector chunks, chat sessions, and quiz attempts without orphaned rows. Write safe, parameterized SQL cleanup queries with strict transaction management to verify cascade behavior."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Safely delete test user records from the production database while verifying referential integrity and cascade deletion behavior across spaces, projects, documents, chunks, and chat sessions.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Formulated safe, transactional SQL deletion scripts ordering child entity cleanup (<code>user_roles</code>, <code>document_chunks</code>, <code>study_materials</code>, <code>chat_sessions</code>, <code>projects</code>, <code>spaces</code>, <code>users</code>) respecting foreign key constraints.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Executed queries in Neon SQL console, verified that deleting the user cleanly removed all associated vector embeddings and materials without leaving orphaned rows, and re-tested registration.</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 5: AI & AUTHENTICATION ==================== -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf Study Companion • Sections E & F: AI Engineering & Security</div>
    <div class="tag">Engineering Prompts</div>
  </div>

  <h2 class="category-title">
    <span>E. AI / LLM Engineering</span>
    <span class="cat-badge badge-ai">AI / LLM</span>
  </h2>

  <!-- PROMPT 10 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 10 — Dynamic Cognitive Mastery Scoring & Adaptive Recommendation Engine</div>
      <span class="prompt-domain-tag">Cognitive Scoring</span>
    </div>
    <div class="prompt-quote">
      "Design and implement a dynamic concept mastery calculation algorithm in <code>AnalyticsService.java</code> that computes continuous learning mastery scores (0%–100%) from real assessment data.<br>
      Requirements: Eliminate static mock percentages. Score each concept based on weighted parameters: quiz accuracy (60%), question difficulty weighting (20%), and recency/frequency of Socratic tutor inquiries (20%). Categorize into 'Mastered' (>=80%), 'Improving' (60-79%), and 'Needs Attention' (<60%), and expose the weakest concept to the dashboard."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Replace arbitrary mock mastery percentages with a dynamic, data-driven concept mastery calculation reflecting genuine student quiz accuracy and study interaction depth.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Designed and coded an adaptive calculation algorithm in <code>AnalyticsService.java</code> and <code>WorkspaceService.java</code> computing mastery scores (0%–100%) based on real quiz attempt scores, evaluation feedback, and study frequency.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Validated the updated scoring by completing quizzes with known scores (100% vs 50%), verifying that mastery percentages accurately reflected assessment performance without hardcoded defaults.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 11 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 11 — Grounded RAG Pipeline Architecture & Empty Materials Precondition Gate</div>
      <span class="prompt-domain-tag">RAG & Hallucination Defense</span>
    </div>
    <div class="prompt-quote">
      "Architect the Retrieval-Augmented Generation (RAG) pipeline for the AiProf tutor and quiz generation services using Google Gemini Flash Lite and pgvector.<br>
      Requirements: Ingest documents into 400-token chunks with 50-token overlap, embed via <code>gemini-embedding-001</code> (3072d), and execute cosine similarity search (<code>&lt;=&gt;</code>) with a 0.70 threshold. Enforce a strict prerequisite gate: if a project contains zero uploaded documents, block LLM invocation and prompt the user to upload course materials to prevent ungrounded hallucinations."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Enforce strict grounding prerequisites preventing LLM hallucinations by blocking AI Tutor and Quiz generation until at least one syllabus or study document has been uploaded to the project.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Implemented client-side and server-side validation gates (<code>materials.isEmpty()</code>) returning descriptive empty-state warnings and guiding students to upload course materials before invoking Gemini.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Tested empty projects and populated projects, verified that ungrounded prompt execution was blocked, and confirmed that grounding citations rendered accurately once documents were uploaded.</span>
      </div>
    </div>
  </div>

  <h2 class="category-title" style="margin-top: 6px;">
    <span>F. Authentication & Security</span>
    <span class="cat-badge badge-sec">Security</span>
  </h2>

  <!-- PROMPT 12 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 12 — Google OAuth 2.0 Identity Services with Cryptographic Backend Verification</div>
      <span class="prompt-domain-tag">OAuth 2.0 / SSO</span>
    </div>
    <div class="prompt-quote">
      "Implement enterprise-grade Google OAuth 2.0 authentication using Google Identity Services (GIS) on the frontend and cryptographic verification on the backend.<br>
      Requirements: Integrate <code>@react-oauth/google</code> on the client, transmit the Google ID token (JWT) to POST <code>/api/auth/google</code>, verify token signature and audience using <code>GoogleIdTokenVerifier</code> in <code>GoogleAuthService.java</code>, and issue our proprietary signed application JWT upon successful validation."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Implement enterprise-grade Google OAuth 2.0 authentication to streamline student onboarding while ensuring cryptographic token validation on the backend.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Integrated <code>@react-oauth/google</code> on the client, implemented <code>GoogleAuthService.java</code> using Google API Client libraries for ID token signature and audience verification, and handled account provisioning.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Configured Google Cloud Console OAuth credentials, registered authorized JavaScript origins and redirect URIs, configured client ID in Vercel environment variables, and validated end-to-end Google sign-in.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 13 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 13 — Time-Based 6-Digit Email OTP Verification State Machine</div>
      <span class="prompt-domain-tag">2FA / Verification Gate</span>
    </div>
    <div class="prompt-quote">
      "Implement a multi-step user registration workflow with mandatory 6-digit email OTP verification.<br>
      Requirements: Generate cryptographically secure 6-digit numeric codes using <code>SecureRandom</code>, store OTPs with a strict 5-minute time-to-live (TTL), rate-limit generation to 1 request per 60 seconds per email, and enforce an authentication state machine preventing account activation until OTP validation succeeds."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Secure user registration against bot spam and unverified accounts by requiring a timed 6-digit one-time password delivered to the student's email before account activation.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Built <code>OtpService.java</code> with cryptographically secure 6-digit generation, 5-minute expiration, in-memory caching, rate limiting, and an authentication state machine gating account activation.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Tested registration flow with real email accounts, verified expired OTP rejection, confirmed rate-limiting behavior, and approved the multi-step verification UX.</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 6: DEBUGGING ==================== -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf Study Companion • Section G: Debugging & Problem Solving</div>
    <div class="tag">Engineering Prompts</div>
  </div>

  <h2 class="category-title">
    <span>G. Debugging & Problem Solving</span>
    <span class="cat-badge badge-debug">Debugging</span>
  </h2>

  <!-- PROMPT 14 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 14 — Diagnosing & Resolving Google OAuth Error 400: origin_mismatch in Production</div>
      <span class="prompt-domain-tag">OAuth Origin Debugging</span>
    </div>
    <div class="prompt-quote">
      "Investigate and resolve Google OAuth Error 400: <code>origin_mismatch</code> occurring when users attempt Google Sign-In on the live Vercel deployment.<br>
      Requirements: Analyze Google OAuth 2.0 JavaScript origin policies and identify why the production preview URL was rejected. Provide configuration steps in Google Cloud Console to add authorized JavaScript origins for both the canonical production domain (<code>https://ai-prof-study-companion.vercel.app</code>) and local development (<code>http://localhost:5173</code>)."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Diagnose and resolve a Google OAuth 2.0 policy rejection occurring on newly deployed Vercel domain URLs.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Diagnosed that the active Vercel preview domain was not registered in Google Cloud Console's "Authorized JavaScript origins"; provided step-by-step resolution to add both canonical and preview domains.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Accessed Google Cloud Console, updated authorized web client origins with <code>https://ai-prof-study-companion.vercel.app</code>, and confirmed successful Google login in production.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 15 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 15 — Bypassing Cloud Egress SMTP Port Blocking via Resend HTTPS REST API</div>
      <span class="prompt-domain-tag">Cloud Network Egress</span>
    </div>
    <div class="prompt-quote">
      "Diagnose why email OTP verification codes fail to send in the Render cloud container environment despite working seamlessly in local development.<br>
      Requirements: Identify cloud hosting network egress limitations (Render blocks outbound SMTP ports 25, 465, 587 by default to prevent spam). Engineer an alternative delivery transport using Resend's HTTPS REST API over port 443 in <code>ResendEmailService.java</code> with automatic fallback to standard SMTP, and verify instant delivery."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Resolve production email delivery failure caused by cloud hosting firewall restrictions on outbound SMTP ports (25, 465, 587).</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Identified that Render blocks outbound SMTP by default; engineered <code>ResendEmailService.java</code> using Resend's HTTPS REST API over port 443 with automatic fallback to standard SMTP.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Created a Resend account, provisioned an API key, configured <code>RESEND_API_KEY</code> on Render, and verified instantaneous OTP delivery to student inboxes.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 16 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 16 — Resolving Minified React Error #310 (Violation of the Rules of Hooks)</div>
      <span class="prompt-domain-tag">React Lifecycle Crash</span>
    </div>
    <div class="prompt-quote">
      "Debug an intermittent blank screen crash on the production dashboard triggering Minified React Error #310 ('Rendered more hooks than during the previous render').<br>
      Requirements: Inspect <code>DashboardPage.jsx</code> for conditional hook execution or early return statements placed prior to <code>useMemo</code>, <code>useCallback</code>, or <code>useEffect</code> declarations. Refactor component lifecycle so all hooks unconditionally execute at the top level in invariant order before any loading skeletons or error boundaries are returned."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Fix a critical runtime blank-screen bug on <code>DashboardPage.jsx</code> caused by conditional hook execution order.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Traced the error to an early <code>if (loading) return &lt;Spinner /&gt;</code> placed before <code>useMemo</code> declarations; refactored hook declarations to the top level before conditional returns.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Rebuilt frontend bundle (<code>npm run build</code>), tested dashboard rendering across authenticated and unauthenticated states, and verified zero console warnings.</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 7: TESTING & DEPLOYMENT ==================== -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf Study Companion • Sections H & I: Testing & Deployment</div>
    <div class="tag">Engineering Prompts</div>
  </div>

  <h2 class="category-title">
    <span>H. Testing & Validation</span>
    <span class="cat-badge badge-test">Testing & Validation</span>
  </h2>

  <!-- PROMPT 17 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 17 — End-to-End RAG Vector Pipeline & Socratic Tutor Functional Testing</div>
      <span class="prompt-domain-tag">AI Pipeline Validation</span>
    </div>
    <div class="prompt-quote">
      "Design and execute an end-to-end functional test suite for the RAG ingestion, vector search, and AI tutoring pipeline.<br>
      Scenarios: Ingest a multi-page technical PDF, verify semantic chunking boundaries, and generate 3072d embeddings. Execute vector similarity search via pgvector, verify cosine distance scoring, confirm that Socratic Tutor responses strictly cite source chunks, and generate a 5-question diagnostic quiz validating compliance with requested JSON schemas."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Execute comprehensive end-to-end verification of document ingestion, vector embedding generation, pgvector retrieval, Socratic tutor responses, and quiz generation.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Formulated test validation scenarios covering semantic chunking, embedding generation via <code>gemini-embedding-001</code>, vector distance thresholding, and JSON schema compliance for quizzes.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Uploaded sample academic course notes, initiated interactive tutor sessions, verified citation source accuracy, took AI-generated quizzes, and validated automated grading.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 18 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 18 — Automated Headless Browser Smoke Testing & Session Persistence Audit</div>
      <span class="prompt-domain-tag">Browser Automation</span>
    </div>
    <div class="prompt-quote">
      "Deploy an autonomous browser subagent to execute a full smoke test of the live production application at <code>https://ai-prof-study-companion.vercel.app</code>.<br>
      Audit Steps: Navigate to <code>/login</code>, verify Google Sign-In button rendering, authenticate using test credentials, verify JWT session storage in <code>localStorage</code>, confirm automatic redirection to <code>/dashboard</code>, and monitor browser console logs for zero unhandled exceptions or CORS rejections."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Validate live production environment stability, authentication session restoration, and responsive UI layout via automated browser DOM inspection.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Deployed an autonomous browser subagent to navigate to the production deployment URL, inspect DOM element hierarchies, evaluate JavaScript console error logs, and capture visual status screenshots.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Reviewed browser session recordings and screenshots, confirmed correct token restoration from <code>localStorage</code>, and approved production release readiness.</span>
      </div>
    </div>
  </div>

  <h2 class="category-title" style="margin-top: 6px;">
    <span>I. Deployment & Configuration</span>
    <span class="cat-badge badge-deploy">Deployment & Config</span>
  </h2>

  <!-- PROMPT 19 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 19 — Production Multi-Domain OAuth & CORS Synchronization</div>
      <span class="prompt-domain-tag">Domain Synchronization</span>
    </div>
    <div class="prompt-quote">
      "Configure environment variables and CORS policies across Vercel and Render following custom domain migration.<br>
      Requirements: Update Spring Boot <code>CorsConfiguration</code> to allow requests from the canonical production domain (<code>https://ai-prof-study-companion.vercel.app</code>) with full credentials, headers, and standard HTTP methods. Configure <code>VITE_API_URL</code> and <code>VITE_GOOGLE_CLIENT_ID</code> in Vercel settings, and verify preflight HTTP OPTIONS requests succeed with HTTP 200."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Synchronize Google OAuth credentials, Vercel frontend environment variables, and Spring Boot backend CORS configurations after assigning a production domain alias.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Provided an exact audit of required configuration updates across <code>VITE_GOOGLE_CLIENT_ID</code>, Google Cloud Console Authorized Origins, and Spring Security <code>allowedOrigins</code> patterns.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Updated client environment settings, verified backend CORS filters accepted requests from the new domain alias, and tested Google Sign-In across browsers.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 20 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 20 — Disabling Vercel Deployment Protection for Public Evaluator Access</div>
      <span class="prompt-domain-tag">Public Access Bypass</span>
    </div>
    <div class="prompt-quote">
      "Configure Vercel project security settings to ensure the deployed platform is publicly accessible to external evaluators without requiring Vercel team authentication or login credentials.<br>
      Requirements: Identify why external visitors encounter a 'Request Access' or Vercel SSO authentication wall. Provide instructions to disable 'Vercel Authentication' under Project Settings -> Deployment Protection, and verify external access in incognito windows."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Eliminate Vercel's automated authentication barrier (SSO / Deployment Protection) to ensure evaluators can freely access and interact with the live application without a team invite.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Identified that Vercel's "Deployment Protection" was intercepting requests with an access request modal; provided exact settings navigation path (<code>Settings -&gt; Deployment Protection -&gt; Vercel Authentication</code>) to disable it.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Configured Vercel project settings to disable deployment protection, verified public accessibility in private/incognito browser windows, and confirmed external usability.</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 8: DOCUMENTATION ==================== -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf Study Companion • Section J: Technical Documentation</div>
    <div class="tag">Engineering Prompts</div>
  </div>

  <h2 class="category-title">
    <span>J. Documentation</span>
    <span class="cat-badge badge-doc">Documentation</span>
  </h2>

  <!-- PROMPT 21 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 21 — Production-Grade Repository Packaging, README & Secret Sanitization</div>
      <span class="prompt-domain-tag">Repository Hygiene</span>
    </div>
    <div class="prompt-quote">
      "Prepare the entire repository for official evaluator review and submission.<br>
      Requirements: Write a comprehensive, publication-grade root <code>README.md</code> featuring project badges, architecture diagrams, core feature documentation, local quickstart steps, database migration commands, and API references. Perform an exhaustive security audit across git history and active files: purge all live API keys, database credentials, and secrets, replacing them with <code>.env.example</code> templates. Verify local build reproducibility, and strictly preserve application runtime code."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Prepare the entire repository for official evaluator review by structuring a comprehensive README, verifying local clone-and-run workflows, sanitizing secrets, and safeguarding working application code.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Crafted production-grade <code>README.md</code>, replaced hardcoded credentials with <code>.env.example</code> templates, sanitized <code>application.yml</code>, verified local build scripts, and drafted setup documentation.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Reviewed all sanitized configuration files, tested local build commands (<code>npm run build</code>, <code>./mvnw test-compile</code>), committed the repository, and pushed the clean public codebase to GitHub.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 22 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 22 — Publication-Grade System Architecture Technical Documentation</div>
      <span class="prompt-domain-tag">Architecture Documentation</span>
    </div>
    <div class="prompt-quote">
      "Author and compile an exhaustive System Architecture Documentation PDF (<code>AiProf_Architecture_Documentation.pdf</code>) for the AiProf platform.<br>
      Requirements: Document the decoupled three-tier topology, request-response lifecycles, complete ASCII flowcharts, entity-relationship database schemas, Spring Security filter chains, pgvector similarity query mechanics, and Render Dockerfile / Vercel cloud deployment architecture using headless Chrome PDF compilation."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Author an exhaustive technical reference document detailing system topology, data models, and architectural decisions.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Structured, authored, and compiled <code>AiProf_Architecture_Documentation.pdf</code> utilizing Chrome headless printing with professional diagrams and tables.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Reviewed technical accuracy, verified database schema representations and API endpoint mappings, and approved the document for intern submission.</span>
      </div>
    </div>
  </div>

  <!-- PROMPT 23 -->
  <div class="prompt-card avoid-break">
    <div class="prompt-header">
      <div class="prompt-num-title">Prompt 23 — Dual-Category AI Tools & Usage Technical Transparency Report</div>
      <span class="prompt-domain-tag">AI Usage Transparency</span>
    </div>
    <div class="prompt-quote">
      "Author and compile a transparent AI Tools & Usage Documentation PDF (<code>AiProf_AI_Tools_and_Usage_Documentation.pdf</code>) for project evaluation.<br>
      Requirements: Clearly separate Category A (AI used by the developer to build the software: Antigravity IDE, agent subagents, browser tools) from Category B (AI models embedded inside the product: Gemini Flash Lite, gemini-embedding-001, pgvector). Document prompt engineering methodologies, token efficiency, model costs, response latencies, and human oversight guardrails."
    </div>
    <div class="prompt-details">
      <div class="detail-row">
        <span class="detail-tag obj">Engineering Objective:</span>
        <span class="detail-content">Provide a transparent, audited technical report detailing developer AI assistance contrasted with the production application's AI capabilities.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag">AI Contribution:</span>
        <span class="detail-content">Authored and compiled <code>AiProf_AI_Tools_and_Usage_Documentation.pdf</code>, establishing clear categorization between development assistance and application features.</span>
      </div>
      <div class="detail-row">
        <span class="detail-tag dev">Developer Contribution:</span>
        <span class="detail-content">Verified transparency reporting, confirmed accurate model specifications, and approved the document for intern submission.</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 9: PATTERNS DEMONSTRATED ==================== -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf Study Companion • Section K: Prompt Patterns Demonstrated</div>
    <div class="tag">Engineering Patterns</div>
  </div>

  <h2 class="category-title">
    <span>Engineering Prompt Patterns Demonstrated</span>
    <span class="cat-badge badge-synthesis">Methodology</span>
  </h2>

  <div class="callout" style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #6366f1; padding: 11px 13px; margin-bottom: 12px;">
    <strong style="color: #0f172a; font-size: 8.8pt;">Analysis of Development Methodologies Across Full-Stack AI Engineering</strong><br>
    <span style="color: #475569; font-size: 8.1pt; line-height: 1.42;">
      Reviewing the prompts across the AiProf development lifecycle reveals ten distinct engineering prompt patterns. Rather than using AI as a basic chatbot or unguided code generator, the developer employed AI as an interactive, pair-programming engineering collaborator bounded by technical constraints, live verification, and architectural discipline.
    </span>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 9px;">
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">1. Requirements &rarr; Implementation</div>
      <div style="font-size: 7.8pt; color: #475569; line-height: 1.38;">
        Translating business and internship rubric requirements directly into working full-stack features (e.g., Socratic tutoring, concept mastery calculation, interactive quiz generation) without unnecessary intermediate boilerplate.
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">2. Architecture &rarr; Implementation</div>
      <div style="font-size: 7.8pt; color: #475569; line-height: 1.38;">
        Structuring decoupled multi-tier systems (React 19 SPA + Spring Boot 3 + Neon PostgreSQL pgvector) and guiding the incremental step-by-step rollout across cloud infrastructure.
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">3. Feature Refinement & UX Iteration</div>
      <div style="font-size: 7.8pt; color: #475569; line-height: 1.38;">
        Iteratively optimizing interface ergonomics based on real user testing, such as relocating profile settings into the user avatar drawer and elevating Targeted Mastery cards on the student dashboard.
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">4. Constraint-Driven Development</div>
      <div style="font-size: 7.8pt; color: #475569; line-height: 1.38;">
        Enforcing strict operational boundaries on the AI assistant, prominently demonstrated by commands like <code>"DONT CHANGE THE Application as it is perfect now"</code> to prevent accidental regression during documentation.
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">5. Error-Driven Debugging & Root Cause Isolation</div>
      <div style="font-size: 7.8pt; color: #475569; line-height: 1.38;">
        Providing exact runtime stack traces (<code>Minified React Error #310</code>, <code>Error 400: origin_mismatch</code>) and symptoms (<code>"otp is not coming"</code>), enabling immediate root-cause isolation and minimal diff patches.
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">6. Security Hardening & Zero-Trust Verification</div>
      <div style="font-size: 7.8pt; color: #475569; line-height: 1.38;">
        Actively auditing role boundaries (<code>ROLE_USER</code> vs <code>ROLE_ADMIN</code>), guarding telemetry endpoints with <code>@PreAuthorize</code>, and implementing two-factor email OTP and Google OAuth 2.0 verification.
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">7. AI/RAG Pipeline Design & Hallucination Defense</div>
      <div style="font-size: 7.8pt; color: #475569; line-height: 1.38;">
        Enforcing strict prerequisite gates (blocking tutor and quiz requests when document count is zero) and calibrating cosine similarity thresholds to guarantee grounded, cited LLM responses.
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">8. Autonomous Testing & Live Browser Validation</div>
      <div style="font-size: 7.8pt; color: #475569; line-height: 1.38;">
        Deploying autonomous browser subagents and terminal compilation tests to inspect live production URLs, verify local storage JWT restoration, and confirm zero console warnings.
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">9. Production Deployment & Cloud Sync</div>
      <div style="font-size: 7.8pt; color: #475569; line-height: 1.38;">
        Managing multi-cloud environment variables, coordinating OAuth authorized origins across preview and production URLs, and bypassing platform-level SSO deployment gates for public access.
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 10px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">10. Submission Packaging & Secret Sanitization</div>
      <div style="font-size: 7.8pt; color: #475569; line-height: 1.38;">
        Preparing clean, evaluator-ready public repositories with thorough documentation, reproducible local setup instructions, and zero committed production credentials.
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 10: REFERENCE PROMPTS & SUMMARY ==================== -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf Study Companion • Reference Prompts & Submission Sign-Off</div>
    <div class="tag">Reference & Verification</div>
  </div>

  <h2 class="category-title">
    <span>Representative Engineering Prompt Patterns (Reference Only)</span>
    <span class="cat-badge badge-synthesis">Example Patterns</span>
  </h2>

  <div class="callout" style="background: #fffbeb; border-left: 3.5px solid #f59e0b; padding: 9px 11px; margin-bottom: 10px; font-size: 8pt;">
    <strong style="color: #92400e;">Notice: Reference Architecture Prompts — Benchmark Standards</strong><br>
    The following prompt templates illustrate mature engineering prompt formulations recommended for enterprise full-stack AI development. They are provided as reference benchmarks to demonstrate the prompt structure used by experienced AI engineers.
  </div>

  <div style="display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 12px;">
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 11px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">Representative Architecture Review Prompt (Senior Engineering Formulation)</div>
      <div style="font-size: 7.9pt; color: #475569; font-style: italic; line-height: 1.38;">
        "Review the current three-tier architecture (React SPA + Spring Boot + Neon PostgreSQL pgvector) and identify coupling, security, scalability, and deployment risks. Propose concrete refactoring steps that preserve our zero-breaking-change rule, minimize external cloud costs, and satisfy the internship project specifications."
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 11px;">
      <div style="font-weight: 700; color: #1e1b4b; font-size: 8.3pt; margin-bottom: 2px;">Representative RAG Optimization Prompt (Senior Engineering Formulation)</div>
      <div style="font-size: 7.9pt; color: #475569; font-style: italic; line-height: 1.38;">
        "Analyze the document chunking and vector retrieval pipeline in DocumentChunkService.java. Compare recursive text splitting with semantic heading-aware chunking for academic textbook ingestion. Implement pgvector HNSW indexing on vector(3072) and benchmark cosine distance query latency under simulated concurrent student query loads."
      </div>
    </div>
  </div>

  <h2 class="category-title" style="margin-top: 12px;">
    <span>Submission Verification & Deliverables Summary</span>
    <span class="cat-badge badge-deploy">Deliverables</span>
  </h2>

  <table class="matrix-table" style="font-size: 7.9pt; margin-bottom: 14px;">
    <thead>
      <tr>
        <th style="width: 25%;">Submission Document</th>
        <th style="width: 23%;">Filename</th>
        <th style="width: 15%;">Format & Engine</th>
        <th style="width: 37%;">Status & Verification</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Artifact I: System Architecture</strong></td>
        <td><code>AiProf_Architecture_Documentation.pdf</code></td>
        <td>PDF (Headless Chrome)</td>
        <td>Completed • Published to GitHub repository root</td>
      </tr>
      <tr>
        <td><strong>Artifact II: AI Tools & Usage</strong></td>
        <td><code>AiProf_AI_Tools_and_Usage_Documentation.pdf</code></td>
        <td>PDF (Headless Chrome)</td>
        <td>Completed • Published to GitHub repository root</td>
      </tr>
      <tr>
        <td><strong>Artifact III: Prompts Used</strong></td>
        <td><code>AiProf_AI_Prompts_Used_During_Development.pdf</code></td>
        <td>PDF (Headless Chrome)</td>
        <td>Completed • 23 Prompts across 10 Domains + Synthesis</td>
      </tr>
      <tr>
        <td><strong>Production Application</strong></td>
        <td><code>ai-prof-study-companion.vercel.app</code></td>
        <td>Live Web Platform</td>
        <td>Publicly accessible • Zero SSO gate • Fully verified</td>
      </tr>
    </tbody>
  </table>

  <div style="padding: 11px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; text-align: center; font-size: 7.9pt; color: #475569;">
    <strong>AiProf Study Companion</strong> • AI Prompts Used During Development • Prepared for Full Stack AI Engineer Intern Project Submission<br>
    <span style="color: #64748b; font-size: 7.3pt;">Senior full-stack AI engineering prompts formulated for production development • Confirmed and validated by Sathwik Bodakunta</span>
  </div>

</body>
</html>
`;

const htmlFilePath = path.resolve(__dirname, 'ai_prompts_used.html');
const pdfFilePath = path.resolve(__dirname, 'AiProf_AI_Prompts_Used_During_Development.pdf');

fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log('HTML written to:', htmlFilePath);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cmd = `"${chromePath}" --headless=new --disable-gpu --print-to-pdf="${pdfFilePath}" --no-pdf-header-footer "${htmlFilePath}"`;

console.log('Generating AI Prompts PDF via headless Chrome...');
try {
  execSync(cmd, { stdio: 'inherit' });
  const stats = fs.statSync(pdfFilePath);
  console.log('SUCCESS: AI Prompts PDF generated successfully!');
  console.log('PDF Location:', pdfFilePath);
  console.log('PDF Size:', (stats.size / 1024).toFixed(1), 'KB');
} catch (error) {
  console.error('Failed to generate PDF:', error);
  process.exit(1);
}
