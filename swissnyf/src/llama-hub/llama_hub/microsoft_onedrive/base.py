"""OneDrive files reader"""

import logging
import os
import tempfile
import requests
import time
from typing import Any, List, Dict, Optional

from llama_index import download_loader
from llama_index.readers.base import BaseReader
from llama_index.readers.schema.base import Document


logger = logging.getLogger(__name__)

# Scope for reading and downloading OneDrive files
SCOPES = ["Files.Read.All"]
CLIENTCREDENTIALSCOPES = ["https://graph.microsoft.com/.default"]


class OneDriveReader(BaseReader):
    """Microsoft OneDrive reader."""

    def __init__(
        self,
        client_id: str,
        client_secret: Optional[str] = None,
        tenant_id: str = "consumers",
    ) -> None:
        """
        Initializes a new instance of the OneDriveReader.

        :param client_id: The Application (client) ID for the app registered in the Azure Entra (formerly Azure Active directory) portal with MS Graph permission "Files.Read.All".
        :param tenant_id: The Directory (tenant) ID of the Azure Active Directory (AAD) tenant the app is registered with.
                          Defaults to "consumers" for multi-tenant applications and onderive personal.
        :param client_secret: The Application Secret for the app registered in the Azure portal.
                              If provided, the MSAL client credential flow will be used for authentication (ConfidentialClientApplication).
                              If not provided, interactive authentication will be used (Not recommended for CI/CD or scenarios where manual interaction for authentication is not feasible).

        For interactive authentication to work, a browser is used to authenticate, hence the registered application should have a redirect URI set to 'https://localhost'
        for mobile and native applications.
        """
        self.client_id = client_id
        self.tenant_id = tenant_id
        self.client_secret = client_secret
        self._is_interactive_auth = False if self.client_secret else True

    def _authenticate_with_msal(self) -> Any:
        """Authenticate with MSAL.

           For interactive authentication to work, a browser is used to authenticate, hence the registered application should have a redirect URI set to 'localhost'
        for mobile and native applications.
        """
        import msal

        self._authority = f"https://login.microsoftonline.com/{self.tenant_id}/"
        result = None

        if self._is_interactive_auth:
            logger.debug("Starting user authentication...")
            app = msal.PublicClientApplication(
                self.client_id, authority=self._authority
            )

            # The acquire_token_interactive method will open the default web browser
            # for the interactive part of the OAuth2 flow. The registered application should have a redirect URI set to 'https://localhost'
            # under mobile and native applications.
            result = app.acquire_token_interactive(SCOPES)
        else:
            logger.debug("Starting app autheetication...")
            app = msal.ConfidentialClientApplication(
                self.client_id,
                authority=self._authority,
                client_credential=self.client_secret,
            )

            result = app.acquire_token_for_client(scopes=CLIENTCREDENTIALSCOPES)

        if "access_token" in result:
            logger.debug("Authentication is successfull...")
            return result["access_token"]
        else:
            logger.error(result.get("error"))
            logger.error(result.get("error_description"))
            logger.error(result.get("correlation_id"))
            raise Exception(result.get("error"))

    def _construct_endpoint(
        self,
        item_ref: str,
        isRelativePath: bool,
        isFile: bool,
        userprincipalname: Optional[str] = None,
    ) -> str:
        """
        Constructs the appropriate OneDrive API endpoint based on the provided parameters.

        Parameters:
            item_ref (str): The reference to the item; could be an item ID or a relative path.
            isRelativePath (bool): A boolean indicating whether the item_ref is a relative path.
            isFile (bool): A boolean indicating whether the target is a file.
            userprincipalname (str, optional): The user principal name; used if authentication is not interactive. Defaults to None.

        Returns:
            str: A string representing the constructed endpoint.
        """

        if not self._is_interactive_auth and not userprincipalname:
            raise Exception(
                "userprincipalname cannot be empty for App authentication. Provide the userprincipalname (email mostly) of user whose OneDrive needs to be accessed"
            )

        endpoint = "https://graph.microsoft.com/v1.0/"

        # Update the base endpoint based on the authentication method
        if self._is_interactive_auth:
            endpoint += "me/drive"
        else:
            endpoint += f"users/{userprincipalname}/drive"

        # Update the endpoint for relative paths or item IDs
        if isRelativePath:
            endpoint += f"/root:/{item_ref}"
        else:
            endpoint += f"/items/{item_ref}"

        # If the target is not a file, adjust the endpoint to retrieve children of a folder
        if not isFile:
            endpoint += ":/children" if isRelativePath else "/children"

        logger.info(f"API Endpoint determined: {endpoint}")

        return endpoint

    def _get_items_in_drive_with_maxretries(
        self,
        access_token: str,
        item_ref: Optional[str] = "root",
        max_retries: int = 3,
        userprincipalname: Optional[str] = None,
        isFile: bool = False,
        isRelativePath=False,
    ) -> Any:
        """
        Retrieves items from a drive using Microsoft Graph API.

        Parameters:
        access_token (str): Access token for API calls.
        item_ref (Optional[str]): Specific item ID/path or root for root folder.
        max_retries (int): Max number of retries on rate limit or server errors.
        userprincipalname: str value indicating the userprincipalname(normally organization provided email id) whose ondrive needs to be accessed. Mandatory for App authentication scenarios.
        isFile: bool value to indicate if to query file or folder
        isRelativePath: bool value to indicate if to query file or folder using relative path
        Returns:
        dict/None: JSON response or None after max retries.

        Raises:
        Exception: On non-retriable status code.
        """

        endpoint = self._construct_endpoint(
            item_ref, isRelativePath, isFile, userprincipalname
        )
        headers = {"Authorization": f"Bearer {access_token}"}
        retries = 0

        while retries < max_retries:
            response = requests.get(endpoint, headers=headers)
            if response.status_code == 200:
                return response.json()
            # Check for Ratelimit error, this can happen if you query endpoint recursively
            # very frequently for large amount of file
            elif response.status_code in (429, *range(500, 600)):
                logger.warning(
                    f"Retrying {retries+1} in {retries+1} secs. Status code: {response.status_code}"
                )
                retries += 1
                time.sleep(retries)  # Exponential back-off
            else:
                raise Exception(
                    f"API request to download {item_ref} failed with status code: {response.status_code}, message: {response.content}"
                )

        logger.error(f"Failed after {max_retries} attempts.")
        return None

    def _download_file_by_url(self, item: Dict[str, Any], local_dir: str) -> str:
        """
        Downloads a file from OneDrive using the provided item's download URL

        Parameters:
        - item (Dict[str, str]): Dictionary containing file metadata and download URL.
        - local_dir (str): Local directory where the file should be saved.

        Returns:
        - str: The file path of the downloade file

        """

        # Extract download URL and filename from the provided item.
        file_download_url = item["@microsoft.graph.downloadUrl"]
        file_name = item["name"]

        # Download the file.
        file_data = requests.get(file_download_url)

        # Save the downloaded file to the specified local directory.
        file_path = os.path.join(local_dir, file_name)
        with open(file_path, "wb") as f:
            f.write(file_data.content)

        return file_path

    def _extract_metadata_for_file(self, item: Dict[str, Any]) -> Dict[str, str]:
        """
        Extracts metadata related to the file.

        Parameters:
        - item (Dict[str, str]): Dictionary containing file metadata.

        Returns:
        - Dict[str, str]: A dictionary containing the extracted metadata.
        """
        # Extract the required metadata for file.
        created_by = item.get("createdBy", {})
        modified_by = item.get("lastModifiedBy", {})
        props = {
            "file_id": item.get("id"),
            "file_name": item.get("name"),
            "created_by_user": created_by.get("user", {}).get("displayName"),
            "created_by_app": created_by.get("application", {}).get("displayName"),
            "created_dateTime": item.get("createdDateTime"),
            "last_modified_by_user": modified_by.get("user", {}).get("displayName"),
            "last_modified_by_app": modified_by.get("application", {}).get(
                "displayName"
            ),
            "last_modified_datetime": item.get("lastModifiedDateTime"),
        }

        return props

    def _check_approved_mimetype_and_download_file(
        self,
        item: Dict[str, Any],
        local_dir: str,
        mime_types: Optional[List[str]] = None,
    ):
        """
        Checks files based on MIME types and download the accepted files.

        :param item: dict, a dictionary representing a file item, must contain 'file' and 'mimeType' keys.
        :param local_dir: str, the local directory to download files to.
        :param mime_types: list, a list of accepted MIME types. If None or empty, all file types are accepted.
        :return: dict, a dictionary containing metadata of downloaded files.
        """
        metadata = {}

        # Convert accepted MIME types to lowercase for case-insensitive comparison
        accepted_mimetypes = (
            [mimetype.lower() for mimetype in mime_types] if mime_types else ["*"]
        )

        # Check if the item's MIME type is among the accepted MIME types
        is_accepted_mimetype = (
            "*" in accepted_mimetypes
            or item["file"]["mimeType"].lower() in accepted_mimetypes
        )

        if is_accepted_mimetype:
            # It's a file with an accepted MIME type; download and extract metadata
            file_path = self._download_file_by_url(
                item, local_dir
            )  # Assuming this method is implemented
            metadata[file_path] = self._extract_metadata_for_file(
                item
            )  # Assuming this method is implemented
        else:
            # Log a debug message for files that are ignored due to an invalid MIME type
            logger.debug(
                f"Ignoring file '{item['name']}' as its MIME type does not match the accepted types."
            )

        return metadata

    def _connect_download_and_return_metadata(
        self,
        access_token: str,
        local_dir: str,
        item_id: str = None,
        include_subfolders: bool = True,
        mime_types: Optional[List[str]] = None,
        userprincipalname: Optional[str] = None,
        isRelativePath=False,
    ) -> Any:
        """
        Recursively download files from OneDrive, starting from the specified item_id or the root.

        Parameters:
        - access_token (str): Token for authorization.
        - local_dir (str): Local directory to store downloaded files.
        - item_id (str, optional): ID of the specific item (folder/file) to start from. If None, starts from the root.
        - include_subfolders (bool, optional): Whether to include subfolders. Defaults to True.
        - mime_types(List[str], optional): the mimeTypes you want to allow e.g.: "application/pdf", default is None which loads all files
        - userprincipalname (str): The userprincipalname(normally organization provided email id) whose ondrive needs to be accessed. Mandatory for App authentication scenarios.
        - isRelativePath (bool): Value to indicate if to query file/folder using relative path

        Returns:
        - dict: Dictionary of file paths and their corresponding metadata.

        Raises:
        - Exception: If items can't be retrieved for the current item.
        """

        data = self._get_items_in_drive_with_maxretries(
            access_token,
            item_id,
            userprincipalname=userprincipalname,
            isRelativePath=isRelativePath,
        )

        if data:
            metadata = {}
            for item in data["value"]:
                if (
                    "folder" in item and include_subfolders
                ):  # It's a folder; traverse if flag is set
                    subfolder_metadata = self._connect_download_and_return_metadata(
                        access_token,
                        local_dir,
                        item["id"],
                        include_subfolders,
                        mime_types=mime_types,
                        userprincipalname=userprincipalname,
                    )
                    metadata.update(subfolder_metadata)  # Merge metadata

                elif "file" in item:
                    file_metadata = self._check_approved_mimetype_and_download_file(
                        item, local_dir, mime_types
                    )
                    metadata.update(file_metadata)

            return metadata

        # No data received; raise exception
        current_item = item_id if item_id else "RootFolder"
        raise Exception(f"Unable to retrieve items for: {current_item}")

    def _init_download_and_get_metadata(
        self,
        temp_dir: str,
        folder_id: Optional[str] = None,
        file_ids: Optional[List[str]] = None,
        folder_path: Optional[str] = None,
        file_paths: Optional[List[str]] = None,
        recursive: bool = False,
        mime_types: Optional[List[str]] = None,
        userprincipalname: Optional[str] = None,
    ) -> None:
        """
        Download files from OneDrive based on specified folder or file IDs/Paths.

        Parameters:
        - temp_dir (str): The temporary directory where files will be downloaded.
        - folder_id (str, optional): The ID of the OneDrive folder to download. If provided, files within the folder are downloaded.
        - file_ids (List[str], optional): List of specific file IDs to download.
        - folder_path (str, optional): The relative path of the OneDrive folder to download. If provided, files within the folder are downloaded.
        - file_paths (List[str], optional): List of specific file paths to download.
        - recursive (bool): Flag indicating whether to download files from subfolders if a folder_id is provided.
        - mime_types(List[str], optional): the mimeTypes you want to allow e.g.: "application/pdf", default is None which loads all files
        - userprincipalname (str): The userprincipalname(normally organization provided email id) whose ondrive needs to be accessed. Mandatory for App authentication scenarios.

        """
        access_token = self._authenticate_with_msal()
        is_download_from_root = True
        downloaded_files_metadata = {}
        # If a folder_id is provided, download files from the folder
        if folder_id:
            is_download_from_root = False
            folder_metadata = self._connect_download_and_return_metadata(
                access_token,
                temp_dir,
                folder_id,
                recursive,
                mime_types=mime_types,
                userprincipalname=userprincipalname,
            )
            downloaded_files_metadata.update(folder_metadata)

        # Download files using the provided file IDs
        if file_ids:
            is_download_from_root = False
            for file_id in file_ids or []:
                item = self._get_items_in_drive_with_maxretries(
                    access_token,
                    file_id,
                    userprincipalname=userprincipalname,
                    isFile=True,
                )
                file_metadata = self._check_approved_mimetype_and_download_file(
                    item, temp_dir, mime_types
                )
                downloaded_files_metadata.update(file_metadata)

        # If a folder_path is provided, download files from the folder
        if folder_path:
            is_download_from_root = False
            folder_metadata = self._connect_download_and_return_metadata(
                access_token,
                temp_dir,
                folder_path,
                recursive,
                mime_types=mime_types,
                userprincipalname=userprincipalname,
                isRelativePath=True,
            )
            downloaded_files_metadata.update(folder_metadata)

        # Download files using the provided file paths
        if file_paths:
            is_download_from_root = False
            for file_path in file_paths or []:
                item = self._get_items_in_drive_with_maxretries(
                    access_token,
                    file_path,
                    userprincipalname=userprincipalname,
                    isFile=True,
                    isRelativePath=True,
                )
                file_metadata = self._check_approved_mimetype_and_download_file(
                    item, temp_dir, mime_types
                )
                downloaded_files_metadata.update(file_metadata)

        if is_download_from_root:
            # download files from root folder
            root_folder_metadata = self._connect_download_and_return_metadata(
                access_token,
                temp_dir,
                "root",
                recursive,
                mime_types=mime_types,
                userprincipalname=userprincipalname,
            )
            downloaded_files_metadata.update(root_folder_metadata)

        return downloaded_files_metadata

    def _load_documents_with_metadata(
        self, directory: str, recursive: bool = True
    ) -> List[Document]:
        """
        Load documents from a specified directory using the SimpleDirectoryReader
        and associate them with their respective metadata.

        Parameters:
        - directory (str): The directory from which to load the documents.
        - recursive (bool, optional): Whether to perform a recursive search through the directory. Defaults to True.

        Returns:
        - List[Document]: Loaded documents from the specified directory with associated metadata.
        """

        def get_metadata(filename: str) -> Any:
            return self._downloaded_files_metadata[filename]

        try:
            from llama_hub.utils import import_loader

            SimpleDirectoryReader = import_loader("SimpleDirectoryReader")
        except ImportError:
            SimpleDirectoryReader = download_loader("SimpleDirectoryReader")

        simple_loader = SimpleDirectoryReader(
            directory, file_metadata=get_metadata, recursive=recursive
        )
        documents = simple_loader.load_data()
        return documents

    def load_data(
        self,
        folder_id: str = None,
        file_ids: List[str] = None,
        folder_path: Optional[str] = None,
        file_paths: Optional[List[str]] = None,
        mime_types: Optional[List[str]] = None,
        recursive: bool = True,
        userprincipalname: Optional[str] = None,
    ) -> List[Document]:
        """Load data from the folder id / file ids, f both are not provided download from the root.
        Args:
            folder_id: folder id of the folder in OneDrive.
            file_ids: file ids of the files in OneDrive.
            folder_path (str, optional): The relative path of the OneDrive folder to download. If provided, files within the folder are downloaded.
            file_paths (List[str], optional): List of specific file paths to download.
            mime_types: the mimeTypes you want to allow e.g.: "application/pdf", default is none, which loads all files found
            recursive: boolean value to traverse and read subfolder, default is True
            userprincipalname: str value indicating the userprincipalname(normally organization provided email id) whose ondrive needs to be accessed. Mandatory for App authentication scenarios.
        Returns:
            List[Document]: A list of documents.
        """
        try:

            with tempfile.TemporaryDirectory() as temp_dir:
                self._downloaded_files_metadata = self._init_download_and_get_metadata(
                    temp_dir=temp_dir,
                    folder_id=folder_id,
                    file_ids=file_ids,
                    folder_path=folder_path,
                    file_paths=file_paths,
                    recursive=recursive,
                    mime_types=mime_types,
                    userprincipalname=userprincipalname,
                )
                return self._load_documents_with_metadata(temp_dir, recursive=recursive)
        except Exception as e:
            logger.error(
                "An error occurred while loading the data: {}".format(e), exc_info=True
            )
