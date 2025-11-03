# Migration Plan: Moving from GitHub Pages

This document outlines the justification and plan for migrating VibeCodeTris from GitHub Pages to a hosting provider that supports modern web standards.

## 1. Justification

The core issue is that the game crashes on the live GitHub Pages site with the error `ReferenceError: SharedArrayBuffer is not defined`.

This happens because `SharedArrayBuffer`, a browser feature used for high-performance multi-threading (essential for our game's engine running in a web worker), requires the server to send specific HTTP headers for security reasons. These headers are:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Our local development server works perfectly because Vite automatically includes these headers. However, **GitHub Pages does not support custom HTTP headers.** Despite multiple attempts to configure them via workflow actions and `_headers` files, the platform ignores them.

This limitation makes GitHub Pages unsuitable for hosting modern, high-performance web applications that rely on features like `SharedArrayBuffer`. Continuing to use it would force a significant and detrimental refactor of the game's core logic, sacrificing performance and future capabilities.

## 2. Proposed Next Step: Migrate to a New Host

The most effective, lowest-effort, and future-proof solution is to migrate to a hosting provider that fully supports custom headers and is designed for modern web applications.

Our proposed host is **Netlify**, due to its generous free tier and simple configuration.

The migration process is straightforward:
1.  Create a free account on Netlify and connect it to the GitHub repository.
2.  Configure the project's build settings (the command and publish directory).
3.  Add a `netlify.toml` configuration file to the repository to define the required headers.
4.  The new site will be deployed automatically on every push to the `main` branch.

This one-time setup will resolve the current issue and prevent similar platform-limitation problems in the future.

## 3. Free Hosting Resources

All of the following providers offer robust free tiers suitable for this project and support custom headers.

*   **Netlify:** [https://www.netlify.com/pricing/](https://www.netlify.com/pricing/)
    *   *Configuration via a `netlify.toml` file.*
*   **Vercel:** [https://vercel.com/pricing](https://vercel.com/pricing)
    *   *Configuration via a `vercel.json` file.*
*   **Cloudflare Pages:** [https://pages.cloudflare.com/](https://pages.cloudflare.com/)
    *   *Configuration via a `_headers` file.*
