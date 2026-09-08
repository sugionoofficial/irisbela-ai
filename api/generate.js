export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method tidak diizinkan"
        });
    }

    try {

        const {
            description,
            output,
            duration,
            camera,
            lighting,
            location,
            style
        } = req.body;

        if (!description) {
            return res.status(400).json({
                error: "Deskripsi belum diisi."
            });
        }

        const prompt = `
Kamu adalah Irisbela AI.

Kamu adalah ahli prompt engineering
untuk generator gambar dan video AI.

Buat prompt profesional berdasarkan data berikut.

DESKRIPSI ADEGAN:
${description}

JENIS OUTPUT:
${output}

DURASI:
${duration}

ANGLE KAMERA:
${camera}

PENCAHAYAAN:
${lighting}

LOKASI:
${location}

GAYA VISUAL:
${style}

Buat hasil dalam bahasa Indonesia.

HASIL:

1. PROMPT UTAMA
2. DETAIL KARAKTER
3. DETAIL PRODUK
4. AKSI / GERAKAN
5. KAMERA
6. PENCAHAYAAN
7. LINGKUNGAN
8. KUALITAS VISUAL
9. NEGATIVE PROMPT

Jika output adalah video,
jelaskan gerakan karakter,
gerakan kamera, ekspresi,
kontinuitas adegan dan durasi.

Hasil harus detail, realistis,
dan siap digunakan pada generator AI.
`;

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.OPENAI_API_KEY}`
                },

                body: JSON.stringify({
                    model: "gpt-5.6-luna",
                    input: prompt
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error:
                    data.error?.message ||
                    "OpenAI API error"
            });
        }

        return res.status(200).json({
            result: data.output_text
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error:
                "Terjadi kesalahan pada server."
        });
    }
}
