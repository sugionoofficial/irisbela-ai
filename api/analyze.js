export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method tidak diizinkan"
        });
    }

    try {

        const {
            image,
            mimeType,
            type
        } = req.body;

        if (!image) {
            return res.status(400).json({
                error: "Foto belum dikirim."
            });
        }

        let instruction = "";

        if (type === "character") {

            instruction = `
Analisis foto karakter ini untuk kebutuhan prompt gambar dan video AI.

Identifikasi secara visual:

- jenis kelamin
- perkiraan usia dewasa
- bentuk wajah
- warna kulit
- bentuk mata
- bentuk alis
- bentuk hidung
- bentuk bibir
- gaya dan warna rambut
- pakaian
- warna pakaian
- aksesori
- postur tubuh
- proporsi tubuh
- pose
- ekspresi
- sudut kamera
- pencahayaan
- lingkungan

Jangan mengarang informasi yang tidak terlihat.

Jangan menyebut identitas pribadi atau menebak nama orang.

Tulis hasil dalam bahasa Indonesia.

Buat deskripsi yang sangat berguna untuk prompt generator AI.
`;

        } else {

            instruction = `
Analisis foto produk ini untuk kebutuhan prompt gambar dan video AI.

Identifikasi secara visual:

- jenis produk
- bentuk
- warna
- motif
- bahan yang terlihat
- tekstur
- desain
- model
- jahitan yang terlihat
- detail produk
- logo atau tulisan yang terlihat
- aksesori produk
- ukuran relatif
- posisi produk
- kondisi pencahayaan
- background

Jangan mengarang informasi yang tidak terlihat.

Jika bahan atau detail tertentu tidak dapat dipastikan dari foto, katakan bahwa detail tersebut tidak dapat dipastikan.

Tulis hasil dalam bahasa Indonesia.

Buat deskripsi yang sangat berguna untuk prompt generator AI.
`;
        }


        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },

                body: JSON.stringify({

                    contents: [

                        {
                            parts: [
                                {
                                    text: instruction
                                }
                            ]
                        },

                        {
                            parts: [

                                {
                                    inlineData: {
                                        mimeType: mimeType,
                                        data: image
                                    }
                                }

                            ]
                        }

                    ]

                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            return res.status(response.status).json({

                error:
                    data.error?.message ||
                    "Gemini API error"

            });

        }


        const result =
            data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("\n")
            .trim();


        return res.status(200).json({

            result:
                result ||
                "Gemini tidak menghasilkan analisis."

        });


    } catch (error) {

        console.error(error);

        return res.status(500).json({

            error:
                "Terjadi kesalahan pada server."

        });

    }

}
