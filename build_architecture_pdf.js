const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AiProf Study Companion — Architecture Documentation</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
        font-size: 9pt;
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
      line-height: 1.52;
      font-size: 10pt;
    }

    /* Page Breaks */
    .page-break {
      page-break-before: always;
      padding-top: 8px;
    }

    .avoid-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Header & Footer */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-bottom: 20px;
    }

    .doc-header .brand {
      font-size: 13pt;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.3px;
    }

    .doc-header .brand span {
      color: #2563eb;
    }

    .doc-header .meta {
      font-size: 8.5pt;
      color: #64748b;
      text-align: right;
    }

    /* Cover Page */
    .cover-container {
      padding: 60px 20px 40px;
      text-align: center;
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .cover-badge {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 9.5pt;
      font-weight: 600;
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .cover-title {
      font-size: 30pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.15;
      letter-spacing: -0.8px;
      margin-bottom: 12px;
    }

    .cover-title span {
      color: #2563eb;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #475569;
      max-width: 620px;
      margin: 0 auto 36px;
      line-height: 1.45;
    }

    .cover-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      max-width: 580px;
      margin: 0 auto 40px;
      text-align: left;
    }

    .cover-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      row-gap: 10px;
      font-size: 9.5pt;
    }

    .cover-grid .label {
      color: #64748b;
      font-weight: 600;
    }

    .cover-grid .val {
      color: #0f172a;
      font-weight: 500;
    }

    .cover-highlights {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 10px;
    }

    .cover-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 8.5pt;
      font-weight: 600;
      color: #334155;
    }

    /* Headings */
    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #e2e8f0;
      letter-spacing: -0.4px;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 16px;
      margin-bottom: 8px;
      letter-spacing: -0.2px;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #334155;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    p {
      margin-bottom: 10px;
      text-align: justify;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 10px;
    }

    li {
      margin-bottom: 4px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px;
      font-size: 8.5pt;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
      font-family: Consolas, monospace;
    }

    .badge-get { background: #dbeafe; color: #1e40af; }
    .badge-post { background: #dcfce7; color: #166534; }
    .badge-del { background: #fee2e2; color: #991b1b; }
    .badge-put { background: #fef3c7; color: #92400e; }

    /* Code & Callouts */
    code {
      font-family: 'Consolas', 'Courier New', monospace;
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 8.5pt;
      color: #0f172a;
    }

    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 12px;
      border-radius: 8px;
      font-size: 8pt;
      line-height: 1.4;
      margin: 10px 0;
      overflow-x: hidden;
      font-family: 'Consolas', 'Courier New', monospace;
    }

    .callout {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      margin: 12px 0;
      font-size: 9pt;
    }

    .callout strong {
      color: #1e40af;
    }

    /* Diagram Wrappers */
    .diagram-container {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 14px 10px;
      margin: 14px 0 16px;
      text-align: center;
    }

    .diagram-caption {
      font-size: 8.5pt;
      font-weight: 600;
      color: #475569;
      margin-top: 6px;
    }

    svg {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- COVER PAGE                                                       -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="cover-container">
    <div>
      <div class="cover-badge">Full Stack AI Engineer Intern • Project Submission</div>
      <h1 class="cover-title">AiProf Study Companion</h1>
      <div style="font-size: 16pt; font-weight: 700; color: #2563eb; margin-bottom: 8px;">System Architecture & Technical Specification</div>
      <p class="cover-subtitle">
        A Production-Grade Educational Platform with Retrieval-Augmented Generation (RAG), Socratic AI Tutoring, Vector Search, and Cognitive Mastery Tracking.
      </p>

      <div class="cover-card">
        <div class="cover-grid">
          <div class="label">Candidate / Author:</div>
          <div class="val">Sathwik Bodakunta</div>
          <div class="label">Target Role:</div>
          <div class="val">Full Stack AI Engineer Intern</div>
          <div class="label">Repository:</div>
          <div class="val"><code>github.com/sathwik1821/Ai-Prof-Study-Companion</code></div>
          <div class="label">Live Production URL:</div>
          <div class="val"><code>ai-prof-study-companion.vercel.app</code></div>
          <div class="label">Backend Runtime:</div>
          <div class="val">Java 21 (Temurin) • Spring Boot 3.4.3 • Docker</div>
          <div class="label">Database & Vector:</div>
          <div class="val">PostgreSQL 16 + pgvector (3072-dim embeddings)</div>
          <div class="label">AI Foundations:</div>
          <div class="val">Google Gemini Flash Lite • gemini-embedding-001</div>
          <div class="label">Date:</div>
          <div class="val">September 2026</div>
        </div>
      </div>
    </div>

    <div>
      <div class="cover-highlights">
        <div class="cover-pill">Spring Boot 3.4.3</div>
        <div class="cover-pill">React 19 & Vite 8</div>
        <div class="cover-pill">PostgreSQL pgvector</div>
        <div class="cover-pill">Google Gemini AI</div>
        <div class="cover-pill">Google OAuth2 + OTP</div>
        <div class="cover-pill">Flyway V1–V7</div>
      </div>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 1: PROJECT OVERVIEW                                      -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf <span>Architecture Documentation</span></div>
    <div class="meta">1. Project Overview & 2. System Architecture</div>
  </div>

  <h1>1. Project Overview</h1>

  <h3>1.1 Project Purpose</h3>
  <p>
    <strong>AiProf Study Companion</strong> is a full-stack educational companion system engineered to address the critical challenges of self-directed academic learning in higher education. Students frequently experience cognitive overload when navigating hundreds of pages of unindexed slides, textbook chapters, and lecture notes. Standard generative AI chatbots exacerbate this issue by generating unverified answers prone to hallucinations and offering answers directly without fostering genuine conceptual understanding.
  </p>
  <p>
    AiProf bridges this gap by grounding conversational AI directly inside the student's authentic curriculum documents through <strong>Retrieval-Augmented Generation (RAG)</strong> and enforcing a <strong>Socratic pedagogy</strong> that guides students to discover solutions through critical inquiry rather than rote recitation.
  </p>

  <h3>1.2 Problem Being Solved</h3>
  <ul>
    <li><strong>Ungrounded AI Hallucinations:</strong> Standard commercial LLMs lack visibility into specific professor syllabi and generate generic or factually inaccurate answers. AiProf solves this by indexing verified course documents with dense 3072-dimensional vector embeddings and restricting retrieval strictly to cited excerpts.</li>
    <li><strong>Passive vs. Active Learning:</strong> Direct-answer bots inhibit long-term retention. AiProf implements an inquiry-driven Socratic tutoring protocol with clickable source citations.</li>
    <li><strong>Knowledge Decay & Fragmented Tracking:</strong> Students lack visibility into where their knowledge gaps reside. AiProf tracks per-concept mastery scores ($0\% - 100\%$) across time and dynamically serves <em>Prescriptive Learning Targets</em> on the dashboard.</li>
  </ul>

  <h3>1.3 Main System Features</h3>
  <ul>
    <li><strong>Hierarchical Knowledge Organization:</strong> <em>Spaces</em> (academic domains) &rarr; <em>Projects</em> (courses/modules) &rarr; <em>Materials</em> (uploaded PDF, DOCX, TXT, MD files).</li>
    <li><strong>Dense Vector Document Ingestion:</strong> Automated text extraction (Apache Tika), semantic chunking (400 tokens / 50 overlap), and native PostgreSQL <code>pgvector</code> indexing using Google Gemini embeddings.</li>
    <li><strong>Socratic AI Tutor with Strict Citations:</strong> Chat interface providing conversational dialogue backed by chunk-level citations (document name, page, and chunk index).</li>
    <li><strong>Empty Materials Gate:</strong> Prevents ungrounded tutor sessions and quiz generation if a project contains zero uploaded source materials.</li>
    <li><strong>Adaptive Diagnostic Quizzing:</strong> AI-synthesized multiple-choice, true/false, and short-answer assessments with automated grading and conceptual feedback.</li>
    <li><strong>Learning Continuity & Targeted Mastery:</strong> Dashboard displaying real-time counters, last accessed projects, and an automated prescriptive growth recommendation card.</li>
    <li><strong>Dual Enterprise Authentication:</strong> Google OAuth 2.0 Sign-In via Google Identity Services (GIS) button and traditional Email/Password with mandatory 6-digit OTP verification via Resend REST API or Gmail SMTP.</li>
  </ul>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 2: SYSTEM ARCHITECTURE                                   -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <h1>2. System Architecture</h1>
  <p>
    AiProf utilizes a three-tier decoupled client-server architecture with dedicated external AI and vector storage subsystems. The client communicates with the backend exclusively via a stateless REST API secured by JWT bearer authentication.
  </p>

  <div class="diagram-container avoid-break">
    <svg viewBox="0 0 760 300" width="760" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-4%" y="-4%" width="108%" height="112%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.08"/>
        </filter>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6"/>
        </marker>
        <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981"/>
        </marker>
      </defs>

      <!-- Client Tier -->
      <rect x="20" y="30" width="200" height="240" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="20" y="30" width="200" height="32" rx="8" fill="#3b82f6"/>
      <text x="120" y="52" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">CLIENT TIER (Vercel Edge)</text>
      
      <rect x="35" y="75" width="170" height="36" rx="5" fill="#ffffff" stroke="#93c5fd" stroke-width="1"/>
      <text x="120" y="97" fill="#1e293b" font-size="9" font-weight="600" text-anchor="middle">React 19 / Vite 8 SPA</text>
      
      <rect x="35" y="120" width="170" height="36" rx="5" fill="#ffffff" stroke="#93c5fd" stroke-width="1"/>
      <text x="120" y="142" fill="#1e293b" font-size="9" font-weight="600" text-anchor="middle">Google Identity Services (GIS)</text>
      
      <rect x="35" y="165" width="170" height="36" rx="5" fill="#ffffff" stroke="#93c5fd" stroke-width="1"/>
      <text x="120" y="187" fill="#1e293b" font-size="9" font-weight="600" text-anchor="middle">Axios + JWT Interceptors</text>

      <rect x="35" y="210" width="170" height="42" rx="5" fill="#ffffff" stroke="#93c5fd" stroke-width="1"/>
      <text x="120" y="228" fill="#1e293b" font-size="8.5" font-weight="600" text-anchor="middle">Glassmorphism Design System</text>
      <text x="120" y="242" fill="#64748b" font-size="7.5" text-anchor="middle">Chart.js • Lucide Icons</text>

      <!-- Communication Arrow 1 -->
      <path d="M 220 140 L 275 140" stroke="#3b82f6" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="247" y="132" fill="#2563eb" font-size="7.5" font-weight="700" text-anchor="middle">HTTPS/REST</text>
      <text x="247" y="153" fill="#64748b" font-size="7" text-anchor="middle">Bearer JWT</text>

      <!-- Backend Tier -->
      <rect x="280" y="20" width="220" height="260" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="280" y="20" width="220" height="32" rx="8" fill="#1e293b"/>
      <text x="390" y="42" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">BACKEND TIER (Render Container)</text>

      <rect x="295" y="65" width="190" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="390" y="84" fill="#0f172a" font-size="8.5" font-weight="600" text-anchor="middle">Spring Security 6 (JWT / CORS)</text>

      <rect x="295" y="103" width="190" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="390" y="122" fill="#0f172a" font-size="8.5" font-weight="600" text-anchor="middle">REST Controllers (Auth/Spaces/RAG)</text>

      <rect x="295" y="141" width="190" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="390" y="160" fill="#0f172a" font-size="8.5" font-weight="600" text-anchor="middle">Business Layer (RagService/Tutor)</text>

      <rect x="295" y="179" width="190" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="390" y="198" fill="#0f172a" font-size="8.5" font-weight="600" text-anchor="middle">Spring Data JPA + Flyway Migrations</text>

      <rect x="295" y="217" width="190" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="390" y="236" fill="#0f172a" font-size="8.5" font-weight="600" text-anchor="middle">EmailService (Resend REST / SMTP)</text>

      <!-- Communication Arrow 2 -->
      <path d="M 500 110 L 545 80" stroke="#3b82f6" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="525" y="87" fill="#2563eb" font-size="7" font-weight="700">HTTPS</text>

      <!-- Communication Arrow 3 -->
      <path d="M 500 180 L 545 200" stroke="#10b981" stroke-width="2" marker-end="url(#arrow-green)"/>
      <text x="525" y="202" fill="#10b981" font-size="7" font-weight="700">JDBC/SSL</text>

      <!-- External Services Tier -->
      <!-- AI Service -->
      <rect x="550" y="30" width="190" height="90" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="550" y="30" width="190" height="26" rx="8" fill="#4338ca"/>
      <text x="645" y="47" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">EXTERNAL AI TIER</text>
      <text x="645" y="74" fill="#1e293b" font-size="8.5" font-weight="600" text-anchor="middle">Google Gemini Flash Lite</text>
      <text x="645" y="88" fill="#64748b" font-size="7.5" text-anchor="middle">Socratic Tutoring & Quiz Synth</text>
      <text x="645" y="104" fill="#4338ca" font-size="8" font-weight="600" text-anchor="middle">gemini-embedding-001 (3072d)</text>

      <!-- Database Tier -->
      <rect x="550" y="150" width="190" height="120" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="550" y="150" width="190" height="26" rx="8" fill="#047857"/>
      <text x="645" y="167" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">PERSISTENCE TIER (Neon)</text>
      <text x="645" y="194" fill="#1e293b" font-size="8.5" font-weight="600" text-anchor="middle">PostgreSQL 16 Serverless</text>
      <text x="645" y="210" fill="#047857" font-size="8" font-weight="600" text-anchor="middle">pgvector Extension (<=> Cosine)</text>
      <text x="645" y="226" fill="#64748b" font-size="7.5" text-anchor="middle">Document Chunks / Embeddings</text>
      <text x="645" y="242" fill="#64748b" font-size="7.5" text-anchor="middle">13 Normalized Tables (V1-V7)</text>
    </svg>
    <div class="diagram-caption">Figure 2.1: End-to-End High-Level System Architecture Diagram</div>
  </div>

  <h3>2.1 Request and Response Flow</h3>
  <ol>
    <li><strong>Client Invocation:</strong> The React application initiates HTTPS REST requests via an Axios client configured with automatic request interceptors that inject the JWT bearer token stored in <code>localStorage</code>.</li>
    <li><strong>Security Filtering:</strong> <code>JwtAuthenticationFilter</code> intercepts incoming traffic, verifies the cryptographic signature (HMAC-SHA256), extracts claims, checks expiration, and populates the Spring <code>SecurityContext</code>.</li>
    <li><strong>Controller & Business Execution:</strong> The target controller validates incoming DTOs using Jakarta Validation (<code>@Valid</code>), delegating business logic to service components wrapped in declarative Spring transactions (<code>@Transactional</code>).</li>
    <li><strong>RAG & Vector Retrieval:</strong> When processing queries, the service layer queries Gemini for a 3072-dimensional vector embedding, executes cosine distance nearest-neighbor queries against <code>document_chunks</code> in PostgreSQL, constructs an augmented prompt, and queries Gemini Flash Lite.</li>
    <li><strong>Unified Response Wrapper:</strong> Responses are wrapped in a uniform <code>ApiResponse&lt;T&gt;</code> envelope guaranteeing consistent payloads across successful outcomes and handled exceptions.</li>
  </ol>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 3: TECHNOLOGY STACK                                      -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf <span>Architecture Documentation</span></div>
    <div class="meta">3. Technology Stack</div>
  </div>

  <h1>3. Technology Stack</h1>
  <p>
    AiProf was built from the ground up using modern enterprise open-source software, prioritizing type safety, stateless scalability, responsive execution, and strict architectural decoupling.
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 22%;">Layer / Domain</th>
        <th style="width: 33%;">Technology / Library</th>
        <th style="width: 45%;">Role & Justification in Implemented Project</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend Framework</strong></td>
        <td>React 19.0 (JavaScript / JSX)</td>
        <td>Declarative component-based UI rendering, context state management, and optimized virtual DOM reconciliations.</td>
      </tr>
      <tr>
        <td><strong>Frontend Bundler</strong></td>
        <td>Vite 8.3 (ESM-based)</td>
        <td>Lightning-fast development HMR, modern production bundling with tree-shaking, achieving sub-500ms production builds.</td>
      </tr>
      <tr>
        <td><strong>UI & Aesthetics</strong></td>
        <td>Vanilla CSS Design System + Lucide React</td>
        <td>Curated dark glassmorphism design system without generic utility classes; smooth gradient cards, responsive continuity grids.</td>
      </tr>
      <tr>
        <td><strong>Data Visualization</strong></td>
        <td>Chart.js 4.4 + react-chartjs-2</td>
        <td>Interactive concept mastery radar charts, horizontal retention bars, and project performance telemetry.</td>
      </tr>
      <tr>
        <td><strong>Client Routing</strong></td>
        <td>React Router 7.2</td>
        <td>Client-side single-page routing with public/private route guards, query-parameter propagation, and dynamic space/project paths.</td>
      </tr>
      <tr>
        <td><strong>Backend Runtime</strong></td>
        <td>Java 21 (Temurin LTS)</td>
        <td>Modern LTS Java features including virtual threads compatibility, pattern matching, record types, and strict type safety.</td>
      </tr>
      <tr>
        <td><strong>Backend Framework</strong></td>
        <td>Spring Boot 3.4.3</td>
        <td>Enterprise standard web application framework offering dependency injection, auto-configuration, and unified actuator telemetry.</td>
      </tr>
      <tr>
        <td><strong>API Security</strong></td>
        <td>Spring Security 6.4 + JJWT 0.12.6</td>
        <td>Stateless authentication filter chain, BCrypt salted hashing, HMAC-SHA256 signed JWT tokens, and refresh token rotation.</td>
      </tr>
      <tr>
        <td><strong>Data Persistence</strong></td>
        <td>Spring Data JPA / Hibernate 6.6</td>
        <td>Object-Relational Mapping (ORM) managing transactional entity lifecycles, cascading deletions, and pagination.</td>
      </tr>
      <tr>
        <td><strong>Database Engine</strong></td>
        <td>PostgreSQL 16 (Neon Serverless)</td>
        <td>ACID-compliant relational database with connection pooling (HikariCP) and scalable serverless compute allocation.</td>
      </tr>
      <tr>
        <td><strong>Vector Extension</strong></td>
        <td>pgvector (0.7.4) + pgvector-java</td>
        <td>Native vector storage in PostgreSQL; calculates exact cosine distance (<code>&lt;=&gt;</code>) over 3072-dimensional embeddings.</td>
      </tr>
      <tr>
        <td><strong>Database Migrations</strong></td>
        <td>Flyway 10.20</td>
        <td>Version-controlled schema evolution managing migrations <code>V1</code> through <code>V7</code> with checksum tracking.</td>
      </tr>
      <tr>
        <td><strong>LLM & Embeddings</strong></td>
        <td>Google Gemini Flash Lite & gemini-embedding-001</td>
        <td>State-of-the-art fast inference LLM for Socratic tutoring and quiz generation, paired with high-dimensional 3072d vector embeddings.</td>
      </tr>
      <tr>
        <td><strong>Document Parser</strong></td>
        <td>Apache Tika 2.9.2</td>
        <td>Multi-format file ingestion parsing PDF, DOCX, TXT, and Markdown files into raw, structured semantic text.</td>
      </tr>
      <tr>
        <td><strong>Email Dispatch</strong></td>
        <td>Resend REST API + JavaMailSender (SMTP)</td>
        <td>Dual email dispatch: primary transmission via Resend HTTPS REST API (port 443) with seamless fallback to Gmail SMTP (port 587).</td>
      </tr>
      <tr>
        <td><strong>Containerization</strong></td>
        <td>Docker (Multi-stage Eclipse Temurin 21 JRE)</td>
        <td>Repeatable Linux container packaging with minimal JRE runtime image footprint and isolated non-root execution.</td>
      </tr>
      <tr>
        <td><strong>Hosting Platform</strong></td>
        <td>Vercel (Frontend) & Render (Backend)</td>
        <td>Edge CDN static asset distribution paired with automated containerized web service execution.</td>
      </tr>
    </tbody>
  </table>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 4: FRONTEND ARCHITECTURE                                 -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf <span>Architecture Documentation</span></div>
    <div class="meta">4. Frontend Architecture</div>
  </div>

  <h1>4. Frontend Architecture</h1>

  <h3>4.1 Project Organization</h3>
  <pre>
frontend/src/
├── api.js                   # Central Axios client with JWT interceptors & endpoint factories
├── App.jsx                  # Main router config, route guards (PrivateRoute / PublicRoute)
├── main.jsx                 # React root bootstrap & global Toaster injection
├── index.css                # Global CSS design tokens, reset, gradients, glassmorphism
├── context/
│   └── AuthContext.jsx      # Authentication context provider (login, register, Google, verify)
├── components/
│   ├── DashboardLayout.jsx  # Primary shell with sidebar navigation, active links, user card
│   ├── GoogleSignInButton.jsx # Google Identity Services (GIS) wrapper with fallback client ID
│   └── Modal.jsx            # Accessible reusable modal dialog component
└── pages/
    ├── DashboardPage.jsx    # Learning continuity overview & Targeted Mastery recommendation
    ├── SpacesPage.jsx       # Dedicated space catalog & creation modal (/spaces)
    ├── SpacePage.jsx        # Single space view displaying child projects
    ├── ProjectPage.jsx      # Project overview displaying documents, tutor links, quizzes
    ├── MaterialsPage.jsx    # Document upload dropzone & ingestion status monitoring
    ├── TutorPage.jsx        # Socratic conversational interface with grounded citations
    ├── QuizPage.jsx         # Adaptive quiz runner, question timers, scoring breakdown
    ├── AnalyticsPage.jsx    # Concept mastery charts, weak concept diagnosis, telemetry
    ├── AdminPage.jsx        # System telemetry, user management, background job status
    ├── LoginPage.jsx        # Dual login portal (Google OAuth + Email/Password)
    ├── RegisterPage.jsx     # Registration form dispatching email OTP verification
    └── OtpVerifyPage.jsx    # 6-digit OTP verification page with auto-fill & email edit
  </pre>

  <h3>4.2 Routing & Route Guards</h3>
  <p>
    Routing is handled by <code>react-router-dom</code> with strict layout nesting and route protection wrappers:
  </p>
  <ul>
    <li><strong><code>&lt;PublicRoute&gt;</code>:</strong> Protects authentication routes (<code>/login</code>, <code>/register</code>, <code>/verify-otp</code>). If an authenticated user session exists, redirects immediately to <code>/dashboard</code>.</li>
    <li><strong><code>&lt;PrivateRoute&gt;</code>:</strong> Enforces that an active JWT token exists in <code>localStorage</code> and that the user's email is verified. If unauthenticated, saves redirect state and routes to <code>/login</code>.</li>
    <li><strong><code>&lt;AdminRoute&gt;</code>:</strong> Inspects <code>user.role === 'ADMIN'</code>. Non-admin users are rejected and redirected to <code>/dashboard</code> with an unauthorized toast notification.</li>
  </ul>

  <h3>4.3 Authentication Flow & State Management</h3>
  <p>
    State is managed centrally via <code>AuthContext.jsx</code>. On application bootstrap, the context executes <code>fetchMe()</code> by querying <code>GET /api/auth/me</code> using the stored token. If valid, the user state is populated; if expired or revoked, tokens are pruned and the user is routed to the login view.
  </p>

  <h3>4.4 API Client Communication & Interceptors</h3>
  <p>
    The Axios client in <code>api.js</code> defines a standard base URL (configured dynamically via <code>VITE_API_URL</code>) and attaches two crucial interceptors:
  </p>
  <ul>
    <li><strong>Request Interceptor:</strong> Automatically checks <code>localStorage.getItem('token')</code> and injects <code>Authorization: Bearer &lt;token&gt;</code> into every outgoing request.</li>
    <li><strong>Response Interceptor (Token Refresh):</strong> Detects <code>401 Unauthorized</code> errors. If an error is encountered on an authenticated endpoint (excluding auth verification endpoints), it attempts a silent token refresh via <code>POST /api/auth/refresh</code> using <code>localStorage.getItem('refreshToken')</code>. If successful, it replays the original request; otherwise, it logs out the user cleanly.</li>
  </ul>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 5: BACKEND ARCHITECTURE                                  -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf <span>Architecture Documentation</span></div>
    <div class="meta">5. Backend Architecture</div>
  </div>

  <h1>5. Backend Architecture</h1>
  <p>
    The backend is structured according to domain-driven, layered enterprise Spring Boot conventions. Each layer maintains a strict boundary of responsibility to ensure modularity, maintainability, and testability.
  </p>

  <div class="diagram-container avoid-break">
    <svg viewBox="0 0 740 250" width="740" height="250" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow2" x="-4%" y="-4%" width="108%" height="112%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.08"/>
        </filter>
        <marker id="arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569"/>
        </marker>
      </defs>

      <!-- Security Filter -->
      <rect x="20" y="20" width="130" height="210" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow2)"/>
      <rect x="20" y="20" width="130" height="26" rx="6" fill="#334155"/>
      <text x="85" y="37" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">SECURITY LAYER</text>
      <text x="85" y="65" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">CorsFilter</text>
      <text x="85" y="90" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">JwtAuthFilter</text>
      <text x="85" y="115" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">JwtUtil (HMAC-SHA256)</text>
      <text x="85" y="140" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">SecurityConfig</text>
      <text x="85" y="165" fill="#64748b" font-size="7.5" text-anchor="middle">Principal Extraction</text>
      <text x="85" y="195" fill="#2563eb" font-size="7.5" font-weight="600" text-anchor="middle">RBAC (USER / ADMIN)</text>

      <path d="M 150 125 L 175 125" stroke="#475569" stroke-width="1.5" marker-end="url(#arr)"/>

      <!-- Controller Layer -->
      <rect x="180" y="20" width="125" height="210" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow2)"/>
      <rect x="180" y="20" width="125" height="26" rx="6" fill="#2563eb"/>
      <text x="242" y="37" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">CONTROLLERS</text>
      <text x="242" y="65" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">AuthController</text>
      <text x="242" y="90" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">SpaceController</text>
      <text x="242" y="115" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">ProjectController</text>
      <text x="242" y="140" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">MaterialController</text>
      <text x="242" y="165" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">TutorController</text>
      <text x="242" y="190" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">Quiz / Admin</text>
      <text x="242" y="215" fill="#64748b" font-size="7" text-anchor="middle">@Valid DTO Ingestion</text>

      <path d="M 305 125 L 330 125" stroke="#475569" stroke-width="1.5" marker-end="url(#arr)"/>

      <!-- Service Layer -->
      <rect x="335" y="20" width="135" height="210" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow2)"/>
      <rect x="335" y="20" width="135" height="26" rx="6" fill="#4f46e5"/>
      <text x="402" y="37" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">SERVICES (Logic)</text>
      <text x="402" y="65" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">AuthService (OTP/Google)</text>
      <text x="402" y="90" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">RagService (Chunking)</text>
      <text x="402" y="115" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">TutorService (Socratic)</text>
      <text x="402" y="140" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">QuizService (Adaptive)</text>
      <text x="402" y="165" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">MasteryService (Gap)</text>
      <text x="402" y="190" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">EmailService (Resend)</text>
      <text x="402" y="215" fill="#64748b" font-size="7" text-anchor="middle">@Transactional Scope</text>

      <path d="M 470 125 L 495 125" stroke="#475569" stroke-width="1.5" marker-end="url(#arr)"/>

      <!-- Repository Layer -->
      <rect x="500" y="20" width="115" height="210" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow2)"/>
      <rect x="500" y="20" width="115" height="26" rx="6" fill="#0d9488"/>
      <text x="557" y="37" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">REPOSITORIES</text>
      <text x="557" y="65" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">UserRepository</text>
      <text x="557" y="90" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">SpaceRepository</text>
      <text x="557" y="115" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">ProjectRepository</text>
      <text x="557" y="140" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">MaterialRepository</text>
      <text x="557" y="165" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">ChunkRepository</text>
      <text x="557" y="190" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">QuizRepository</text>
      <text x="557" y="215" fill="#0d9488" font-size="7" font-weight="600" text-anchor="middle">Native Vector Queries</text>

      <path d="M 615 125 L 635 125" stroke="#475569" stroke-width="1.5" marker-end="url(#arr)"/>

      <!-- Data Store / Flyway -->
      <rect x="640" y="20" width="85" height="210" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow2)"/>
      <rect x="640" y="20" width="85" height="26" rx="6" fill="#059669"/>
      <text x="682" y="37" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">DATABASE</text>
      <text x="682" y="70" fill="#0f172a" font-size="7.5" font-weight="600" text-anchor="middle">PostgreSQL</text>
      <text x="682" y="90" fill="#059669" font-size="7.5" font-weight="600" text-anchor="middle">pgvector</text>
      <text x="682" y="120" fill="#64748b" font-size="7.5" text-anchor="middle">Flyway</text>
      <text x="682" y="135" fill="#64748b" font-size="7.5" text-anchor="middle">V1 - V7</text>
      <text x="682" y="170" fill="#0f172a" font-size="7.5" font-weight="600" text-anchor="middle">HikariCP</text>
      <text x="682" y="185" fill="#64748b" font-size="7" text-anchor="middle">Pool = 10</text>
    </svg>
    <div class="diagram-caption">Figure 5.1: Layered Spring Boot Backend Architecture & Ingestion Flow</div>
  </div>

  <h3>5.1 Validation & Exception Handling Framework</h3>
  <ul>
    <li><strong>DTO Validation:</strong> Incoming payloads are validated via Jakarta Validation annotations (<code>@NotBlank</code>, <code>@Email</code>, <code>@Size</code>, <code>@NotNull</code>). If validation fails, <code>MethodArgumentNotValidException</code> is caught.</li>
    <li><strong>Global Exception Handling:</strong> <code>GlobalExceptionHandler.java</code> acts as an application-wide controller advice (<code>@RestControllerAdvice</code>), mapping exceptions into uniform <code>ApiResponse&lt;T&gt;</code> objects:
      <ul>
        <li><code>AppException</code> &rarr; Custom domain exceptions carrying HTTP status codes and domain error tags (e.g., <code>NO_MATERIALS</code>, <code>INVALID_OTP</code>).</li>
        <li><code>BadCredentialsException</code> &rarr; Returns <code>401 Unauthorized</code> with <code>INVALID_CREDENTIALS</code>.</li>
        <li><code>AccessDeniedException</code> &rarr; Returns <code>403 Forbidden</code> for unauthorized role operations.</li>
        <li>Generic fallback &rarr; Catches unhandled exceptions, logs full stack traces internally, and returns sanitized <code>500 Internal Server Error</code> without exposing internal database structures.</li>
      </ul>
    </li>
  </ul>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 6: DATABASE ARCHITECTURE                                 -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf <span>Architecture Documentation</span></div>
    <div class="meta">6. Database Architecture & ER Diagram</div>
  </div>

  <h1>6. Database Architecture</h1>
  <p>
    The persistence layer is implemented in PostgreSQL 16 utilizing the <code>pgvector</code> extension for high-performance vector search. The schema consists of 13 normalized tables configured with strict foreign key constraints and <code>ON DELETE CASCADE</code> rules to maintain referential integrity.
  </p>

  <div class="diagram-container avoid-break">
    <svg viewBox="0 0 740 320" width="740" height="320" xmlns="http://www.w3.org/2000/svg">
      <!-- Entity Box: USERS -->
      <rect x="20" y="20" width="150" height="110" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
      <rect x="20" y="20" width="150" height="22" rx="4" fill="#1e293b"/>
      <text x="95" y="35" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">USERS</text>
      <text x="26" y="55" font-size="7.5" font-family="monospace">PK  id: UUID</text>
      <text x="26" y="68" font-size="7.5" font-family="monospace">    email: VARCHAR(255)</text>
      <text x="26" y="81" font-size="7.5" font-family="monospace">    password_hash: VARCHAR</text>
      <text x="26" y="94" font-size="7.5" font-family="monospace">    role: VARCHAR(50)</text>
      <text x="26" y="107" font-size="7.5" font-family="monospace">    email_verified: BOOL</text>
      <text x="26" y="120" font-size="7.5" font-family="monospace">    otp_code: VARCHAR(10)</text>

      <!-- Entity Box: REFRESH_TOKENS -->
      <rect x="20" y="160" width="150" height="70" rx="4" fill="#ffffff" stroke="#64748b" stroke-width="1"/>
      <rect x="20" y="160" width="150" height="20" rx="4" fill="#475569"/>
      <text x="95" y="174" fill="#ffffff" font-size="8" font-weight="700" text-anchor="middle">REFRESH_TOKENS</text>
      <text x="26" y="192" font-size="7.5" font-family="monospace">PK  id: UUID</text>
      <text x="26" y="205" font-size="7.5" font-family="monospace">FK  user_id: UUID</text>
      <text x="26" y="218" font-size="7.5" font-family="monospace">    token: VARCHAR(255)</text>

      <!-- Entity Box: SPACES -->
      <rect x="210" y="20" width="145" height="90" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
      <rect x="210" y="20" width="145" height="22" rx="4" fill="#1e293b"/>
      <text x="282" y="35" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">SPACES</text>
      <text x="216" y="55" font-size="7.5" font-family="monospace">PK  id: UUID</text>
      <text x="216" y="68" font-size="7.5" font-family="monospace">FK  user_id: UUID</text>
      <text x="216" y="81" font-size="7.5" font-family="monospace">    name: VARCHAR(255)</text>
      <text x="216" y="94" font-size="7.5" font-family="monospace">    color: VARCHAR(50)</text>

      <!-- Entity Box: PROJECTS -->
      <rect x="390" y="20" width="155" height="90" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
      <rect x="390" y="20" width="155" height="22" rx="4" fill="#1e293b"/>
      <text x="467" y="35" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">PROJECTS</text>
      <text x="396" y="55" font-size="7.5" font-family="monospace">PK  id: UUID</text>
      <text x="396" y="68" font-size="7.5" font-family="monospace">FK  space_id: UUID</text>
      <text x="396" y="81" font-size="7.5" font-family="monospace">    name: VARCHAR(255)</text>
      <text x="396" y="94" font-size="7.5" font-family="monospace">    target_mastery: INT</text>

      <!-- Entity Box: MATERIALS -->
      <rect x="580" y="20" width="145" height="95" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
      <rect x="580" y="20" width="145" height="22" rx="4" fill="#1e293b"/>
      <text x="652" y="35" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">MATERIALS</text>
      <text x="586" y="55" font-size="7.5" font-family="monospace">PK  id: UUID</text>
      <text x="586" y="68" font-size="7.5" font-family="monospace">FK  project_id: UUID</text>
      <text x="586" y="81" font-size="7.5" font-family="monospace">    file_name: VARCHAR</text>
      <text x="586" y="94" font-size="7.5" font-family="monospace">    status: VARCHAR(50)</text>
      <text x="586" y="107" font-size="7.5" font-family="monospace">    storage_path: TEXT</text>

      <!-- Entity Box: DOCUMENT_CHUNKS -->
      <rect x="580" y="150" width="145" height="95" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
      <rect x="580" y="150" width="145" height="22" rx="4" fill="#0284c7"/>
      <text x="652" y="165" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">DOCUMENT_CHUNKS</text>
      <text x="586" y="185" font-size="7.5" font-family="monospace">PK  id: UUID</text>
      <text x="586" y="198" font-size="7.5" font-family="monospace">FK  material_id: UUID</text>
      <text x="586" y="211" font-size="7.5" font-family="monospace">    chunk_index: INT</text>
      <text x="586" y="224" font-size="7.5" font-family="monospace">    content: TEXT</text>
      <text x="586" y="237" font-size="7.5" font-family="monospace" fill="#0284c7" font-weight="700">    embedding: VECTOR(3072)</text>

      <!-- Entity Box: QUIZZES -->
      <rect x="390" y="145" width="155" height="75" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
      <rect x="390" y="145" width="155" height="20" rx="4" fill="#1e293b"/>
      <text x="467" y="159" fill="#ffffff" font-size="8" font-weight="700" text-anchor="middle">QUIZZES</text>
      <text x="396" y="177" font-size="7.5" font-family="monospace">PK  id: UUID</text>
      <text x="396" y="190" font-size="7.5" font-family="monospace">FK  project_id: UUID</text>
      <text x="396" y="203" font-size="7.5" font-family="monospace">    total_questions: INT</text>

      <!-- Entity Box: CONCEPT_MASTERY -->
      <rect x="210" y="145" width="145" height="95" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
      <rect x="210" y="145" width="145" height="20" rx="4" fill="#1e293b"/>
      <text x="282" y="159" fill="#ffffff" font-size="8" font-weight="700" text-anchor="middle">CONCEPT_MASTERY</text>
      <text x="216" y="177" font-size="7.5" font-family="monospace">PK  id: UUID</text>
      <text x="216" y="190" font-size="7.5" font-family="monospace">FK  project_id: UUID</text>
      <text x="216" y="203" font-size="7.5" font-family="monospace">FK  user_id: UUID</text>
      <text x="216" y="216" font-size="7.5" font-family="monospace">    concept_name: VARCHAR</text>
      <text x="216" y="229" font-size="7.5" font-family="monospace">    mastery_score: DOUBLE</text>

      <!-- Relationships -->
      <!-- Users -> Spaces -->
      <line x1="170" y1="50" x2="210" y2="50" stroke="#0f172a" stroke-width="1.5"/>
      <text x="187" y="44" font-size="7" font-weight="700">1:N</text>

      <!-- Users -> Refresh Tokens -->
      <line x1="95" y1="130" x2="95" y2="160" stroke="#64748b" stroke-width="1.2"/>

      <!-- Spaces -> Projects -->
      <line x1="355" y1="50" x2="390" y2="50" stroke="#0f172a" stroke-width="1.5"/>
      <text x="368" y="44" font-size="7" font-weight="700">1:N</text>

      <!-- Projects -> Materials -->
      <line x1="545" y1="50" x2="580" y2="50" stroke="#0f172a" stroke-width="1.5"/>
      <text x="558" y="44" font-size="7" font-weight="700">1:N</text>

      <!-- Materials -> Document Chunks -->
      <line x1="652" y1="115" x2="652" y2="150" stroke="#0284c7" stroke-width="1.5"/>
      <text x="656" y="135" font-size="7" font-weight="700" fill="#0284c7">1:N</text>

      <!-- Projects -> Quizzes -->
      <line x1="467" y1="110" x2="467" y2="145" stroke="#0f172a" stroke-width="1.5"/>
      <text x="472" y="130" font-size="7" font-weight="700">1:N</text>

      <!-- Projects -> Concept Mastery -->
      <line x1="390" y1="80" x2="355" y2="170" stroke="#0f172a" stroke-width="1.2"/>
    </svg>
    <div class="diagram-caption">Figure 6.1: Core Entity-Relationship Diagram (ERD) with pgvector Embedding Association</div>
  </div>

  <h3>6.1 Flyway Versioned Migration Pipeline</h3>
  <p>
    The schema is tracked under <code>backend/src/main/resources/db/migration/</code> and executed sequentially on startup:
  </p>
  <ul>
    <li><code>V1__init_extensions.sql</code>: Activates PostgreSQL <code>vector</code> and <code>uuid-ossp</code> extensions.</li>
    <li><code>V2__core_entities.sql</code>: Establishes base <code>users</code>, <code>spaces</code>, and <code>projects</code> tables with indexing.</li>
    <li><code>V3__materials_and_jobs.sql</code>: Defines <code>materials</code> and <code>document_chunks</code> with <code>VECTOR(3072)</code> column.</li>
    <li><code>V4__learning_entities.sql</code>: Sets up <code>concept_mastery</code>, <code>quizzes</code>, <code>quiz_questions</code>, <code>quiz_attempts</code>, <code>conversations</code>, and <code>chat_messages</code>.</li>
    <li><code>V5__schema_alignment.sql</code>: Applies foreign key cascade rules and indexes across high-traffic lookup paths.</li>
    <li><code>V6__refresh_tokens.sql</code>: Introduces persistent refresh tokens for cryptographic session management.</li>
    <li><code>V7__email_verification_otp.sql</code>: Adds <code>email_verified</code>, <code>otp_code</code>, and <code>otp_expires_at</code> to enforce verification gates.</li>
  </ul>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 7: AI ARCHITECTURE                                       -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf <span>Architecture Documentation</span></div>
    <div class="meta">7. AI Architecture & RAG Pipeline</div>
  </div>

  <h1>7. AI Architecture</h1>
  <p>
    The AI architecture consists of a two-phase pipeline: an <strong>Offline Asynchronous Document Ingestion Pipeline</strong> that extracts, segments, and embeds course knowledge, and an <strong>Online Socratic Inference Pipeline</strong> that retrieves context-relevant chunks and prompts Google Gemini.
  </p>

  <div class="diagram-container avoid-break">
    <svg viewBox="0 0 740 270" width="740" height="270" xmlns="http://www.w3.org/2000/svg">
      <!-- Ingestion Pipeline -->
      <rect x="20" y="20" width="700" height="100" rx="6" fill="#f8fafc" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="35" y="40" fill="#1e40af" font-size="9" font-weight="700">PHASE A: ASYNCHRONOUS DOCUMENT INGESTION PIPELINE</text>

      <rect x="35" y="55" width="90" height="50" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="80" y="77" font-size="7.5" font-weight="600" text-anchor="middle">PDF / DOCX / TXT</text>
      <text x="80" y="92" font-size="6.5" fill="#64748b" text-anchor="middle">Multi-file upload</text>

      <line x1="125" y1="80" x2="155" y2="80" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrow)"/>

      <rect x="155" y="55" width="110" height="50" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="210" y="77" font-size="7.5" font-weight="600" text-anchor="middle">Apache Tika</text>
      <text x="210" y="92" font-size="6.5" fill="#64748b" text-anchor="middle">Text extraction</text>

      <line x1="265" y1="80" x2="295" y2="80" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrow)"/>

      <rect x="295" y="55" width="120" height="50" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="355" y="74" font-size="7.5" font-weight="600" text-anchor="middle">Semantic Chunking</text>
      <text x="355" y="87" font-size="6.5" fill="#64748b" text-anchor="middle">400 tokens / chunk</text>
      <text x="355" y="98" font-size="6.5" fill="#64748b" text-anchor="middle">50 token overlap</text>

      <line x1="415" y1="80" x2="445" y2="80" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrow)"/>

      <rect x="445" y="55" width="130" height="50" rx="4" fill="#ffffff" stroke="#4338ca"/>
      <text x="510" y="74" font-size="7.5" font-weight="700" fill="#4338ca" text-anchor="middle">Gemini Embeddings</text>
      <text x="510" y="87" font-size="6.5" fill="#64748b" text-anchor="middle">gemini-embedding-001</text>
      <text x="510" y="98" font-size="6.5" fill="#64748b" text-anchor="middle">Outputs 3072 dimensions</text>

      <line x1="575" y1="80" x2="605" y2="80" stroke="#3b82f6" stroke-width="1.5" marker-end="url(#arrow)"/>

      <rect x="605" y="55" width="100" height="50" rx="4" fill="#ffffff" stroke="#047857"/>
      <text x="655" y="77" font-size="7.5" font-weight="700" fill="#047857" text-anchor="middle">pgvector Table</text>
      <text x="655" y="92" font-size="6.5" fill="#64748b" text-anchor="middle">Persist & Index</text>

      <!-- Online Retrieval Pipeline -->
      <rect x="20" y="140" width="700" height="115" rx="6" fill="#f8fafc" stroke="#10b981" stroke-width="1.5"/>
      <text x="35" y="160" fill="#065f46" font-size="9" font-weight="700">PHASE B: ONLINE SOCRATIC INFERENCE & CITATION PIPELINE</text>

      <rect x="35" y="175" width="90" height="60" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="80" y="198" font-size="7.5" font-weight="600" text-anchor="middle">User Question</text>
      <text x="80" y="212" font-size="6.5" fill="#64748b" text-anchor="middle">"Explain Mitosis"</text>
      <text x="80" y="224" font-size="6.5" fill="#2563eb" text-anchor="middle">Tutor Chat UI</text>

      <line x1="125" y1="205" x2="155" y2="205" stroke="#10b981" stroke-width="1.5" marker-end="url(#arrow-green)"/>

      <rect x="155" y="175" width="110" height="60" rx="4" fill="#ffffff" stroke="#4338ca"/>
      <text x="210" y="198" font-size="7.5" font-weight="700" fill="#4338ca" text-anchor="middle">Embed Query</text>
      <text x="210" y="212" font-size="6.5" fill="#64748b" text-anchor="middle">gemini-embedding-001</text>
      <text x="210" y="224" font-size="6.5" fill="#64748b" text-anchor="middle">Vector Q: 3072d</text>

      <line x1="265" y1="205" x2="295" y2="205" stroke="#10b981" stroke-width="1.5" marker-end="url(#arrow-green)"/>

      <rect x="295" y="175" width="120" height="60" rx="4" fill="#ffffff" stroke="#047857"/>
      <text x="355" y="196" font-size="7.5" font-weight="700" fill="#047857" text-anchor="middle">Cosine Similarity</text>
      <text x="355" y="209" font-size="6.5" fill="#64748b" text-anchor="middle">ORDER BY emb <=> Q</text>
      <text x="355" y="222" font-size="6.5" fill="#047857" font-weight="600" text-anchor="middle">Top K = 6 Chunks</text>

      <line x1="415" y1="205" x2="445" y2="205" stroke="#10b981" stroke-width="1.5" marker-end="url(#arrow-green)"/>

      <rect x="445" y="175" width="130" height="60" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="510" y="196" font-size="7.5" font-weight="600" text-anchor="middle">Prompt Augmentation</text>
      <text x="510" y="209" font-size="6.5" fill="#64748b" text-anchor="middle">Inject Context Chunks</text>
      <text x="510" y="222" font-size="6.5" fill="#64748b" text-anchor="middle">+ Socratic System Prompt</text>

      <line x1="575" y1="205" x2="605" y2="205" stroke="#10b981" stroke-width="1.5" marker-end="url(#arrow-green)"/>

      <rect x="605" y="175" width="100" height="60" rx="4" fill="#ffffff" stroke="#4338ca"/>
      <text x="655" y="196" font-size="7.5" font-weight="700" fill="#4338ca" text-anchor="middle">Gemini Flash Lite</text>
      <text x="655" y="209" font-size="6.5" fill="#64748b" text-anchor="middle">Socratic Response</text>
      <text x="655" y="222" font-size="6.5" fill="#2563eb" font-weight="600" text-anchor="middle">+ [Citations]</text>
    </svg>
    <div class="diagram-caption">Figure 7.1: Retrieval-Augmented Generation (RAG) Ingestion & Socratic Inference Workflow</div>
  </div>

  <h3>7.1 Detailed AI Components</h3>
  <ul>
    <li><strong>Model Selection:</strong> The system utilizes Google's <code>gemini-flash-lite-latest</code> model for high-throughput, low-latency reasoning and <code>gemini-embedding-001</code> generating 3072-dimensional normalized vectors.</li>
    <li><strong>Chunking Strategy:</strong> The document ingestion engine partitions extracted plain text into overlapping sliding windows (400 tokens per chunk with 50-token overlap). Overlap preserves conceptual continuity across sentence boundaries.</li>
    <li><strong>Socratic System Guardrails:</strong> The prompt architecture strictly prohibits direct, non-interactive answers. The model is instructed:
      <pre>You are an expert academic tutor. You MUST adopt a Socratic pedagogical approach:
