"""Apify Actor reader"""
from typing import Callable, Dict, List, Optional

from llama_index import download_loader
from llama_index.readers.base import BaseReader
from llama_index.readers.schema.base import Document


class ApifyActor(BaseReader):
    """Apify Actor reader.
    Calls an Actor on the Apify platform and reads its resulting dataset when it finishes.

    Args:
        apify_api_token (str): Apify API token.
    """

    def __init__(self, apify_api_token: str) -> None:
        """Initialize the Apify Actor reader."""
        from apify_client import ApifyClient

        self.apify_api_token = apify_api_token
        self.apify_client = ApifyClient(apify_api_token)

    def load_data(
        self,
        actor_id: str,
        run_input: Dict,
        dataset_mapping_function: Callable[[Dict], Document],
        *,
        build: Optional[str] = None,
        memory_mbytes: Optional[int] = None,
        timeout_secs: Optional[int] = None,
    ) -> List[Document]:
        """Call an Actor on the Apify platform, wait for it to finish, and return its resulting dataset.
        Args:
            actor_id (str): The ID or name of the Actor.
            run_input (Dict): The input object of the Actor that you're trying to run.
            dataset_mapping_function (Callable): A function that takes a single dictionary (an Apify dataset item) and converts it to an instance of the Document class.
            build (str, optional): Optionally specifies the Actor build to run. It can be either a build tag or build number.
            memory_mbytes (int, optional): Optional memory limit for the run, in megabytes.
            timeout_secs (int, optional): Optional timeout for the run, in seconds.
        Returns:
            List[Document]: List of documents.
        """
        actor_call = self.apify_client.actor(actor_id).call(
            run_input=run_input,
            build=build,
            memory_mbytes=memory_mbytes,
            timeout_secs=timeout_secs,
        )

        try:
            from llama_hub.utils import import_loader

            ApifyDataset = import_loader("ApifyDataset")
        except ImportError:
            ApifyDataset = download_loader("ApifyDataset")

        reader = ApifyDataset(self.apify_api_token)
        documents = reader.load_data(
            dataset_id=actor_call.get("defaultDatasetId"),
            dataset_mapping_function=dataset_mapping_function,
        )

        return documents
