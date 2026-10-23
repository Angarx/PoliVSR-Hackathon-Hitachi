#!/usr/bin/env python3
"""Build the chatbot knowledge base offline; PDF extraction requires PyMuPDF (pymupdf)."""

from __future__ import annotations

import argparse
import json
import re
import statistics
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pymupdf


MAX_CHARS = 1200
TARGET_CHARS = 1000
SOURCES = [
    {
        "path": "README.md",
        "fonte": "README do dados_VSR",
        "kind": "markdown",
        "stop_before_heading": "## Histórico das versões",
    },
    {
        "path": "documentos/PoliVSR_Guia_Completo_do_Projeto.pdf",
        "fonte": "Guia Completo do Projeto PoliVSR",
        "kind": "pdf",
    },
    {
        "path": "documentos/PoliVSR_Relatorio_Metodologia.pdf",
        "fonte": "Relatório de Metodologia PoliVSR",
        "kind": "pdf",
    },
    {
        "path": "hackathon/VSR_nivelamento_tecnico.pdf",
        "fonte": "Nivelamento técnico sobre VSR",
        "kind": "pdf",
    },
    {
        "path": "lib/chatbot/site.md",
        "fonte": "Site PoliVSR",
        "kind": "markdown",
        "root": "repo",
    },
    {
        "path": "ia/01_quem-somos.md",
        "fonte": "Base curada PoliVSR (ia/)",
        "kind": "markdown",
        "peso": 1.5,
        "filter_competitors": True,
    },
    {
        "path": "ia/02_o-problema-e-o-vsr.md",
        "fonte": "Base curada PoliVSR (ia/)",
        "kind": "markdown",
        "peso": 1.5,
        "filter_competitors": True,
    },
    {
        "path": "ia/03_calculadora-o-custo-do-fixo.md",
        "fonte": "Base curada PoliVSR (ia/)",
        "kind": "markdown",
        "peso": 1.5,
        "filter_competitors": True,
    },
    {
        "path": "ia/04_intencoes-sin-e-roadmap.md",
        "fonte": "Base curada PoliVSR (ia/)",
        "kind": "markdown",
        "peso": 1.5,
        "filter_competitors": True,
    },
    {
        "path": "ia/05_perguntas-frequentes.md",
        "fonte": "Base curada PoliVSR (ia/)",
        "kind": "markdown",
        "peso": 1.5,
        "split_faq": True,
        "filter_competitors": True,
    },
    {
        "path": "ia/06_glossario-e-numeros.md",
        "fonte": "Base curada PoliVSR (ia/)",
        "kind": "markdown",
        "peso": 1.5,
        "filter_competitors": True,
    },
]
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "lib/chatbot/base.json"
COMPETITOR_NAME_RE = re.compile(
    r"\b(?:Siemens|Vernova|General Electric|Hyundai|CHINT|Trench|Toshiba|Hyosung|Kon[cč]ar|Reinhausen|Maschinenfabrik|Mitsubishi|TBEA)\b",
    re.IGNORECASE,
)
COMPETITOR_ACRONYM_RE = re.compile(r"\b(?:GE|WEG|ABB|BTW)\b")


def remove_competitor_sentences(text: str) -> str:
    paragraphs = re.split(r"\n\s*\n", text)
    filtered_paragraphs = []
    for paragraph in paragraphs:
        sentences = re.split(r"(?<=[.!?])\s+", paragraph)
        remaining = [
            sentence.strip()
            for sentence in sentences
            if sentence.strip()
            and not COMPETITOR_NAME_RE.search(sentence)
            and not COMPETITOR_ACRONYM_RE.search(sentence)
        ]
        if remaining:
            filtered_paragraphs.append(" ".join(remaining))
    return "\n\n".join(filtered_paragraphs)


@dataclass
class Paragraph:
    texto: str
    page: int | None = None
    heading: str | None = None


