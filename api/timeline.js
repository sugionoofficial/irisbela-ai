// Trigger deployment
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
            sceneCount,
            characterProfile,
            productProfile,
            globalSettings,
            negativePrompt
        } = req.body || {};


        /*
        ==================================================
        ACTION: TIMELINE
        ==================================================
        */

        if (action === "timeline") {

            if (!idea || !idea.trim()) {

                return res.status(400).json({
                    error: "Ide cerita belum diisi."
                });

            }

            const instruction = `
Anda adalah Timeline Director profesional
untuk Irisbela AI.

Buat timeline video yang realistis,
sinematik dan memiliki kontinuitas kuat.

IDE CERITA:
${idea}

JUMLAH SCENE YANG WAJIB DIBUAT:
${Number(sceneCount) || 6}

PENTING:
- Output wajib memiliki tepat ${Number(sceneCount) || 6} scene.
- Jangan hanya membuat satu scene.
- Jangan menggabungkan beberapa scene menjadi satu object.
- Setiap scene harus menjadi object terpisah di dalam array "scenes".
- Jika jumlah scene yang diminta adalah N, array "scenes" harus memiliki tepat N object.

CHARACTER PROFILE:
${characterProfile || "Tidak tersedia"}

PRODUCT PROFILE:
${productProfile || "Tidak tersedia"}

GLOBAL SETTINGS:
${JSON.stringify(globalSettings || {}, null, 2)}

NEGATIVE PROMPT:
${negativePrompt || "Tidak tersedia"}

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
      "characterPosition": "",
      "cameraAngle": "",
      "cameraMovement": "",
      "cameraPosition": "",
      "cameraFocus": "",
      "lighting": "",
      "dialogue": "",
      "voice": "",
      "transition": ""
    }
  ]
}

ATURAN:

1. Pertahankan inti cerita.
2. Gunakan karakter yang sama.
3. Wajah karakter tidak berubah.
4. Rambut tidak berubah.
5. Bentuk tubuh tidak berubah.
6. Outfit tetap konsisten.
7. Produk tetap konsisten.
8. Warna produk tetap.
9. Bentuk produk tetap.
10. Desain produk tetap.
11. Lokasi harus konsisten.
12. Waktu harus konsisten kecuali cerita berubah.
13. Arah karakter harus konsisten.
14. Posisi karakter harus masuk akal.
15. Kamera harus memiliki kontinuitas.
16. Camera angle harus realistis.
17. Camera position harus realistis.
18. Camera movement harus realistis.
19. Camera focus harus sesuai objek utama.
20. Gerakan tangan sesuai aktivitas.
21. Gerakan tubuh realistis.
22. Ekspresi sesuai situasi.
23. Scene berikutnya harus melanjutkan scene sebelumnya.
24. Jangan membuat objek muncul tiba-tiba.
25. Jangan membuat objek menghilang tiba-tiba.
26. Jika kendaraan digunakan di Indonesia,
    pengemudi berada di sisi kiri.
27. Steering wheel berada di sisi kiri.
28. Jangan membalik perspektif.
29. Scene pertama adalah pembuka.
30. Scene terakhir adalah penutup.
31. Gunakan bahasa Indonesia.
32. Jangan menggunakan markdown.
33. Jangan memberikan penjelasan di luar JSON.
34. JSON harus valid.
`;

            return await callGemini(
                res,
                instruction,
                "timeline"
            );
        }


        /*
        ==================================================
        ACTION: SINGLE SCENE
        ==================================================
        */

        if (action === "scene") {

            if (!scene) {

                return res.status(400).json({
                    error: "Data scene belum tersedia."
                });

            }

            const instruction = `
Anda adalah Prompt Director profesional
untuk Irisbela AI.

Buat prompt FINAL untuk satu scene video.

CHARACTER PROFILE:
${characterProfile || "Tidak tersedia"}

PRODUCT PROFILE:
${productProfile || "Tidak tersedia"}

GLOBAL SETTINGS:
${JSON.stringify(globalSettings || {}, null, 2)}

NEGATIVE PROMPT:
${negativePrompt || "Tidak tersedia"}

PREVIOUS SCENE:
${JSON.stringify(previousScene || {}, null, 2)}

CURRENT SCENE:
${JSON.stringify(scene, null, 2)}

Buat prompt video yang:

- photorealistic
- cinematic
- realistic
- detail
- konsisten
- siap digunakan AI video generator

WAJIB MENJELASKAN:

IDENTITAS:
- karakter
- wajah
- rambut
- tubuh
- outfit

PRODUK:
- bentuk
- warna
- material visual
- motif
- detail
- posisi produk

SCENE:
- lokasi
- waktu
- aktivitas
- posisi karakter
- gerakan tubuh
- gerakan tangan
- ekspresi

KAMERA:
- angle
- position
- movement
- focus
- framing
- perspektif

VISUAL:
- lighting
- visual style
- quality
- aspect ratio
- duration

AUDIO:
- dialogue
- voice

CONTINUITY:
- karakter sama
- wajah sama
- rambut sama
- outfit sama
- produk sama
- lokasi konsisten
- arah gerakan konsisten
- kamera konsisten

Jika menggunakan kendaraan Indonesia:

- pengemudi berada di sisi kiri
- steering wheel berada di sisi kiri
- posisi tangan sesuai steering wheel
- posisi tubuh realistis
- perspektif kamera tidak terbalik

JANGAN menulis:

"sama seperti scene sebelumnya"

Semua detail penting harus ditulis secara eksplisit.

Tambahkan negative instruction berikut:

${negativePrompt || "no face change, no outfit change, no product change, no distorted hands, no wrong perspective"}

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
        ACTION: GENERATE ALL
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
Anda adalah MASTER PROMPT DIRECTOR
untuk Irisbela AI.

Buat prompt FINAL untuk SEMUA scene.

Tujuan utama:

Membuat video yang terlihat seperti satu
rekaman berkelanjutan, bukan kumpulan gambar
yang dibuat secara terpisah.

==================================================
STORY
==================================================

${idea || "Tidak tersedia"}

==================================================
CHARACTER BIBLE
==================================================

${characterProfile || "Tidak tersedia"}

==================================================
PRODUCT BIBLE
==================================================

${productProfile || "Tidak tersedia"}

==================================================
GLOBAL VISUAL
==================================================

${JSON.stringify(globalSettings || {}, null, 2)}

==================================================
NEGATIVE PROMPT
==================================================

${negativePrompt || "Tidak tersedia"}

==================================================
TIMELINE
==================================================

${JSON.stringify(scenes, null, 2)}

==================================================

Kembalikan HANYA JSON VALID:

{
  "prompts": [
    {
      "sceneNumber": 1,
      "prompt": ""
    }
  ]
}

==================================================
CONTINUITY ENGINE
==================================================

SETIAP SCENE WAJIB MEMPERTAHANKAN:

IDENTITAS KARAKTER
- wajah
- bentuk wajah
- mata
- alis
- hidung
- bibir
- rambut
- warna kulit
- bentuk tubuh

OUTFIT
- pakaian
- warna
- motif
- model
- material visual
- aksesori

PRODUK
- bentuk
- ukuran relatif
- warna
- motif
- tekstur
- detail
- posisi

LINGKUNGAN
- lokasi
- background
- objek sekitar
- waktu
- kondisi cahaya

KAMERA
- posisi
- arah
- angle
- framing
- perspektif
- movement

==================================================
ATURAN
==================================================

1. Jumlah prompt harus sama dengan jumlah scene.

2. Nomor scene harus benar.

3. Setiap prompt harus standalone.

4. Jangan menggunakan kalimat:
   "sama seperti scene sebelumnya".

5. Tulis ulang detail karakter penting
   pada setiap scene.

6. Jangan mengubah wajah.

7. Jangan mengubah rambut.

8. Jangan mengubah bentuk tubuh.

9. Jangan mengubah outfit.

10. Jangan mengubah produk.

11. Jangan mengubah warna produk.

12. Jangan mengubah desain produk.

13. Jangan mengubah lokasi tanpa alasan cerita.

14. Jangan mengubah waktu secara tiba-tiba.

15. Jangan memindahkan karakter secara tiba-tiba.

16. Jangan membuat benda tiba-tiba muncul.

17. Jangan membuat benda tiba-tiba hilang.

18. Gerakan tangan harus realistis.

19. Gerakan tubuh harus realistis.

20. Ekspresi harus sesuai adegan.

21. Camera angle harus realistis.

22. Camera position harus realistis.

23. Camera movement harus realistis.

24. Camera focus harus sesuai objek utama.

25. Perspektif kamera harus konsisten.

26. Lighting harus konsisten.

27. Gunakan photorealistic.

28. Gunakan kualitas tinggi.

29. Sertakan aspect ratio.

30. Sertakan durasi.

31. Sertakan dialogue.

32. Sertakan voice.

33. Sertakan negative instruction.

34. Jika menggunakan kendaraan di Indonesia:
    pengemudi berada di sebelah kiri.

35. Steering wheel berada di sebelah kiri.

36. Jangan membalik arah kamera.

37. Jangan membuat anatomi tubuh tidak realistis.

38. Jangan membuat tangan tambahan.

39. Jangan membuat jari tambahan.

40. Jangan membuat karakter baru.

41. Jangan membuat produk baru.

42. Semua prompt menggunakan bahasa Indonesia.

43. Jangan menggunakan markdown.

44. Jangan memberikan penjelasan di luar JSON.

==================================================
FORMAT PROMPT SETIAP SCENE
==================================================

Setiap prompt harus memiliki struktur:

IDENTITAS KARAKTER:
...

OUTFIT:
...

PRODUK:
...

LOKASI:
...

AKTIVITAS:
...

GERAKAN:
...

EKSPRESI:
...

POSISI KARAKTER:
...

KAMERA:
...

PENCAHAYAAN:
...

VISUAL:
...

AUDIO:
...

CONTINUITY:
...

NEGATIVE:
...

`;

            return await callGemini(
                res,
                instruction,
                "generate_all"
            );
        }


        /*
        ==================================================
        UNKNOWN ACTION
        ==================================================
        */

        return res.status(400).json({
            error:
                "Action tidak dikenal."
        });


    } catch (error) {

        console.error(
            "TIMELINE ERROR:",
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
CALL GEMINI
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
        "Semua model gagal.";

    for (
        const model of models
    ) {

        try {

            console.log(
                "Gemini:",
                model,
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

                                                ? 12000

                                                : 5000

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

                console.error(
                    lastError
                );

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
                cleanGeminiResponse(
                    result
                );


            /*
            ==========================================
            TIMELINE
            ==========================================
            */

            if (
                action ===
                "timeline"
            ) {

                try {

                    const parsed =
                        parseGeminiJson(
                            result
                        );

                    if (
                        !parsed ||
                        !Array.isArray(
                            parsed.scenes
                        )
                    ) {

                        throw new Error(
                            "Scenes tidak ditemukan."
                        );

                    }

                    const requestedCount =
                        Math.max(
                            1,
                            Number(sceneCount) || 6
                        );

                    if (
                        parsed.scenes.length !==
                        requestedCount
                    ) {

                        throw new Error(
                            "Jumlah scene tidak sesuai permintaan. Diminta " +
                            requestedCount +
                            ", diterima " +
                            parsed.scenes.length +
                            "."
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
                        error?.message ||
                        "JSON timeline tidak valid.";

                    console.error(
                        "TIMELINE JSON ERROR:",
                        error
                    );

                    continue;

                }

            }


            /*
            ==========================================
            GENERATE ALL
            ==========================================
            */

            if (
                action ===
                "generate_all"
            ) {

                try {

                    const parsed =
                        parseGeminiJson(
                            result
                        );

                    if (
                        !parsed ||
                        !Array.isArray(
                            parsed.prompts
                        )
                    ) {

                        throw new Error(
                            "Prompts tidak ditemukan."
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
                        "JSON generate_all tidak valid.";

                    console.error(
                        result
                    );

                    continue;

                }

            }


            /*
            ==========================================
            SINGLE SCENE
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
                error
            );

        }

    }


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
CLEAN GEMINI RESPONSE
==================================================
*/

function cleanGeminiResponse(text) {
    let result = String(text ?? "")
        .replace(/^\uFEFF/, "")
        .trim();

    // Remove markdown code fences without assuming the model used them.
    result = result
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    // Extract the first complete JSON object, even when Gemini adds prose.
    const extracted = extractFirstJsonObject(result);
    if (extracted) return extracted;

    return result;
}

function extractFirstJsonObject(text) {
    const source = String(text ?? "");
    const start = source.indexOf("{");
    if (start === -1) return null;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < source.length; i++) {
        const ch = source[i];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (ch === "\\") {
                escaped = true;
            } else if (ch === '"') {
                inString = false;
            }
            continue;
        }

        if (ch === '"') {
            inString = true;
        } else if (ch === "{") {
            depth++;
        } else if (ch === "}") {
            depth--;
            if (depth === 0) {
                return source.slice(start, i + 1).trim();
            }
        }
    }

    return null;
}

function parseGeminiJson(text) {
    const cleaned = cleanGeminiResponse(text);

    try {
        return JSON.parse(cleaned);
    } catch (firstError) {
        // Gemini occasionally adds trailing commas. Remove only commas
        // immediately before } or ], then try once more.
        const repaired = cleaned.replace(/,\s*([}\]])/g, "$1");
        try {
            return JSON.parse(repaired);
        } catch (secondError) {
            throw new Error(
                "Respons Gemini bukan JSON valid: " +
                firstError.message
            );
        }
    }
}