1. Guide the student using questions and hints based strictly on the provided context excerpts.
2. Never provide direct answers to homework or conceptual questions without assessing their prior understanding.
3. Every factual assertion must be attributed to an excerpt chunk: [Citation: filename (chunk #)].
4. If the provided context does not contain the answer, explicitly state that the course materials do not cover this topic.</pre>
    </li>
    <li><strong>Citation Parsing:</strong> The backend inspects the generated text, extracts citation brackets, cross-references chunk identifiers against <code>document_chunks</code>, and serializes citation metadata alongside the response payload.</li>
  </ul>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 8: AUTHENTICATION & SECURITY                             -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf <span>Architecture Documentation</span></div>
    <div class="meta">8. Authentication & Security Architecture</div>
  </div>

  <h1>8. Authentication & Security</h1>

  <h3>8.1 Dual Authentication Implementation</h3>
  <p>
    AiProf supports both Google Single Sign-On and email-based registration, ensuring maximum user convenience without compromising verification rigor:
  </p>
  <ul>
    <li><strong>Google OAuth 2.0 (GSI):</strong>
      <ol>
        <li>The client renders the official Google Identity Services button using <code>GoogleSignInButton.jsx</code>.</li>
        <li>Upon authorization, Google returns a cryptographically signed JWT ID Token directly to the client.</li>
        <li>The client dispatches the token to <code>POST /api/auth/google</code>.</li>
        <li>The backend validates the token via Google's tokeninfo API (<code>https://oauth2.googleapis.com/tokeninfo?id_token=...</code>), confirming signature, audience, and email verification.</li>
        <li>If valid, the user record is auto-provisioned or updated with <code>email_verified = true</code>, and a JWT session is returned.</li>
      </ol>
    </li>
    <li><strong>Email + Password with Mandatory OTP:</strong>
      <ol>
        <li>User registers via <code>POST /api/auth/register</code> with password hashed via <code>BCryptPasswordEncoder</code> (strength 10).</li>
        <li>Backend generates a secure random 6-digit OTP stored with a 10-minute expiry (<code>Instant.now().plus(10, ChronoUnit.MINUTES)</code>).</li>
        <li>The OTP is dispatched asynchronously via <code>EmailService</code>.</li>
        <li>The user submits the code to <code>POST /api/auth/verify-otp</code>, which marks <code>email_verified = true</code> and clears the OTP fields.</li>
      </ol>
    </li>
  </ul>

  <h3>8.2 Resilient Multi-Channel Email Architecture</h3>
  <p>
    Cloud hosting platforms (notably Render's Free tier) enforce firewall blocks on raw outbound SMTP ports (25, 465, and 587) to prevent spam abuse. To guarantee 100% email delivery resilience:
  </p>
  <ul>
    <li><strong>Primary Transport (Resend HTTP REST API):</strong> Operates over standard HTTPS port 443 (which is never blocked by cloud firewalls). When <code>RESEND_API_KEY</code> is configured, <code>EmailService</code> issues asynchronous HTTPS POST calls to <code>https://api.resend.com/emails</code>.</li>
    <li><strong>Secondary Transport (Gmail SMTP):</strong> If the Resend API key is absent, falls back to standard Spring <code>JavaMailSender</code> over port 587 with STARTTLS encryption.</li>
    <li><strong>Development / Staging Unblock Fallback:</strong> If an evaluator tests in an environment where outbound email credentials are not set, the registration and unverified-login responses return a <code>previewOtp</code> field. The frontend detects this and provides a <em>"⚡ Code: [123456] (Click to auto-fill)"</em> helper, preventing blocked testing sessions.</li>
  </ul>

  <h3>8.3 Security & Hardening Controls</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Security Dimension</th>
        <th style="width: 75%;">Implemented Control & Hardening Strategy</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Stateless JWT Tokens</strong></td>
        <td>HMAC-SHA256 signature verification using an externally injected 256-bit secret key; expiration strictly validated on every request.</td>
      </tr>
      <tr>
        <td><strong>CORS Enforcement</strong></td>
        <td>Configured in <code>SecurityConfig.java</code>; explicitly permits only trusted origins (local development and production Vercel domains).</td>
      </tr>
      <tr>
        <td><strong>Password Hashing</strong></td>
        <td>BCrypt adaptive work factor algorithm with random per-user salt; raw passwords are never logged or persisted.</td>
      </tr>
      <tr>
        <td><strong>Admin RBAC Guard</strong></td>
        <td>Admin telemetry endpoints (<code>/api/admin/**</code>) guarded with <code>@PreAuthorize("hasRole('ADMIN')")</code> and dedicated frontend route guards.</td>
      </tr>
      <tr>
        <td><strong>Zero Secret Leakage</strong></td>
        <td>All credentials, API keys, database connection strings, and JWT secrets are supplied exclusively via environment variables; <code>application.yml</code> contains zero raw credentials.</td>
      </tr>
    </tbody>
  </table>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 9: API ARCHITECTURE                                      -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf <span>Architecture Documentation</span></div>
    <div class="meta">9. API Architecture & REST Specifications</div>
  </div>

  <h1>9. API Architecture</h1>
  <p>
    The REST API follows strict RESTful conventions under the <code>/api</code> namespace. Every endpoint returns payloads enclosed within a standard <code>ApiResponse&lt;T&gt;</code> envelope containing <code>success: boolean</code>, <code>message: string</code>, <code>data: T</code>, and <code>errorCode: string</code>.
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 10%;">Method</th>
        <th style="width: 28%;">Endpoint Path</th>
        <th style="width: 44%;">Purpose & Processing Logic</th>
        <th style="width: 18%;">Auth Required</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/auth/register</code></td>
        <td>Registers user, hashes password, saves unverified user, generates and dispatches 6-digit OTP code.</td>
        <td>None (Public)</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/auth/verify-otp</code></td>
        <td>Validates 6-digit OTP against expiration time; activates account (<code>email_verified=true</code>); issues JWT.</td>
        <td>None (Public)</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/auth/resend-otp</code></td>
        <td>Enforces 30s rate limit; generates fresh OTP; dispatches via Resend/SMTP; returns preview code.</td>
        <td>None (Public)</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/auth/login</code></td>
        <td>Validates credentials via BCrypt; checks <code>email_verified</code>; returns JWT access + refresh tokens.</td>
        <td>None (Public)</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/auth/google</code></td>
        <td>Verifies Google OAuth2 ID token; provisions or signs in user; marks verified; returns JWT.</td>
        <td>None (Public)</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/auth/refresh</code></td>
        <td>Validates persistent refresh token; checks revocation status; rotates and issues new JWT.</td>
        <td>None (Public)</td>
      </tr>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/api/auth/me</code></td>
        <td>Retrieves authenticated user profile (name, email, role, avatar, verification status).</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/api/spaces</code></td>
        <td>Returns all academic learning spaces owned by the authenticated student.</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/spaces</code></td>
        <td>Creates a new learning space with custom name, description, and color tag.</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-del">DELETE</span></td>
        <td><code>/api/spaces/{id}</code></td>
        <td>Deletes learning space and cascades deletion to child projects, materials, and vector chunks.</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/api/spaces/{spaceId}/projects</code></td>
        <td>Returns all course projects contained within the specified space.</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/spaces/{spaceId}/projects</code></td>
        <td>Creates project container with specified target mastery score (default 80%).</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/projects/{id}/materials/upload</code></td>
        <td>Ingests document (PDF/DOCX/TXT/MD), triggers Apache Tika extraction, chunking, and embedding.</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/projects/{id}/tutor/chat</code></td>
        <td>Executes Socratic query against vector index; prompts Gemini Flash; returns dialogue with citations.</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/projects/{id}/quizzes/generate</code></td>
        <td>Validates document presence; generates multi-format diagnostic quiz from grounded chunks.</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-post">POST</span></td>
        <td><code>/api/quizzes/{id}/submit</code></td>
        <td>Scores quiz answers, saves attempt metrics, updates concept mastery percentages in database.</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/api/analytics/overview</code></td>
        <td>Aggregates mastery statistics, recent project continuity, weak concepts, and next action card.</td>
        <td>Bearer JWT</td>
      </tr>
      <tr>
        <td><span class="badge badge-get">GET</span></td>
        <td><code>/api/admin/overview</code></td>
        <td>Provides system telemetry: active users, processing job queues, and LLM token expenditures.</td>
        <td>Role: ADMIN</td>
      </tr>
    </tbody>
  </table>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 10: DEPLOYMENT ARCHITECTURE                              -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf <span>Architecture Documentation</span></div>
    <div class="meta">10. Deployment Architecture & Production Setup</div>
  </div>

  <h1>10. Deployment Architecture</h1>
  <p>
    The production environment utilizes fully managed cloud infrastructure providing continuous deployment, automated TLS certificate provisioning, and containerized runtime isolation.
  </p>

  <div class="diagram-container avoid-break">
    <svg viewBox="0 0 740 220" width="740" height="220" xmlns="http://www.w3.org/2000/svg">
      <!-- Vercel Edge -->
      <rect x="20" y="30" width="200" height="160" rx="8" fill="#ffffff" stroke="#000000" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="20" y="30" width="200" height="28" rx="8" fill="#000000"/>
      <text x="120" y="49" fill="#ffffff" font-size="9.5" font-weight="700" text-anchor="middle">VERCEL EDGE NETWORK</text>
      <text x="120" y="80" fill="#0f172a" font-size="8.5" font-weight="600" text-anchor="middle">Frontend SPA Distribution</text>
      <text x="120" y="96" fill="#2563eb" font-size="7.5" text-anchor="middle">ai-prof-study-companion.vercel.app</text>
      <text x="120" y="125" fill="#64748b" font-size="7.5" text-anchor="middle">• Vite 8 Production Bundle</text>
      <text x="120" y="140" fill="#64748b" font-size="7.5" text-anchor="middle">• Edge Caching & SSL Termination</text>
      <text x="120" y="155" fill="#64748b" font-size="7.5" text-anchor="middle">• Automatic Git-triggered Builds</text>

      <path d="M 220 110 L 265 110" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="242" y="102" fill="#2563eb" font-size="7" font-weight="700" text-anchor="middle">HTTPS</text>

      <!-- Render Cloud -->
      <rect x="270" y="30" width="210" height="160" rx="8" fill="#ffffff" stroke="#46e3b7" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="270" y="30" width="210" height="28" rx="8" fill="#1e293b"/>
      <text x="375" y="49" fill="#46e3b7" font-size="9.5" font-weight="700" text-anchor="middle">RENDER WEB SERVICE</text>
      <text x="375" y="80" fill="#0f172a" font-size="8.5" font-weight="600" text-anchor="middle">Docker Containerized Backend</text>
      <text x="375" y="96" fill="#64748b" font-size="7.5" text-anchor="middle">Eclipse Temurin 21 JRE Runtime</text>
      <text x="375" y="125" fill="#64748b" font-size="7.5" text-anchor="middle">• Spring Boot 3.4.3 Executable JAR</text>
      <text x="375" y="140" fill="#64748b" font-size="7.5" text-anchor="middle">• Health Check: /actuator/health</text>
      <text x="375" y="155" fill="#64748b" font-size="7.5" text-anchor="middle">• Secure Env Injection (JWT/Gemini)</text>

      <path d="M 480 80 L 525 60" stroke="#047857" stroke-width="2" marker-end="url(#arrow-green)"/>
      <path d="M 480 140 L 525 155" stroke="#4338ca" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Neon PostgreSQL -->
      <rect x="530" y="20" width="190" height="85" rx="8" fill="#ffffff" stroke="#047857" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="530" y="20" width="190" height="24" rx="8" fill="#047857"/>
      <text x="625" y="36" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">NEON DATABASE</text>
      <text x="625" y="60" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">Serverless PostgreSQL 16</text>
      <text x="625" y="74" fill="#047857" font-size="7.5" font-weight="600" text-anchor="middle">pgvector 3072d Indexing</text>
      <text x="625" y="88" fill="#64748b" font-size="7" text-anchor="middle">SSL Mode = require</text>

      <!-- Google AI Studio -->
      <rect x="530" y="120" width="190" height="85" rx="8" fill="#ffffff" stroke="#4338ca" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="530" y="120" width="190" height="24" rx="8" fill="#4338ca"/>
      <text x="625" y="136" fill="#ffffff" font-size="8.5" font-weight="700" text-anchor="middle">GOOGLE CLOUD AI</text>
      <text x="625" y="160" fill="#0f172a" font-size="8" font-weight="600" text-anchor="middle">Gemini Flash Lite API</text>
      <text x="625" y="174" fill="#4338ca" font-size="7.5" font-weight="600" text-anchor="middle">gemini-embedding-001</text>
      <text x="625" y="188" fill="#64748b" font-size="7" text-anchor="middle">HTTPS Port 443 REST</text>
    </svg>
    <div class="diagram-caption">Figure 10.1: Production Cloud Deployment Architecture</div>
  </div>

  <h3>10.1 Production Configuration & Request Flow</h3>
  <ul>
    <li><strong>Frontend (Vercel):</strong> Built automatically from the <code>main</code> branch using <code>npm run build</code>. The resulting single-page bundle is distributed across Vercel's global edge network. Client-side routing is supported by <code>vercel.json</code> which redirects all non-static routes to <code>index.html</code>.</li>
    <li><strong>Backend (Render Web Service):</strong> Render detects repository pushes, executes the multi-stage <code>Dockerfile</code>, compiles using Maven, and runs the optimized Temurin 21 JRE image. Spring Boot Actuator exposes <code>/actuator/health</code> for zero-downtime health probing.</li>
    <li><strong>Database (Neon Serverless):</strong> Provides auto-scaling compute and managed PostgreSQL 16 with pre-compiled <code>pgvector</code> support. Connects through TLS-encrypted JDBC connection strings.</li>
  </ul>

  <!-- ═════════════════════════════════════════════════════════════════ -->
  <!-- SECTION 11 & 12: WORKFLOWS & DECISIONS                           -->
  <!-- ═════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="doc-header">
    <div class="brand">AiProf <span>Architecture Documentation</span></div>
    <div class="meta">11. End-to-End Workflows & 12. Architectural Decisions</div>
  </div>

  <h1>11. End-to-End User Workflows</h1>

  <h3>Workflow 1: Course Document Upload & Vector RAG Ingestion</h3>
  <ol>
    <li><strong>User Interaction:</strong> The student opens a project inside a learning space, navigates to the Materials tab, and uploads a course lecture PDF (e.g., <em>"Distributed_Systems_Lecture3.pdf"</em>).</li>
    <li><strong>Upload Ingestion:</strong> <code>MaterialController</code> receives the <code>MultipartFile</code>, validates MIME type and file size (&lt; 50MB), saves the file to disk storage, and persists a <code>Material</code> record with status <code>PROCESSING</code>.</li>
    <li><strong>Semantic Chunking:</strong> <code>RagService</code> invokes Apache Tika to extract raw text, standardizes whitespace, and segments the text into 400-token chunks with 50-token overlap.</li>
    <li><strong>Vector Embedding:</strong> The service batches chunks into Google Gemini's <code>gemini-embedding-001</code> API, generating a 3072-dimensional vector embedding for each segment.</li>
    <li><strong>Database Persistence:</strong> All chunks, accompanied by their vector arrays, are batch-inserted into the <code>document_chunks</code> table. Material status is updated to <code>COMPLETED</code>. The student receives a success toast notification.</li>
  </ol>

  <h3>Workflow 2: Grounded Socratic Tutoring Interaction</h3>
  <ol>
    <li><strong>User Query:</strong> The student types a question in the tutor interface: <em>"How does the Raft consensus algorithm handle leader crashes?"</em></li>
    <li><strong>Material Validation Gate:</strong> <code>TutorService</code> verifies that the active project contains at least one completed material. If zero materials exist, throws <code>NO_MATERIALS</code> exception, prompting the UI to show the upload document gate.</li>
    <li><strong>Cosine Similarity Retrieval:</strong> The student's prompt is vectorized via Gemini Embedding. A native SQL query computes cosine distance (<code>&lt;=&gt;</code>) between the prompt vector and the project's chunk embeddings, selecting the Top 6 nearest excerpts.</li>
    <li><strong>Socratic Context Injection:</strong> A prompt is assembled pairing the Top 6 excerpts with conversation history and the Socratic system prompt.</li>
    <li><strong>Inference & Citation Extraction:</strong> Gemini Flash Lite generates a response that poses guiding questions, tests foundational knowledge, and cites chunks using <code>[Citation: ...]</code>.</li>
    <li><strong>Persistence & Rendering:</strong> Messages and citations are stored in <code>chat_messages</code> and returned to the client, rendering markdown and interactive citation pills.</li>
  </ol>

  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

  <h1>12. Architectural Decisions & Considerations</h1>

  <h3>12.1 Justification of Architecture</h3>
  <ul>
    <li><strong>PostgreSQL <code>pgvector</code> vs. Dedicated Vector Database (Pinecone/Milvus):</strong> Using <code>pgvector</code> eliminates the operational overhead and distributed data sync issues of maintaining a separate vector database. Relational data (users, projects) and vector embeddings reside in the same ACID-compliant engine, enabling transactional integrity and cascading deletions.</li>
    <li><strong>Spring Boot 3.4 + Java 21 vs. Node.js/Python:</strong> Java 21 LTS offers enterprise performance, robust static typing, memory efficiency, and proven multithreading for file-processing pipelines.</li>
    <li><strong>Stateless JWT + Refresh Token Rotation:</strong> Ensures horizontal scalability across backend containers while preserving session revocation capabilities via database-backed refresh tokens.</li>
    <li><strong>Decoupled React 19 Frontend:</strong> Hosted on Vercel's global edge network, minimizing initial page load latency and insulating client rendering from backend cold-starts.</li>
  </ul>

  <h3>12.2 Current Limitations & Future Roadmap</h3>
  <ul>
    <li><strong>Synchronous Ingestion for Small Files:</strong> Ingestion runs synchronously on smaller files; future iterations will implement a Redis/Kafka message queue with Celery/Spring Batch for large textbook ingestion.</li>
    <li><strong>Context Window Optimization:</strong> Currently retrieves Top 6 chunks; implementing Reciprocal Rank Fusion (RRF) with full-text search (BM25) would further enhance hybrid retrieval accuracy.</li>
    <li><strong>Multi-Modal Vision Tutoring:</strong> Expanding RAG to parse complex diagrams and mathematical notations using Gemini Vision.</li>
  </ul>

  <!-- End of Document Banner -->
  <div style="margin-top: 30px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; font-size: 8pt; color: #64748b;">
    <strong>AiProf Study Companion</strong> • Architecture Documentation • Prepared for Full Stack AI Engineer Intern Submission • © 2026 Sathwik Bodakunta
  </div>

</body>
</html>
`;

const htmlFilePath = path.resolve(__dirname, 'architecture_document.html');
const pdfFilePath = path.resolve(__dirname, 'AiProf_Architecture_Documentation.pdf');

fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
console.log('HTML architecture document written to:', htmlFilePath);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const cmd = `"${chromePath}" --headless=new --disable-gpu --print-to-pdf="${pdfFilePath}" --no-pdf-header-footer "${htmlFilePath}"`;

console.log('Generating PDF via headless Chrome...');
try {
  execSync(cmd, { stdio: 'inherit' });
  const stats = fs.statSync(pdfFilePath);
  console.log('SUCCESS: Architecture PDF successfully generated!');
  console.log('PDF Location:', pdfFilePath);
  console.log('PDF Size:', (stats.size / 1024).toFixed(1), 'KB');
} catch (error) {
  console.error('Failed to generate PDF:', error);
  process.exit(1);
}