def strip_emoji(text: str) -> str:
    def is_emoji(character: str) -> bool:
        codepoint = ord(character)
        return (
            0x1F000 <= codepoint <= 0x1FAFF
            or 0x1F1E6 <= codepoint <= 0x1F1FF
            or 0x2600 <= codepoint <= 0x27BF
            or codepoint in (0x200D, 0x20E3, 0xFE0E, 0xFE0F)
        )

    return "".join(character for character in text if not is_emoji(character))


def clean_markdown(text: str) -> str:
    text = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = strip_emoji(text)
    text = re.sub(r"(?m)^\s{0,3}#{1,6}\s+", "", text)
    text = re.sub(r"(?m)^\s*>\s?", "", text)
    text = re.sub(r"(?m)^\s*[-*+]\s+", "• ", text)
    text = re.sub(r"(?m)^\s*(?:-{3,}|\*{3,}|_{3,})\s*$", "", text)
    text = re.sub(r"[*_`~]", "", text)
    return text.strip()


def split_long_paragraph(text: str) -> list[str]:
    if len(text) <= MAX_CHARS:
        return [text]

    sentences = re.split(r"(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9“\"'])", text)
    pieces: list[str] = []
    current = ""
    for sentence in sentences:
        if len(sentence) <= MAX_CHARS:
            combined = f"{current} {sentence}".strip()
            if current and len(combined) > MAX_CHARS:
                pieces.append(current)
                current = sentence
            else:
                current = combined
            continue

        if current:
            pieces.append(current)
            current = ""
        words = sentence.split()
        word_chunk = ""
        for word in words:
            combined = f"{word_chunk} {word}".strip()
            if word_chunk and len(combined) > MAX_CHARS:
                pieces.append(word_chunk)
                word_chunk = word
            elif len(word) > MAX_CHARS:
                if word_chunk:
                    pieces.append(word_chunk)
                    word_chunk = ""
                pieces.extend(word[index:index + MAX_CHARS] for index in range(0, len(word), MAX_CHARS))
            else:
                word_chunk = combined
        if word_chunk:
            current = word_chunk

    if current:
        pieces.append(current)
    return pieces


def pack_paragraphs(paragraphs: list[Paragraph]) -> list[tuple[str, int | None, str | None]]:
    chunks: list[tuple[str, int | None, str | None]] = []
    current: list[str] = []
    current_length = 0
    first_page: int | None = None
    first_heading: str | None = None

    def flush() -> None:
        nonlocal current, current_length, first_page, first_heading
        if current:
            chunks.append(("\n\n".join(current), first_page, first_heading))
        current = []
        current_length = 0
        first_page = None
        first_heading = None

    for paragraph in paragraphs:
        for piece in split_long_paragraph(paragraph.texto):
            separator_length = 2 if current else 0
            if current and current_length + separator_length + len(piece) > MAX_CHARS:
                flush()
            if not current:
                first_page = paragraph.page
                first_heading = paragraph.heading
            current.append(piece)
            current_length += (2 if len(current) > 1 else 0) + len(piece)
            if current_length >= TARGET_CHARS:
                flush()
    flush()
    return chunks


def markdown_sections(text: str, file_path: Path, stop_before_heading: str | None) -> list[tuple[str, str]]:
    if stop_before_heading:
        text = re.split(
            rf"(?m)^{re.escape(stop_before_heading)}[^\n]*(?:\n|$)",
            text,
            maxsplit=1,
        )[0]

    matches = list(re.finditer(r"(?m)^#{2,3}\s+(.+?)\s*$", text))
    sections: list[tuple[str, str]] = []
    if not matches:
        return [(file_path.stem, text)]

    if matches[0].start() > 0:
        sections.append((file_path.stem, text[:matches[0].start()]))

    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        sections.append((match.group(1), text[match.end():end]))
    return sections


