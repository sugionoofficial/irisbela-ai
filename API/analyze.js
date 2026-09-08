export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method tidak diizinkan."
        });
    }

    try {

        const {
            image,
            mimeType,
            type
        } = req.body || {};

        if (!image) {
            return res.status(400).json({
                error: "Foto belum dikirim."
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "GEMINI_API_KEY belum tersedia."
            });
        }


        let instruction;


        if (type === "character") {

            instruction = `
Anda adalah sistem analisis visual untuk Irisbela AI.

Analisis foto karakter secara sangat teliti.

HASIL WAJIB DALAM FORMAT BERIKUT:

[IDENTITAS VISUAL]
Deskripsikan karakter secara visual berdasarkan foto.

[WAJAH]
Bentuk wajah, mata, alis, hidung, bibir, pipi,
rahang, dagu dan ciri wajah yang terlihat.

[RAMBUT]
Warna, panjang, tekstur, gaya rambut dan posisi rambut.

[KULIT]
Warna kulit dan tekstur kulit yang terlihat.

[OUTFIT]
Jenis pakaian, model, warna, motif, potongan,
material yang terlihat dan detail pakaian.

[AKSESORI]
Perhiasan, tas, kacamata, jam tangan atau aksesori lain
yang terlihat.

[TUBUH DAN POSTUR]
Postur, posisi tubuh, posisi tangan, posisi kaki
dan bentuk tubuh yang terlihat secara visual.

[POSE]
Jelaskan posisi tubuh dan pose secara detail.

[EKSPRESI]
Ekspresi wajah dan arah pandangan.

[KAMERA]
Jenis framing, angle kamera, jarak kamera,
arah kamera dan perspektif.

[PENCAHAYAAN]
Sumber cahaya, arah cahaya, intensitas,
bayangan dan karakter pencahayaan.

[BACKGROUND]
Lokasi, objek latar belakang, warna,
lingkungan dan kondisi sekitar.

[DESKRIPSI PROMPT]
Gabungkan seluruh informasi visual penting menjadi
satu deskripsi karakter yang siap digunakan sebagai
character reference untuk AI image dan video generation.

ATURAN:

1. Hanya gunakan informasi yang terlihat.
2. Jangan menebak nama orang.
3. Jangan mengidentifikasi orang.
4. Jangan mengarang detail yang tidak terlihat.
5. Jangan menggunakan kata-kata yang terlalu umum.
6. Fokus pada konsistensi visual.
7. Gunakan bahasa Indonesia.
8. Jangan mengubah karakter menjadi karakter lain.
`;

        } else {

            instruction = `
Anda adalah sistem analisis produk untuk Irisbela AI.

Analisis foto produk secara sangat teliti.

HASIL WAJIB DALAM FORMAT BERIKUT:

[JENIS PRODUK]
Identifikasi jenis produk berdasarkan tampilan visual.

[MODEL DAN BENTUK]
Jelaskan model, bentuk, potongan dan konstruksi produk.

[WARNA]
Jelaskan warna utama dan warna tambahan.

[MOTIF]
Jelaskan motif, pola, cetakan atau desain permukaan.

[MATERIAL]
Jelaskan material yang terlihat.
Jika tidak dapat dipastikan, tulis:
"Material tidak dapat dipastikan secara visual."

[TEKSTUR]
Jelaskan tekstur permukaan yang terlihat.

[DETAIL PRODUK]
Jelaskan detail seperti kerah, lengan,
resleting, kancing, tali, jahitan,
lipatan dan bagian lainnya.

[LOGO DAN TULISAN]
Tuliskan logo atau tulisan yang benar-benar terlihat.
Jika tidak terlihat, tulis:
"Tidak terlihat."

[AKSESORI]
Jelaskan aksesori yang merupakan bagian dari produk.

[POSISI PRODUK]
Jelaskan posisi dan orientasi produk dalam foto.

[BACKGROUND]
Jelaskan background dan lingkungan.

[DESKRIPSI PROMPT]
Gabungkan seluruh informasi produk menjadi
deskripsi produk yang siap digunakan untuk AI
image dan video generation.

ATURAN:

1. Jangan mengarang spesifikasi.
2. Jangan mengarang bahan.
3. Jangan menebak merek jika tidak terlihat.
4. Jangan mengubah warna produk.
5. Jangan mengubah bentuk produk.
6. Pertahankan seluruh detail visual.
7. Gunakan bahasa Indonesia.
8. Fokus pada product consistency.
`;

        }


        /*
        =========================================
        MODEL FALLBACK
        =========================================
        */

        const models = [

            "gemini-3.6-flash",
            "gemini-3.7-flash",
            "gemini-3.8-flash",
            "gemini-3.5-flash-lite"

        ];


        let lastError =
            "Semua model gagal digunakan.";


        for (const model of models) {

            try {

                console.log(
                    "Mencoba:",
                    model
                );


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
                                        },

                                        {

                                            inlineData: {

                                                mimeType:
                                                mimeType ||
                                                "image/jpeg",

                                                data:
                                                image

                                            }

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


                const data =
                await response.json();


                if (response.ok) {

                    const result =

                        data
                        .candidates?.[0]
                        ?.content?.parts
                        ?.map(
                            part =>
                            part.text || ""
                        )
                        .join("\n")
                        .trim();


                    if (result) {

                        console.log(
                            "Berhasil:",
                            model
                        );


                        return res.status(200).json({

                            result: result,

                            model: model

                        });

                    }

                }


                lastError =
                    data.error?.message ||
                    `Model ${model} gagal.`;


                console.error(
                    model,
                    lastError
                );


                await new Promise(
                    resolve =>
                    setTimeout(
                        resolve,
                        700
                    )
                );


            } catch (error) {

                lastError =
                    error.message;

            }

        }


        return res.status(503).json({

            error:
            "Semua model Gemini sedang tidak tersedia.",

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
