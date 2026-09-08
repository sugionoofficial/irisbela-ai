export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method tidak diizinkan."
        });
    }

    try {

        const { idea } = req.body || {};

        if (!idea || !idea.trim()) {
            return res.status(400).json({
                error: "Ide scene belum diisi."
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "GEMINI_API_KEY belum tersedia."
            });
        }

        const instruction = `
Anda adalah Scene Builder untuk Irisbela AI.

Tugas Anda adalah mengubah ide sederhana pengguna
menjadi struktur scene yang sangat jelas untuk
image generation dan video generation.

IDE PENGGUNA:
${idea}

Kembalikan HANYA JSON valid.

Format JSON WAJIB:

{
  "concept": "",
  "location": "",
  "time": "",
  "mainActivity": "",
  "characterMovement": "",
  "handMovement": "",
  "expression": "",
  "cameraAngle": "",
  "cameraMovement": "",
  "cameraPosition": "",
  "cameraFocus": "",
  "lighting": "",
  "visualStyle": "",
  "quality": "",
  "outputType": "",
  "aspectRatio": "",
  "duration": "",
  "dialogue": "",
  "voice": "",
  "music": "",
  "negativePrompt": ""
}

ATURAN:

1. Jangan mengubah inti ide pengguna.
2. Jika informasi tidak disebutkan, isi dengan pilihan
   yang paling masuk akal berdasarkan konteks.
3. Jangan membuat karakter baru jika tidak diminta.
4. Jangan membuat produk baru jika tidak diminta.
5. Pertahankan hubungan antara kamera, karakter,
   lingkungan dan arah gerakan.
6. Pastikan posisi kamera dan arah karakter masuk akal
   secara fisik.
7. Untuk kendaraan di Indonesia, posisi pengemudi
   berada di sisi kiri kendaraan.
8. Jika scene video, isi gerakan secara realistis.
9. Jika scene image, cameraMovement boleh "statis".
10. Gunakan bahasa Indonesia.
11. Jangan menggunakan markdown.
12. Jangan memberikan penjelasan di luar JSON.
13. JSON harus valid dan dapat langsung diproses JavaScript.

Nilai outputType hanya boleh:
"Image" atau "Video"

Nilai aspectRatio gunakan salah satu:
"9:16"
"16:9"
"1:1"

Jika durasi tidak disebutkan:
gunakan "8 detik" untuk video.

Jika dialogue tidak ada:
gunakan "Tidak ada dialog."

Jika voice tidak ada:
gunakan "Tidak ada suara karakter."

Jika music tidak disebutkan:
gunakan "Musik latar natural dan tidak dominan."
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
                                maxOutputTokens: 2500
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

                            const parsed =
                                JSON.parse(result);

                            return res.status(200).json({
                                result: parsed,
                                model: model
                            });

                        } catch (jsonError) {

                            lastError =
                                "Gemini mengembalikan JSON yang tidak valid.";
                        }
                    }
                }

                lastError =
                    data.error?.message ||
                    lastError;

                await new Promise(resolve =>
                    setTimeout(resolve, 500)
                );

            } catch (error) {

                lastError = error.message;

            }
        }

        return res.status(503).json({
            error: "Scene Builder AI tidak tersedia.",
            detail: lastError
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