def markdown_chunks(
    path: Path,
    fonte: str,
    source_index: int,
    stop_before_heading: str | None,
    peso: float | None = None,
    split_faq: bool = False,
    filter_competitors: bool = False,
) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    if split_faq:
        questions = list(re.finditer(r"(?m)^[ \t]*\*\*(\d+)\.[ \t]+(.+?)\*\*[ \t]*$", text))
        section_headings = [
            match.start()
            for match in re.finditer(r"(?m)^##[ \t]+", text)
        ]
        chunks: list[dict[str, Any]] = []
        for question_index, match in enumerate(questions, start=1):
            next_boundaries = [
                boundary
                for boundary in (
                    questions[question_index].start() if question_index < len(questions) else None,
                    next((heading for heading in section_headings if heading > match.start()), None),
                )
                if boundary is not None
            ]
            end = min(next_boundaries, default=len(text))
            title = clean_markdown(match.group(2)).strip()
            answer = clean_markdown(text[match.end():end]).strip()
            chunk = {
                "id": f"{source_index}-{question_index}-1",
                "titulo": title,
                "fonte": fonte,
                "texto": f"{title}\n\n{answer}" if answer else title,
            }
            if filter_competitors:
                chunk["texto"] = remove_competitor_sentences(chunk["texto"])
            if peso is not None:
                chunk["peso"] = peso
            chunks.append(chunk)
        return chunks

    chunks: list[dict[str, Any]] = []
    section_index = 0
    for section_title, section_text in markdown_sections(text, path, stop_before_heading):
        cleaned_title = clean_markdown(section_title)
        paragraphs = [
            Paragraph(paragraph.strip())
            for paragraph in re.split(r"\n\s*\n", clean_markdown(section_text))
            if paragraph.strip()
        ]
        section_chunks = pack_paragraphs(paragraphs)
        for chunk_index, (chunk_text, _, _) in enumerate(section_chunks, start=1):
            if filter_competitors:
                chunk_text = remove_competitor_sentences(chunk_text)
                if not chunk_text:
                    continue
            title = cleaned_title
            if len(section_chunks) > 1:
                title = f"{title} · Parte {chunk_index}"
            chunk = {
                "id": f"{source_index}-{section_index}-{chunk_index}",
                "titulo": title,
                "fonte": fonte,
                "texto": chunk_text,
            }
            if peso is not None:
                chunk["peso"] = peso
            chunks.append(chunk)
        section_index += 1
    return chunks


