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
            scene,
            previousScene,
            scenes,
            characterProfile,
            productProfile,
            globalSettings
        } = req.body || {};


        /*
        ==================================================
        ACTION 1
        AUTO BUILD TIMELINE
        ==================================================
        */

        if (action === "timeline") {

            if (!idea || !idea.trim()) {

                return res.status(400).json({
                    error: "Ide cerita belum diisi."
                });

            }

            const instruction = `
Anda adalah Timeline Director profesional untuk Irisbela AI.

Ubah ide pengguna menjadi timeline video yang
terstruktur, realistis, sinematik dan memiliki
kontinuitas antar scene.

IDE CERITA:
${idea}

CHARACTER PROFILE:
${characterProfile || "Tidak tersedia"}

PRODUCT PROFILE:
${productProfile || "Tidak tersedia"}

GLOBAL SETTINGS:
${JSON.stringify(
    globalSettings || {},
    null,
    2
)}

Kembalikan HANYA JSON VALID.

FORMAT:

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

1. Pertahankan inti cerita pengguna.
2. Gunakan karakter yang sama dari Character Profile.
3. Jangan mengubah wajah karakter.
4. Jangan mengubah rambut karakter.
5. Jangan mengubah bentuk tubuh karakter.
6. Jangan mengubah outfit karakter kecuali cerita meminta perubahan.
7. Jika Product Profile tersedia, gunakan produk yang sama.
8. Jangan mengubah warna produk.
9. Jangan mengubah bentuk produk.
10. Jangan mengubah desain produk.
11. Pertahankan lokasi antar scene jika tidak ada alasan cerita untuk berpindah.
12. Pertahankan kontinuitas waktu.
13. Pertahankan arah karakter.
14. Pertahankan hubungan karakter dengan kamera.
15. Camera angle harus masuk akal secara fisik.
16. Camera position harus masuk akal secara fisik.
17. Camera movement harus realistis.
18. Gerakan tangan harus sesuai aktivitas.
19. Gerakan tubuh harus realistis.
20. Ekspresi harus sesuai situasi.
21. Scene berikutnya harus merupakan kelanjutan scene sebelumnya.
22. Scene pertama menjadi pembuka.
23. Scene terakhir menjadi penutup.
24. Jangan membuat objek tiba-tiba muncul tanpa alasan.
25. Jangan membuat objek tiba-tiba menghilang tanpa alasan.
26. Jika menggunakan kendaraan di Indonesia,
    pengemudi berada di sisi kiri kendaraan.
27. Steering wheel kendaraan tetap di sisi kiri.
28. Jangan membalik perspektif kamera.
29. Jangan membuat posisi tubuh dan kamera bertentangan.
30. Gunakan bahasa Indonesia.
31. Jangan menggunakan markdown.
32. Jangan memberikan penjelasan di luar JSON.
33. JSON harus valid.
`;

            return await callGemini(
                res,
                instruction,
                "timeline"
            );

        }


        /*
        ==================================================
        ACTION 2
        GENERATE SINGLE SCENE
        ==================================================
        */

        if (action === "scene") {

            if (!scene) {

                return res.status(400).json({
                    error: "Data scene belum tersedia."
                });

            }

            const instruction = `
Anda adalah Prompt Director profesional untuk
Irisbela AI.

Buat SATU prompt video final berdasarkan scene.

CHARACTER PROFILE:
${characterProfile || "Tidak tersedia"}

PRODUCT PROFILE:
${productProfile || "Tidak tersedia"}

GLOBAL SETTINGS:
${JSON.stringify(
    globalSettings || {},
    null,
    2
)}

PREVIOUS SCENE:
${JSON.stringify(
    previousScene || {},
    null,
    2
)}

CURRENT SCENE:
${JSON.stringify(
    scene,
    null,
    2
)}

Buat prompt final yang:

- sangat detail
- realistis
- photorealistic
- sinematik
- konsisten
- siap digunakan AI video generator

PROMPT WAJIB MENJELASKAN:

1. Identitas karakter.
2. Wajah karakter.
3. Rambut karakter.
4. Bentuk tubuh karakter yang terlihat.
5. Outfit karakter.
6. Produk jika tersedia.
7. Lokasi.
8. Waktu.
9. Aktivitas.
10. Gerakan tubuh.
11. Gerakan tangan.
12. Ekspresi.
13. Posisi karakter.
14. Hubungan karakter dengan kamera.
15. Camera angle.
16. Camera position.
17. Camera movement.
18. Camera focus.
19. Pencahayaan.
20. Visual style.
21. Kualitas gambar.
22. Aspect ratio.
23. Durasi.
24. Dialogue.
25. Voice.
26. Continuity.
27. Negative instruction.

ATURAN CONTINUITY:

Karakter harus tetap orang yang sama.

Wajah tidak boleh berubah.

Rambut tidak boleh berubah.

Bentuk tubuh tidak boleh berubah secara tiba-tiba.

Outfit tidak boleh berubah kecuali scene meminta perubahan.

Produk tidak boleh berubah.

Warna produk tidak boleh berubah.

Bentuk produk tidak boleh berubah.

Lokasi harus konsisten.

Arah karakter harus konsisten.

Arah gerakan harus konsisten.

Perspektif kamera harus masuk akal.

Jangan membuat objek tiba-tiba muncul.

Jangan membuat objek tiba-tiba menghilang.

Jika menggunakan mobil di Indonesia:

- pengemudi berada di sebelah kiri
- steering wheel berada di sebelah kiri
- posisi tangan mengikuti steering wheel
- posisi tubuh pengemudi masuk akal
- arah kamera tidak boleh terbalik

JANGAN menggunakan kalimat:

"sama seperti scene sebelumnya"

Tulis detail penting secara eksplisit.

Keluarkan HANYA prompt final.

Jangan menggunakan markdown.
`;

            return await callGemini(
                res,
                instruction,
                "scene"
            );

        }


        /*
        ==================================================
        ACTION 3
        GENERATE SEMUA SCENE
        SATU REQUEST
        ==================================================
        */

        if (action === "generate_all") {

            if (
                !Array.isArray(scenes) ||
                scenes.length === 0
            ) {

                return res.status(400).json({
                    error:
                        "Timeline belum memiliki scene."
                });

            }

            const instruction = `
Anda adalah Prompt Director profesional untuk
Irisbela AI.

Tugas utama:

Buat PROMPT VIDEO FINAL untuk SEMUA SCENE
dalam timeline.

Semua scene harus memiliki kontinuitas
karakter, produk, lokasi, kamera dan gerakan.

IDE CERITA:
${idea || "Tidak tersedia"}

CHARACTER PROFILE:
${characterProfile || "Tidak tersedia"}

PRODUCT PROFILE:
${productProfile || "Tidak tersedia"}

GLOBAL SETTINGS:
${JSON.stringify(
    globalSettings || {},
    null,
    2
)}

TIMELINE:

${JSON.stringify(
    scenes,
    null,
    2
)}

Kembalikan HANYA JSON VALID.

FORMAT WAJIB:

{
    "prompts": [
        {
            "sceneNumber": 1,
            "prompt": "..."
        },
        {
            "sceneNumber": 2,
            "prompt": "..."
        }
    ]
}

ATURAN:

1. Jumlah prompt HARUS sama dengan jumlah scene.
2. Jangan menghilangkan scene.
3. Nomor scene harus sesuai urutan.
4. Setiap prompt harus berdiri sendiri.
5. Jangan menggunakan kalimat "sama seperti scene sebelumnya".
6. Detail karakter penting harus ditulis ulang pada setiap prompt.
7. Pertahankan identitas karakter.
8. Pertahankan wajah.
9. Pertahankan rambut.
10. Pertahankan bentuk tubuh.
11. Pertahankan outfit.
12. Jangan mengganti outfit tanpa alasan.
13. Pertahankan produk.
14. Pertahankan warna produk.
15. Pertahankan bentuk produk.
16. Pertahankan desain produk.
17. Pertahankan lokasi.
18. Pertahankan waktu.
19. Pertahankan arah karakter.
20. Pertahankan kontinuitas posisi.
21. Gerakan tangan harus realistis.
22. Gerakan tubuh harus realistis.
23. Ekspresi harus sesuai scene.
24. Camera angle harus realistis.
25. Camera position harus realistis.
26. Camera movement harus realistis.
27. Camera focus harus sesuai objek utama.
28. Pencahayaan harus konsisten.
29. Visual style harus konsisten.
30. Gunakan photorealistic.
31. Sertakan kualitas.
32. Sertakan aspect ratio.
33. Sertakan durasi.
34. Sertakan dialogue.
35. Sertakan voice.
36. Sertakan negative instruction.
37. Jangan membuat objek tiba-tiba muncul.
38. Jangan membuat objek tiba-tiba menghilang.
39. Jangan membuat karakter berubah wajah.
40. Jangan membuat karakter berubah pakaian.
41. Jangan membuat produk berubah.
42. Jika menggunakan kendaraan di Indonesia,
    pengemudi berada di sisi kiri.
43. Steering wheel berada di sisi kiri.
44. Jangan membalik kamera.
45. Jangan membuat perspektif mustahil.
46. Gunakan bahasa Indonesia.
47. Jangan menggunakan markdown.
48. Jangan memberikan penjelasan di luar JSON.
`;

            return await callGemini(
                res,
                instruction,
                "generate_all"
            );

        }


        /*
        ==================================================
        ACTION TIDAK DIKENAL
        ==================================================
        */

        return res.status(400).json({
            error:
                "Action tidak dikenal. Gunakan timeline, scene, atau generate_all."
        });


    } catch (error) {

        console.error(
            "Timeline API ERROR:",
            error
        );

        return res.status(500).json({

            error:
                error.message ||
                "Terjadi kesalahan server."

        });

    }

}


