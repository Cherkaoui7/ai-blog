from pathlib import Path
import sys

from pypdf import PdfReader


PAGE_WIDTH = 595.2756
PAGE_HEIGHT = 841.8898


def pdf_obj(index: int, payload: bytes) -> bytes:
    return f"{index} 0 obj\n".encode("ascii") + payload + b"\nendobj\n"


def build_pdf(jpeg_bytes: bytes, image_width: int, image_height: int) -> bytes:
    content_stream = (
        b"q\n"
        + f"{PAGE_WIDTH:.4f} 0 0 {PAGE_HEIGHT:.4f} 0 0 cm\n".encode("ascii")
        + b"/Im0 Do\nQ\n"
    )

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH:.4f} {PAGE_HEIGHT:.4f}] "
            "/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>"
        ).encode("ascii"),
        b"<< /Length " + str(len(content_stream)).encode("ascii") + b" >>\nstream\n" + content_stream + b"endstream",
        (
            f"<< /Type /XObject /Subtype /Image /Width {image_width} /Height {image_height} "
            "/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "
            f"{len(jpeg_bytes)} >>"
        ).encode("ascii")
        + b"\nstream\n"
        + jpeg_bytes
        + b"\nendstream",
    ]

    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]

    for index, payload in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(pdf_obj(index, payload))

    xref_offset = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    output.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        ).encode("ascii")
    )

    return bytes(output)


def main() -> None:
    if len(sys.argv) != 5:
        raise SystemExit("usage: embed-jpeg-in-pdf.py <input.jpg> <output.pdf> <width> <height>")

    jpeg_path = Path(sys.argv[1])
    pdf_path = Path(sys.argv[2])
    image_width = int(sys.argv[3])
    image_height = int(sys.argv[4])

    jpeg_bytes = jpeg_path.read_bytes()
    pdf_bytes = build_pdf(jpeg_bytes, image_width, image_height)
    pdf_path.write_bytes(pdf_bytes)

    reader = PdfReader(str(pdf_path))
    if len(reader.pages) != 1:
        raise RuntimeError("expected a single-page PDF")


if __name__ == "__main__":
    main()