def normalize_line(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().casefold()


def is_page_number(text: str) -> bool:
    return bool(re.fullmatch(
        r"\s*(?:\d{1,4}|[ivxlcdm]{1,8}|\d{1,4}\s*/\s*\d{1,4})\s*",
        text,
        re.IGNORECASE,
    ))


def join_pdf_lines(lines: list[str]) -> str:
    joined = ""
    for line in lines:
        line = line.translate(str.maketrans({
            "\ufb00": "ff",
            "\ufb01": "fi",
            "\ufb02": "fl",
            "\ufb03": "ffi",
            "\ufb04": "ffl",
        })).strip()
        if not line:
            continue
        if joined.endswith("-") and line[:1].isalpha():
            joined = joined[:-1] + line
        else:
            joined = f"{joined} {line}".strip()
    return joined


def append_pdf_paragraph(
    paragraphs: list[Paragraph],
    text: str,
    page_number: int,
    heading: str | None,
) -> None:
    if not text:
        return

    if paragraphs:
        previous = paragraphs[-1]
        previous_text = previous.texto.rstrip()
        starts_lowercase = text[:1].islower()
        if (
            previous.heading == heading
            and not previous_text.endswith((".", ":", ";", "?", "!"))
            and starts_lowercase
        ):
            if previous_text.endswith("-"):
                previous.texto = f"{previous_text[:-1]}{text}"
            else:
                previous.texto = f"{previous_text} {text}"
            return

    paragraphs.append(Paragraph(text, page_number, heading))


def pdf_paragraphs(path: Path) -> list[Paragraph]:
    document = pymupdf.open(path)
    pages: list[list[list[dict[str, Any]]]] = []
    line_page_counts: Counter[str] = Counter()

    for page in document:
        page_blocks: list[list[dict[str, Any]]] = []
        page_lines: set[str] = set()
        blocks = sorted(
            page.get_text("dict").get("blocks", []),
            key=lambda block: (block.get("bbox", [0, 0])[1], block.get("bbox", [0, 0])[0]),
        )
        for block in blocks:
            if "lines" not in block:
                continue
            records: list[dict[str, Any]] = []
            for line in block["lines"]:
                spans = line.get("spans", [])
                text = "".join(span.get("text", "") for span in spans).strip()
                if not text:
                    continue
                record = {
                    "text": text,
                    "size": max((float(span.get("size", 0)) for span in spans), default=0),
                }
                records.append(record)
                normalized = normalize_line(text)
                if normalized:
                    page_lines.add(normalized)
            if records:
                page_blocks.append(records)
        for line in page_lines:
            line_page_counts[line] += 1
        pages.append(page_blocks)

    page_count = len(pages)
    repeated_headers_and_footers = {
        line for line, count in line_page_counts.items()
        if page_count and count / page_count > 0.4
    }

    paragraphs: list[Paragraph] = []
    current_heading: str | None = None
    for page_number, page_blocks in enumerate(pages, start=1):
        page_lines = [
            record
            for block in page_blocks
            for record in block
            if normalize_line(record["text"]) not in repeated_headers_and_footers
            and not is_page_number(record["text"])
        ]
        font_median = statistics.median([line["size"] for line in page_lines]) if page_lines else 0

        for block in page_blocks:
            body_lines: list[str] = []
            for record in block:
                text = record["text"].strip()
                if normalize_line(text) in repeated_headers_and_footers or is_page_number(text):
                    continue
                is_heading = (
                    font_median > 0
                    and len(text) <= 140
                    and record["size"] >= font_median * 1.16
                )
                if is_heading:
                    if body_lines:
                        append_pdf_paragraph(
                            paragraphs,
                            join_pdf_lines(body_lines),
                            page_number,
                            current_heading,
                        )
                        body_lines = []
                    current_heading = strip_emoji(text).strip()
                else:
                    body_lines.append(text)
            append_pdf_paragraph(
                paragraphs,
                join_pdf_lines(body_lines),
                page_number,
                current_heading,
            )

    document.close()
    return paragraphs


def pdf_chunks(path: Path, fonte: str, source_index: int) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    for chunk_index, (chunk_text, page, heading) in enumerate(pack_paragraphs(pdf_paragraphs(path)), start=1):
        page_number = page or 1
        title = f"{heading} (p. {page_number})" if heading else f"{fonte}, p. {page_number}"
        chunks.append({
            "id": f"{source_index}-{chunk_index}",
            "titulo": title,
            "fonte": fonte,
            "texto": chunk_text,
        })
    return chunks


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the chatbot knowledge base from dados_VSR.")
    parser.add_argument("dados_vsr", type=Path, help="Path to the read-only dados_VSR checkout")
    args = parser.parse_args()
    root = args.dados_vsr.expanduser().resolve()
    base: list[dict[str, Any]] = []
    counts: Counter[str] = Counter()

    for source_index, source in enumerate(SOURCES):
        source_root = Path(__file__).resolve().parents[1] if source.get("root") == "repo" else root
        path = source_root / source["path"]
        if source["kind"] == "pdf":
            chunks = pdf_chunks(path, source["fonte"], source_index)
        else:
            chunks = markdown_chunks(
                path,
                source["fonte"],
                source_index,
                source.get("stop_before_heading"),
                source.get("peso"),
                source.get("split_faq", False),
                source.get("filter_competitors", False),
            )
        base.extend(chunks)
        counts[source["fonte"]] += len(chunks)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(base, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Base gerada em {OUTPUT_PATH}: {len(base)} trechos")
    for fonte, count in counts.items():
        print(f"{fonte}: {count} trechos")


if __name__ == "__main__":
    main()
