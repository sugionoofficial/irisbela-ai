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

Fokus membuat deskripsi visual yang dapat langsung
digunakan sebagai CHARACTER REFERENCE untuk AI image
dan video generation.

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
gunakan kalimat "material tidak dapat dipastikan secara visual".

Jangan mengarang spesifikasi produk.

Fokus membuat PRODUCT REFERENCE yang sangat berguna
untuk AI image dan video generation.

Gunakan bahasa Indonesia yang jelas dan detail.
`;

        }


        const response = await fetch(

            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",

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


        if (!response.ok) {

            console.error(
                "Gemini error:",
                data
            );

            return res.status(
                response.status
            ).json({

                error:
                data.error?.message ||
                "Gemini API gagal."

            });

        }


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


        if (!result) {

            return res.status(500).json({

                error:
                "Gemini tidak menghasilkan analisis."

            });

        }


        return res.status(200).json({

            result: result

        });


    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            error:
            error.message ||
            "Terjadi kesalahan pada server."

        });

    }

}
