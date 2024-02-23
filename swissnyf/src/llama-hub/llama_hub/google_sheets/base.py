"""Google sheets reader."""

import logging
import os
from typing import Any, List

from llama_index.readers.base import BaseReader
from llama_index.readers.schema.base import Document

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

logger = logging.getLogger(__name__)

# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


class GoogleSheetsReader(BaseReader):
    """Google Sheets reader.

    Reads a sheet as TSV from Google Sheets

    """

    def __init__(self) -> None:
        """Initialize with parameters."""
        try:
            import google  # noqa: F401
            import google_auth_oauthlib  # noqa: F401
            import googleapiclient  # noqa: F401
        except ImportError:
            raise ImportError(
                "`google_auth_oauthlib`, `googleapiclient` and `google` "
                "must be installed to use the GoogleSheetsReader.\n"
                "Please run `pip install --upgrade google-api-python-client "
                "google-auth-httplib2 google-auth-oauthlib`."
            )

    def load_data(self, spreadsheet_ids: List[str]) -> List[Document]:
        """Load data from the input directory.

        Args:
            spreadsheet_ids (List[str]): a list of document ids.
        """
        if spreadsheet_ids is None:
            raise ValueError('Must specify a "spreadsheet_ids" in `load_kwargs`.')

        results = []
        for spreadsheet_id in spreadsheet_ids:
            sheet = self._load_sheet(spreadsheet_id)
            results.append(
                Document(text=sheet, extra_info={"spreadsheet_id": spreadsheet_id})
            )
        return results

    def load_sheet_as_documents(
        self, spreadsheet_id: str, sheet_name: str, text_column_name: str = "text"
    ) -> List[Document]:
        """Load data from a Google Sheet and convert each row into a Document.

        Args:
            spreadsheet_id (str): The ID of the spreadsheet.
            sheet_name (str): The name of the sheet to be processed.
            text_column_name (str): The name of the column to be used for the "text" field (default is "text").

        Returns:
            List[Document]: A list of Document objects with "text" and "meta" fields.
        """
        import googleapiclient.discovery as discovery

        # Get the sheets service and data for the specified sheet.
        credentials = self._get_credentials()
        sheets_service = discovery.build("sheets", "v4", credentials=credentials)
        sheet_data = (
            sheets_service.spreadsheets()
            .values()
            .get(spreadsheetId=spreadsheet_id, range=sheet_name)
            .execute()
        )

        # Extract the rows and header.
        rows = sheet_data.get("values", [])
        header = rows.pop(0) if rows else []

        # Find the index of the column specified by text_column_name.
        try:
            text_col_index = header.index(text_column_name)
        except ValueError:
            raise ValueError(
                f'The sheet must contain a column named "{text_column_name}".'
            )

        # Process each row as a Document.
        documents = []
        for row in rows:
            text_value = row[text_col_index] if text_col_index < len(row) else ""
            # Create a dictionary for the rest of the row data to be used as metadata.
            meta = {
                key: value for key, value in zip(header, row) if key != text_column_name
            }
            documents.append(Document(text=text_value, meta=meta))

        return documents

    def _load_sheet(self, spreadsheet_id: str) -> str:
        """Load a sheet from Google Sheets.

        Args:
            spreadsheet_id: the sheet id.

        Returns:
            The sheet data.
        """
        import googleapiclient.discovery as discovery

        credentials = self._get_credentials()
        sheets_service = discovery.build("sheets", "v4", credentials=credentials)
        spreadsheet_data = (
            sheets_service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        )
        sheets = spreadsheet_data.get("sheets")
        sheet_text = ""

        for sheet in sheets:
            properties = sheet.get("properties")
            title = properties.get("title")
            sheet_text += title + "\n"
            grid_props = properties.get("gridProperties")
            rows = grid_props.get("rowCount")
            cols = grid_props.get("columnCount")
            range_pattern = f"R1C1:R{rows}C{cols}"
            response = (
                sheets_service.spreadsheets()
                .values()
                .get(spreadsheetId=spreadsheet_id, range=range_pattern)
                .execute()
            )
            sheet_text += (
                "\n".join(map(lambda row: "\t".join(row), response.get("values", [])))
                + "\n"
            )
        return sheet_text

    def _get_credentials(self) -> Any:
        """Get valid user credentials from storage.

        The file token.json stores the user's access and refresh tokens, and is
        created automatically when the authorization flow completes for the first
        time.

        Returns:
            Credentials, the obtained credential.
        """
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow

        creds = None
        if os.path.exists("token.json"):
            creds = Credentials.from_authorized_user_file("token.json", SCOPES)
        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    "credentials.json", SCOPES
                )
                creds = flow.run_local_server(port=0)
            # Save the credentials for the next run
            with open("token.json", "w") as token:
                token.write(creds.to_json())

        return creds


if __name__ == "__main__":
    reader = GoogleSheetsReader()
    logger.info(
        reader.load_data(
            spreadsheet_ids=["1VkuitKIyNmkoCJJDmEUmkS_VupSkDcztpRhbUzAU5L8"]
        )
    )
