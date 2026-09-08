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
                error: "GEMINI_API_KEY belum ditemukan di Vercel."
            });
        }


        let instruction;

        if (type === "character") {

            instruction = `
Analisis foto karakter ini secara visual untuk kebutuhan
generator prompt gambar dan video AI.

Buat deskripsi detail dalam bahasa Indonesia.

Analisis hanya informasi yang benar-benar terlihat.

Identifikasi:

- gender yang tampak
- perkiraan kelompok usia dewasa secara umum
- bentuk wajah
- warna kulit
- bentuk mata
- bentuk alis
- bentuk hidung
- bentuk bibir
- rambut
- warna rambut
- gaya rambut
- pakaian
- warna pakaian
- aksesori
- postur
- proporsi tubuh yang terlihat
- pose
- ekspresi
- arah tubuh
- arah pandangan
- angle kamera
- framing
- pencahayaan
- background
- lingkungan

Jangan menebak nama atau identitas pribadi.
Jangan mencoba mengenali siapa orang tersebut.
Jangan mengarang informasi yang tidak terlihat.

Fokus membuat deskripsi visual yang dapat digunakan
sebagai CHARACTER REFERENCE untuk AI image dan video.

Gunakan bahasa Indonesia yang jelas dan detail.
`;

        } else {

            instruction = `
Analisis foto produk ini secara visual untuk kebutuhan
generator prompt gambar dan video AI.

Buat deskripsi detail dalam bahasa Indonesia.

Analisis:

- jenis produk
- bentuk
- model
- warna
- kombinasi warna
- motif
- desain
- material yang terlihat
- tekstur
- jahitan yang terlihat
- pola
- detail permukaan
- aksesori
- logo atau tulisan yang terlihat
- bentuk bagian produk
- posisi produk
- kondisi produk
- pencahayaan
- background
- lingkungan

Jangan mengarang material yang tidak dapat dipastikan.
Jika material tidak dapat dipastikan dari foto,
katakan bahwa material tidak dapat dipastikan secara visual.

Jangan mengarang spesifikasi produk.

Fokus membuat PRODUCT REFERENCE yang berguna
untuk AI image dan video generation.

Gunakan bahasa Indonesia yang jelas dan detail.
`;

        }


        /*
        ============================================
        DAFTAR MODEL
        ============================================

        Sistem akan mencoba model satu per satu.

        Jika model pertama sedang overload,
        model berikutnya akan dicoba.
        */

        const models = [

            "gemini-3.8-flash",
            "gemini-3.7-flash",
            "gemini-2.5-flash"

        ];


        let lastError = "";


        for (const model of models) {

            try {

                console.log(
                    "Mencoba model:",
                    model
                );


                const response = await fetch(

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
                                            text: instruction
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

                            ]

                        })

                    }

                );


                const data =
                await response.json();


                /*
                ====================================
                JIKA BERHASIL
                ====================================
                */

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
                            "Berhasil menggunakan:",
                            model
                        );

                        return res.status(200).json({

                            result: result,

                            model: model

                        });

                    }

                }


                /*
                ====================================
                MODEL GAGAL
                ====================================
                */

                lastError =
                    data.error?.message ||
                    `Model ${model} gagal.`;


                console.error(
                    `Model ${model} gagal:`,
                    lastError
                );


                /*
                Tunggu sebentar sebelum
                mencoba model berikutnya.
                */

                await new Promise(
                    resolve =>
                    setTimeout(
                        resolve,
                        700
                    )
                );

            }

            catch (error) {

                lastError =
                    error.message;

                console.error(
                    `Error ${model}:`,
                    error
                );

            }

        }


        /*
        ============================================
        SEMUA MODEL GAGAL
        ============================================
        */

        return res.status(503).json({

            error:
            "Gemini sedang sibuk atau seluruh model analisis tidak tersedia. Coba kembali beberapa saat lagi.",

            detail:
            lastError

        });


    }

    catch (error) {

        console.error(
            "SERVER ERROR:",
            error
        );

        return res.status(500).json({

            error:
            error.message ||
            "Terjadi kesalahan pada server."

        });

    }

}
