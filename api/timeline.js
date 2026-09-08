export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method tidak diizinkan."
        });
    }

    try {

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "GEMINI_API_KEY belum tersedia di Vercel."
            });
        }

        const {
            action,
            idea,
            scenes,
            characterProfile,
            productProfile,
            globalSettings
        } = req.body || {};

        if (action !== "generate_all") {
            return res.status(400).json({
                error: "Action tidak valid."
            });
        }

        if (
            !Array.isArray(scenes) ||
            scenes.length === 0
        ) {
            return res.status(400).json({
                error: "Timeline belum memiliki scene."
            });
        }

        const instruction = `
Anda adalah Prompt Director profesional untuk Irisbela AI.

Tugas:
Buat prompt FINAL untuk setiap scene video.

IDE CERITA:
${idea || "Tidak tersedia"}

CHARACTER PROFILE:
${characterProfile || "Tidak tersedia"}

PRODUCT PROFILE:
${productProfile || "Tidak tersedia"}

GLOBAL SETTINGS:
${JSON.stringify(globalSettings || {}, null, 2)}

TIMELINE:
${JSON.stringify(scenes, null, 2)}

Kembalikan HANYA JSON VALID dengan format:

{
  "prompts": [
    {
      "sceneNumber": 1,
      "prompt": ""
    }
  ]
}

ATURAN:

1. Jumlah prompt harus sama dengan jumlah scene.
2. Jangan menghilangkan scene.
3. Setiap prompt harus berdiri sendiri.
4. Jangan menulis "sama seperti scene sebelumnya".
5. Detail karakter penting harus ditulis ulang pada setiap prompt.
6. Pertahankan wajah karakter.
7. Pertahankan rambut.
8. Pertahankan bentuk tubuh.
9. Pertahankan outfit.
10. Jangan mengganti outfit tanpa alasan.
11. Pertahankan produk.
12. Pertahankan warna produk.
13. Pertahankan bentuk dan desain produk.
14. Pertahankan lokasi.
15. Pertahankan kontinuitas waktu.
16. Pertahankan arah karakter.
17. Pertahankan posisi karakter terhadap kamera.
18. Camera angle harus sesuai secara fisik.
19. Camera position harus sesuai secara fisik.
20. Camera movement harus realistis.
21. Camera focus harus sesuai objek utama.
22. Gerakan tangan harus realistis.
23. Gerakan tubuh harus realistis.
24. Ekspresi harus sesuai adegan.
25. Jika menggunakan mobil di Indonesia,
    pengemudi berada di sisi kiri kendaraan.
26. Steering wheel tetap berada di sisi kiri.
27. Jangan membuat perspektif kamera mustahil.
28. Jangan membuat objek tiba-tiba muncul.
29. Jangan membuat objek tiba-tiba hilang.
30. Gunakan bahasa Indonesia.
31. Prompt harus siap digunakan untuk AI video generator.
32. Gunakan gaya photorealistic.
33. Sertakan kualitas dan aspect ratio.
34. Sertakan durasi.
35. Sertakan dialogue jika tersedia.
36. Sertakan negative instruction penting.
37. Jangan memberikan penjelasan di luar JSON.
`;

        const models = [
            "gemini-3.8-flash",
            "gemini-3.7-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash-lite"
        ];

        let lastError =
            "Semua model gagal.";

        for (const model of models) {

            try {

                const response =
                    await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "x-goog-api-key":
                                    process.env.GEMINI_API_KEY
                            },

                            body: JSON.stringify({

                                contents: [
                                    {
                                        parts: [
                                            {
                                                text:
                                                    instruction
                                            }
                                        ]
                                    }
                                ],

                                generationConfig: {
                                    temperature: 0.2,
                                    maxOutputTokens: 10000
                                }

                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    lastError =
                        data.error?.message ||
                        `Model ${model} gagal.`;

                    continue;
                }

                let result =
                    data.candidates?.[0]
                    ?.content?.parts
                    ?.map(
                        part =>
                            part.text || ""
                    )
                    .join("\n")
                    .trim();

                if (!result) {

                    lastError =
                        "Gemini tidak mengembalikan hasil.";

                    continue;
                }

                result =
                    result
                        .replace(
                            /^```json/i,
                            ""
                        )
                        .replace(
                            /^```/i,
                            ""
                        )
                        .replace(
                            /```$/i,
                            ""
                        )
                        .trim();

                let parsed;

                try {

                    parsed =
                        JSON.parse(result);

                } catch (error) {

                    lastError =
                        "Response Gemini bukan JSON valid.";

                    continue;

                }

                if (
                    !parsed.prompts ||
                    !Array.isArray(
                        parsed.prompts
                    )
                ) {

                    lastError =
                        "Response tidak memiliki prompts.";

                    continue;

                }

                return res.status(200).json({

                    result:
                        parsed,

                    model:
                        model

                });

            } catch (error) {

                lastError =
                    error.message;

            }

        }

        return res.status(503).json({

            error:
                "Generate prompt gagal.",

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
