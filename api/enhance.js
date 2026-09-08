export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method tidak diizinkan."
        });

    }

    try {

        const { prompt } =
            req.body || {};

        if (!prompt) {

            return res.status(400).json({
                error: "Prompt belum dikirim."
            });

        }

        if (!process.env.GEMINI_API_KEY) {

            return res.status(500).json({
                error: "GEMINI_API_KEY belum tersedia."
            });

        }


        const instruction = `

Anda adalah AI Prompt Engineer untuk Irisbela AI.

Perbaiki prompt berikut agar lebih akurat untuk
image generation dan video generation.

PERTAHANKAN SEMUA INFORMASI PENTING.

Jangan mengubah:

- identitas karakter
- wajah
- rambut
- outfit
- produk
- warna produk
- desain produk
- lokasi
- angle kamera
- posisi kamera
- aksi utama
- ekspresi
- rasio
- durasi

Perbaiki konflik logika.

Contoh konflik yang harus diperbaiki:

- kamera menghadap depan tetapi karakter menghadap arah yang salah
- posisi tangan tidak sesuai
- kaki tidak sesuai dengan pose
- kemudi mobil berada di sisi yang salah
- perspektif kamera tidak sesuai
- karakter berubah wajah
- produk berubah bentuk
- pakaian berubah
- objek muncul tiba-tiba
- gerakan tidak realistis

Buat prompt menjadi:

- jelas
- terstruktur
- detail
- realistis
- konsisten
- mudah dipahami AI image/video generator

Jangan memberikan penjelasan.

Keluarkan HANYA prompt final.

PROMPT:

${prompt}

`;


        const models = [

            "gemini-3.6-flash",
            "gemini-3.7-flash",
            "gemini-3.8-flash",
            "gemini-3.5-flash-lite"

        ];


        let lastError =
            "Semua model gagal.";


        for (
            const model of models
        ) {

            try {

                const response =
                await fetch(

                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                            "application/json",

                            "x-goog-api-key":
                            process.env.GEMINI_API_KEY

                        },

                        body:JSON.stringify({

                            contents:[

                                {

                                    parts:[

                                        {
                                            text:
                                            instruction
                                        }

                                    ]

                                }

                            ],

                            generationConfig:{

                                temperature:0.2,

                                maxOutputTokens:4000

                            }

                        })

                    }

                );


                const data =
                await response.json();


                if(response.ok){

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


                    if(result){

                        return res.status(
                            200
                        ).json({

                            result:result,

                            model:model

                        });

                    }

                }


                lastError =
                data.error?.message ||
                `Model ${model} gagal.`;


                await new Promise(
                    resolve =>
                    setTimeout(
                        resolve,
                        700
                    )
                );

            }

            catch(error){

                lastError =
                error.message;

            }

        }


        return res.status(
            503
        ).json({

            error:
            "AI Enhance tidak tersedia saat ini.",

            detail:
            lastError

        });


    }

    catch(error){

        console.error(error);

        return res.status(
            500
        ).json({

            error:
            error.message ||
            "Terjadi kesalahan server."

        });

    }

}
