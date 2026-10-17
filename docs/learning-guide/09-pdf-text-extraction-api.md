# LUNA API: Extracting Text from a PDF Page

This guide explains the on-demand PDF page text endpoint added to LUNA.

## Endpoint

`GET /api/books/{book_id}/text?page=1`

Example URL when LUNA is running locally:

`http://127.0.0.1:8000/api/books/1/text?page=1`

Replace `1` with a real book ID from `GET /api/books`. The `page` parameter is 1-based: page 1 is the first page.

## Example response

```json
{
  "book_id": 1,
  "title": "Example Book",
  "page": 1,
  "page_count": 12,
  "text": "Text extracted from the first page.",
  "has_text": true,
  "message": null
}
```

The title and page count come from the registered PDF. `text` is the selectable text that pypdf can extract from that page. `has_text` makes it easy for a future reader or audiobook feature to detect whether text was found. If a page has no selectable text, the endpoint returns an empty string and a message explaining that it may be a scanned image.

## How the request works

1. FastAPI receives the book ID and requested page number.
2. `get_book_by_id` looks up the registered book in SQLite. Unknown IDs return HTTP 404.
3. `resolve_registered_pdf` obtains the stored filename and resolves it under `local-data/books/`.
4. `is_path_within_directory` checks the resolved path to prevent reading a file outside the books directory.
5. `pypdf.PdfReader` opens the local PDF.
6. `extract_page_text` checks the page number, reads just the requested page's text, and trims surrounding whitespace.
7. FastAPI returns JSON. Nothing is uploaded to a cloud service.

## Errors and limitations

- HTTP 404: the book does not exist, the stored PDF is missing, or the requested page is outside the PDF's page count.
- HTTP 422: the PDF is encrypted in a way LUNA cannot unlock or text extraction fails.
- A scanned page may return no text because it contains an image of words, not a selectable text layer. OCR is not implemented.
- The endpoint extracts text on demand and does not yet save the extracted text in SQLite.
- The endpoint is not yet connected to the Reader UI or audiobook player. It is a backend foundation for those future features, not working text-to-speech.

## Try it manually

1. Start the backend using the command in the main README.
2. Open `http://127.0.0.1:8000/docs` in your browser.
3. Expand `GET /api/books` and execute it to find an imported book ID.
4. Expand `GET /api/books/{book_id}/text`, enter that ID and page `1`, then execute it.
5. Inspect `text`, `has_text`, and `page_count` in the JSON response.

## Tests

`backend/tests/test_pdf_text_extraction.py` checks that page numbering is 1-based, whitespace is trimmed, missing selectable text becomes an empty string, and invalid page numbers are rejected.
