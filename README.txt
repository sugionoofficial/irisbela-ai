# IrisBela AI — Fixed Project

Struktur:
- index.html
- login.html
- api/analyze.js
- api/enhance.js
- api/scene.js
- api/timeline.js

Untuk deployment Vercel, folder `api/` harus tetap berada di root project agar endpoint:
- /api/analyze
- /api/enhance
- /api/scene
- /api/timeline

tersedia.

Environment variable yang dibutuhkan:
- GEMINI_API_KEY

Catatan:
- Jangan memasukkan API key ke file HTML/JavaScript frontend.
- Fitur "Ingat saya" hanya menyimpan email, bukan password.
- Kredit yang dikurangi melalui fungsi frontend kini disinkronkan ke localStorage.
- Endpoint scene/timeline menggunakan JSON MIME output agar parsing lebih stabil.
