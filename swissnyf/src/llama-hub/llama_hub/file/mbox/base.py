"""Mbox parser.

Contains simple parser for mbox files.

"""
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from llama_index.readers.base import BaseReader
from llama_index.readers.schema.base import Document


class MboxReader(BaseReader):
    """Mbox reader.

    Extract messages from mailbox files.
    Returns string including date, subject, sender, receiver and
    content for each message.

    """

    DEFAULT_MESSAGE_FORMAT: str = (
        "Date: {_date}\n"
        "From: {_from}\n"
        "To: {_to}\n"
        "Subject: {_subject}\n"
        "Content: {_content}"
    )

    def __init__(
        self,
        *args: Any,
        max_count: int = 0,
        message_format: str = DEFAULT_MESSAGE_FORMAT,
        id_fn: Optional[Callable[[str], str]] = None,
        **kwargs: Any
    ) -> None:
        """Init params."""
        super().__init__(*args, **kwargs)
        self.max_count = max_count
        self.message_format = message_format
        self.id_fn = id_fn

    def parse_file(self, filepath: Path, errors: str = "ignore") -> List[str]:
        """Parse file into string."""
        # Import required libraries
        import mailbox
        from email.parser import BytesParser
        from email.policy import default

        from bs4 import BeautifulSoup

        i = 0
        results: List[str] = []
        # Load file using mailbox
        bytes_parser = BytesParser(policy=default).parse
        mbox = mailbox.mbox(filepath, factory=bytes_parser)  # type: ignore

        # Iterate through all messages
        for _, _msg in enumerate(mbox):
            msg: mailbox.mboxMessage = _msg
            # Parse multipart messages

            content = None

            if msg.is_multipart():
                for part in msg.walk():
                    ctype = part.get_content_type()
                    cdispo = str(part.get("Content-Disposition"))
                    if ctype == "text/plain" and "attachment" not in cdispo:
                        content = part.get_payload(decode=True)  # decode
                        break
            # Get plain message payload for non-multipart messages
            else:
                content = msg.get_payload(decode=True)

            if not content:
                print(
                    "WARNING llama_hub.file.mbox found messages with content that"
                    " stayed None. Skipping entry..."
                )
                continue

            # Parse message HTML content and remove unneeded whitespace
            soup = BeautifulSoup(content)
            stripped_content = " ".join(soup.get_text().split())
            # Format message to include date, sender, receiver and subject
            msg_string = self.message_format.format(
                _date=msg["date"],
                _from=msg["from"],
                _to=msg["to"],
                _subject=msg["subject"],
                _content=stripped_content,
            )
            # Add message string to results
            results.append(msg_string)
            # Increment counter and return if max count is met
            i += 1
            if self.max_count > 0 and i >= self.max_count:
                break
        return results

    def load_data(
        self, file: Path, extra_info: Optional[Dict] = None
    ) -> List[Document]:
        """Load data from the input directory.

        load_kwargs:
            max_count (int): Maximum amount of messages to read.
            message_format (str): Message format overriding default.
        """
        docs: List[Document] = []
        content = self.parse_file(file)
        for msg in content:
            d = Document(text=msg, extra_info=extra_info or {})
            if self.id_fn:
                d.doc_id = self.id_fn(msg)
            docs.append(d)

        return docs
