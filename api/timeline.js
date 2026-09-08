export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method tidak diizinkan."
        });
    }

    try {

        const {
            idea,
            totalDuration,
            sceneCount,
            characterProfile,
            productProfile
        } = req.body || {};

        if (!idea || !idea.trim()) {
            return res.status(400).json({
                error: "Ide cerita belum diisi."
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "GEMINI_API_KEY belum tersedia."
            });
        }

        const instruction = `
Anda adalah AI Timeline Director untuk Irisbela AI.

Tugas Anda adalah mengubah ide pengguna menjadi
timeline video multi-scene yang konsisten.

IDE CERITA:
${idea}

TOTAL DURASI:
${totalDuration || "Tidak ditentukan"}

JUMLAH SCENE:
${sceneCount || "Tentukan secara otomatis"}

CHARACTER PROFILE:
${characterProfile || "Tidak tersedia"}

PRODUCT PROFILE:
${productProfile || "Tidak tersedia"}

Buat timeline yang mempunyai kesinambungan visual
dan logika antar-scene.

Kembalikan HANYA JSON VALID.

FORMAT:

{
  "title": "",
  "concept": "",
  "totalDuration": "",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "",
      "duration": "",
      "location": "",
      "time": "",
      "activity": "",
      "characterMovement": "",
      "handMovement": "",
      "expression": "",
      "cameraAngle": "",
      "cameraMovement": "",
      "cameraPosition": "",
      "cameraFocus": "",
      "dialogue": "",
      "voice": "",
      "transition": "",
      "prompt": ""
    }
  ]
}

ATURAN PENTING:

1. Jangan mengubah inti cerita pengguna.
2. Pertahankan karakter yang sama di seluruh scene.
3. Jangan mengubah wajah karakter.
4. Jangan mengubah bentuk tubuh karakter.
5. Jangan mengubah rambut kecuali memang diminta.
6. Jangan mengganti outfit kecuali memang diminta.
7. Jika ada produk, produk harus tetap sama.
8. Jangan mengubah warna atau desain produk.
9. Lokasi harus memiliki kesinambungan visual.
10. Perubahan lokasi hanya jika cerita memang memerlukannya.
11. Gerakan karakter harus realistis.
12. Gerakan tangan harus sesuai aktivitas.
13. Ekspresi harus sesuai situasi.
14. Kamera harus mempunyai posisi fisik yang masuk akal.
15. Jangan membuat kamera berada di posisi yang mustahil.
16. Jika menggunakan kendaraan di Indonesia,
    posisi pengemudi berada di sisi kiri kendaraan.
17. Jangan membuat steering wheel berpindah sisi.
18. Pertahankan hubungan arah karakter dengan kamera.
19. Jangan membuat karakter tiba-tiba membelakangi kamera
    jika scene sebelumnya menghadap kamera tanpa alasan.
20. Setiap scene harus terasa sebagai kelanjutan scene sebelumnya.
21. Gunakan transisi yang realistis.
22. Hindari objek tiba-tiba muncul atau menghilang.
23. Jangan mengganti jenis kamera tanpa alasan.
24. Pertahankan gaya visual antar-scene.
25. Jika video promosi produk, pastikan produk terlihat jelas.
26. Jika ada dialog, dialog harus menggunakan bahasa Indonesia.
27. Jika tidak ada dialog, gunakan "Tidak ada dialog."
28. Jika tidak ada suara karakter, gunakan
    "Tidak ada suara karakter."
29. Jangan menggunakan markdown.
30. Jangan memberikan penjelasan di luar JSON.
31. Semua scene harus memiliki prompt final.
32. Prompt setiap scene harus dapat langsung digunakan
    untuk AI image atau video generation.
33. Jangan menggunakan kata "sama seperti scene sebelumnya"
    di dalam prompt. Jelaskan kembali detail pentingnya.
34. Jangan membuat identitas karakter menjadi generik.

Jika jumlah scene tidak ditentukan:
buat 3 sampai 6 scene berdasarkan kompleksitas cerita.

Jika total durasi tidak ditentukan:
gunakan durasi realistis sekitar 8 detik per scene.

Pastikan total durasi seluruh scene masuk akal.

Untuk setiap prompt:
gabungkan karakter, lokasi, aktivitas, pose,
kamera, pencahayaan, gaya visual, kontinuitas,
dan negative instruction yang diperlukan.

`;

        const models = [
            "gemini-3.8-flash",
            "gemini-3.7-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash-lite"
        ];

        let lastError = "Semua model gagal.";

        for (const model of models) {

            try {

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key":
                                process.env.GEMINI_API_KEY
                        },

                        body: JSON.stringify({

                            contents: [
                                {
                                    parts: [
                                        {
                                            text: instruction
                                        }
                                    ]
                                }
                            ],

                            generationConfig: {
                                temperature: 0.2,
                                maxOutputTokens: 7000
                            }

                        })
                    }
                );

                const data = await response.json();

                if (response.ok) {

                    let result =
                        data.candidates?.[0]
                        ?.content?.parts
                        ?.map(part => part.text || "")
                        .join("\n")
                        .trim();

                    if (result) {

                        result = result
                            .replace(/^```json/i, "")
                            .replace(/^```/i, "")
                            .replace(/```$/i, "")
                            .trim();

                        try {

                            const parsed = JSON.parse(result);

                            if (
                                parsed &&
                                Array.isArray(parsed.scenes)
                            ) {

                                return res.status(200).json({
                                    result: parsed,
                                    model: model
                                });

                            }

                            lastError =
                                "Timeline tidak memiliki array scenes.";

                        } catch (jsonError) {

                            lastError =
                                "Gemini mengembalikan JSON tidak valid.";

                        }

                    }

                } else {

                    lastError =
                        data.error?.message ||
                        `Model ${model} gagal.`;

                }

                await new Promise(resolve =>
                    setTimeout(resolve, 500)
                );

            } catch (error) {

                lastError = error.message;

            }

        }

        return res.status(503).json({
            error:
                "Timeline Builder AI tidak tersedia.",
            detail:
                lastError
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error:
                error.message ||
                "Terjadi kesalahan server."
        });

    }

}
