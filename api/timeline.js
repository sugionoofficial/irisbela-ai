export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method tidak diizinkan."
        });
    }

    try {

        const {
            action,
            idea,
            scene,
            previousScene,
            characterProfile,
            productProfile,
            globalSettings
        } = req.body || {};

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "GEMINI_API_KEY belum tersedia."
            });
        }

        let instruction = "";

        /*
        ==========================================
        AUTO TIMELINE
        ==========================================
        */

        if (action === "timeline") {

            if (!idea || !idea.trim()) {
                return res.status(400).json({
                    error: "Ide cerita belum diisi."
                });
            }

            instruction = `
Anda adalah Timeline Director untuk Irisbela AI.

Ubah ide pengguna menjadi timeline video yang
terstruktur dan realistis.

IDE:
${idea}

CHARACTER PROFILE:
${characterProfile || "Tidak tersedia"}

PRODUCT PROFILE:
${productProfile || "Tidak tersedia"}

GLOBAL SETTINGS:
${JSON.stringify(globalSettings || {})}

Kembalikan HANYA JSON valid:

{
  "title": "",
  "concept": "",
  "scenes": [
    {
      "title": "",
      "duration": "8 detik",
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
      "transition": ""
    }
  ]
}

ATURAN:

1. Pertahankan inti cerita.
2. Gunakan karakter yang sama.
3. Jangan mengubah wajah.
4. Jangan mengubah rambut.
5. Jangan mengubah outfit kecuali cerita meminta perubahan.
6. Jangan mengubah produk.
7. Jangan mengubah warna produk.
8. Jangan mengubah desain produk.
9. Pertahankan kontinuitas lokasi.
10. Pertahankan arah karakter.
11. Pertahankan arah kamera.
12. Kamera harus berada pada posisi fisik yang masuk akal.
13. Gerakan tangan harus sesuai aktivitas.
14. Gerakan tubuh harus realistis.
15. Ekspresi harus sesuai adegan.
16. Jika kendaraan digunakan di Indonesia,
    posisi pengemudi berada di sebelah kiri.
17. Jangan memindahkan steering wheel.
18. Jangan membuat karakter tiba-tiba berubah posisi.
19. Jangan membuat objek muncul tanpa alasan.
20. Setiap scene harus merupakan kelanjutan scene sebelumnya.
21. Scene pertama harus menjadi pembuka.
22. Scene terakhir harus menjadi penutup.
23. Untuk konten affiliate, tampilkan produk dengan jelas.
24. Gunakan bahasa Indonesia.
25. Jangan menggunakan markdown.
26. Jangan memberikan penjelasan di luar JSON.
`;

        }

        /*
        ==========================================
        GENERATE SINGLE SCENE
        ==========================================
        */

        else if (action === "scene") {

            if (!scene) {
                return res.status(400).json({
                    error: "Data scene belum tersedia."
                });
            }

            instruction = `
Anda adalah Prompt Director profesional untuk
Irisbela AI.

Buat prompt final untuk satu scene video.

CHARACTER PROFILE:
${characterProfile || "Tidak tersedia"}

PRODUCT PROFILE:
${productProfile || "Tidak tersedia"}

GLOBAL SETTINGS:
${JSON.stringify(globalSettings || {})}

PREVIOUS SCENE:
${JSON.stringify(previousScene || {})}

CURRENT SCENE:
${JSON.stringify(scene)}

Tugas:

Buat SATU prompt final yang sangat detail,
realistis, konsisten dan siap digunakan
untuk AI video generator.

Prompt wajib menjelaskan:

- identitas karakter
- wajah
- rambut
- outfit
- produk
- lokasi
- waktu
- aktivitas
- gerakan tubuh
- gerakan tangan
- ekspresi
- posisi karakter
- hubungan karakter dengan kamera
- camera angle
- camera position
- camera movement
- camera focus
- pencahayaan
- visual style
- kualitas
- aspect ratio
- durasi
- dialog
- continuity dari scene sebelumnya
- negative instruction

ATURAN CONTINUITY:

Karakter harus tetap orang yang sama.
Wajah tidak boleh berubah.
Rambut tidak boleh berubah.
Outfit tidak boleh berubah kecuali diminta.
Produk tidak boleh berubah.
Warna produk tidak boleh berubah.
Bentuk produk tidak boleh berubah.
Lokasi harus konsisten.
Arah gerakan harus konsisten.
Perspektif kamera harus masuk akal.
Jangan membuat objek tiba-tiba muncul.
Jangan membuat objek tiba-tiba menghilang.

Jika menggunakan mobil:
pengemudi Indonesia berada di sisi kiri,
steering wheel tetap berada di sisi kiri,
arah tubuh dan kamera harus konsisten.

Jangan menggunakan kalimat:
"sama seperti scene sebelumnya".

Tulis kembali detail penting secara eksplisit.

Keluarkan HANYA prompt final.
Jangan menggunakan markdown.
`;

        }

        else {

            return res.status(400).json({
                error: "Action tidak dikenal."
            });

        }


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
                                    maxOutputTokens:
                                        action === "timeline"
                                            ? 6000
                                            : 4000
                                }

                            })
                        }
                    );

                const data =
                    await response.json();

                if (response.ok) {

                    let result =
                        data.candidates?.[0]
                        ?.content?.parts
                        ?.map(
                            part =>
                                part.text || ""
                        )
                        .join("\n")
                        .trim();

                    if (result) {

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

                        if (
                            action === "timeline"
                        ) {

                            try {

                                const parsed =
                                    JSON.parse(
                                        result
                                    );

                                if (
                                    parsed &&
                                    Array.isArray(
                                        parsed.scenes
                                    )
                                ) {

                                    return res
                                        .status(200)
                                        .json({
                                            result:
                                                parsed,
                                            model:
                                                model
                                        });

                                }

                            } catch (error) {

                                lastError =
                                    "JSON timeline tidak valid.";

                            }

                        } else {

                            return res
                                .status(200)
                                .json({
                                    result:
                                        result,
                                    model:
                                        model
                                });

                        }

                    }

                } else {

                    lastError =
                        data.error?.message ||
                        `Model ${model} gagal.`;

                }

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            500
                        )
                );

            } catch (error) {

                lastError =
                    error.message;

            }

        }

        return res.status(503).json({
            error:
                "AI Timeline Director tidak tersedia.",
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
