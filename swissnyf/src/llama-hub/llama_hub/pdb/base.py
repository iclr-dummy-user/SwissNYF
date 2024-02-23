"""Simple Reader that reads abstract of primary citation for a given PDB id."""
from typing import List
from llama_hub.pdb.utils import get_pdb_abstract

from llama_index.readers.base import BaseReader
from llama_index.readers.schema.base import Document


class PdbAbstractReader(BaseReader):
    """Protein Data Bank entries' primary citation abstract reader."""

    def __init__(self) -> None:
        super().__init__()

    def load_data(self, pdb_ids: List[str]) -> List[Document]:
        """Load data from RCSB or EBI REST API.

        Args:
            pdb_ids (List[str]): List of PDB ids \
                for which primary citation abstract are to be read.
        """

        results = []
        for pdb_id in pdb_ids:
            title, abstracts = get_pdb_abstract(pdb_id)
            primary_citation = abstracts[title]
            abstract = primary_citation["abstract"]
            abstract_text = "\n".join(
                ["\n".join([str(k), str(v)]) for k, v in abstract.items()]
            )
            results.append(
                Document(
                    text=abstract_text,
                    extra_info={"pdb_id": pdb_id, "primary_citation": primary_citation},
                )
            )
        return results