/*
==================================================
GEMINI FUNCTION
==================================================
*/

async function callGemini(
    res,
    instruction,
    action
) {

    const models = [

        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite"

    ];

    let lastError =
        "Semua model Gemini gagal.";

    for (
        const model of models
    ) {

        try {

            console.log(
                "Mencoba model:",
                model,
                "Action:",
                action
            );


            const response =
                await fetch(

                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                process.env.GEMINI_API_KEY

                        },

                        body:
                            JSON.stringify({

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

                                    temperature:
                                        0.2,

                                    maxOutputTokens:

                                        action ===
                                        "timeline"

                                            ? 6000

                                            : action ===
                                              "generate_all"

                                                ? 10000

                                                : 5000

                                }

                            })

                    }

                );


            const data =
                await response.json();


            /*
            ==========================================
            RESPONSE ERROR
            ==========================================
            */

            if (!response.ok) {

                lastError =
                    data.error?.message ||
                    `Model ${model} gagal.`;

                console.error(
                    model,
                    lastError
                );

                continue;

            }


            /*
            ==========================================
            AMBIL TEXT
            ==========================================
            */

            let result =

                data
                .candidates?.[0]
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


            /*
            ==========================================
            BERSIHKAN MARKDOWN JSON
            ==========================================
            */

            result =
                cleanGeminiResponse(
                    result
                );


            /*
            ==========================================
            ACTION TIMELINE
            ==========================================
            */

            if (
                action ===
                "timeline"
            ) {

                try {

                    const parsed =
                        JSON.parse(
                            result
                        );

                    if (
                        !parsed ||
                        !Array.isArray(
                            parsed.scenes
                        )
                    ) {

                        throw new Error(
                            "JSON timeline tidak memiliki scenes."
                        );

                    }

                    return res.status(
                        200
                    ).json({

                        result:
                            parsed,

                        model:
                            model

                    });

                } catch (error) {

                    lastError =
                        "JSON timeline dari Gemini tidak valid.";

                    console.error(
                        "JSON ERROR:",
                        result
                    );

                    continue;

                }

            }


            /*
            ==========================================
            ACTION GENERATE ALL
            ==========================================
            */

            if (
                action ===
                "generate_all"
            ) {

                try {

                    const parsed =
                        JSON.parse(
                            result
                        );

                    if (
                        !parsed ||
                        !Array.isArray(
                            parsed.prompts
                        )
                    ) {

                        throw new Error(
                            "JSON prompts tidak ditemukan."
                        );

                    }

                    return res.status(
                        200
                    ).json({

                        result:
                            parsed,

                        model:
                            model

                    });

                } catch (error) {

                    lastError =
                        "JSON generate_all dari Gemini tidak valid.";

                    console.error(
                        "JSON ERROR:",
                        result
                    );

                    continue;

                }

            }


            /*
            ==========================================
            ACTION SINGLE SCENE
            ==========================================
            */

            if (
                action ===
                "scene"
            ) {

                return res.status(
                    200
                ).json({

                    result:
                        result,

                    model:
                        model

                });

            }


        } catch (error) {

            lastError =
                error.message;

            console.error(
                "FETCH ERROR:",
                error
            );

        }

    }


    /*
    ==============================================
    SEMUA MODEL GAGAL
    ==============================================
    */

    return res.status(
        503
    ).json({

        error:
            "AI Timeline Director tidak tersedia.",

        detail:
            lastError

    });

}


/*
==================================================
BERSIHKAN RESPONSE GEMINI
==================================================
*/

function cleanGeminiResponse(
    text
) {

    let result =
        String(text)
        .trim();


    /*
    Hapus ```json
    */

    result =
        result.replace(
            /^```json\s*/i,
            ""
        );


    /*
    Hapus ```
    */

    result =
        result.replace(
            /^```\s*/i,
            ""
        );


    result =
        result.replace(
            /\s*```$/i,
            ""
        );


    /*
    Cari object JSON pertama
    jika Gemini menambahkan teks.
    */

    const firstBrace =
        result.indexOf("{");

    const lastBrace =
        result.lastIndexOf("}");


    if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
    ) {

        result =
            result.substring(
                firstBrace,
                lastBrace + 1
            );

    }


    return result.trim();

}
