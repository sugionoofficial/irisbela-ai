IRISBELA AI - VERCEL READY

STRUKTUR WAJIB:
index.html
login.html
api/analyze.js
api/enhance.js
api/scene.js
api/timeline.js

PENTING:
Jangan upload index.html saja. Folder api harus ikut berada di root project agar /api/analyze, /api/scene, dan /api/timeline tidak 404.

ENVIRONMENT VARIABLE VERCEL:
GEMINI_API_KEY = API key Gemini Anda

Setelah deploy, test:
/api/timeline hanya menerima POST dari aplikasi.

Jika menggunakan Vercel, deploy folder project ini sebagai satu project, bukan hanya file index.html.
