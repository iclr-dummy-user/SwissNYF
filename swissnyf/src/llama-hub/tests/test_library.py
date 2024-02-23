"""Check that the library is working as expected."""

import json
from importlib import util
from pathlib import Path


def test_library_matches() -> None:
    """Check that library.json corresponds to valid files."""
    hub_dir = Path(__file__).parent.parent / "llama_hub"
    library_path = hub_dir / "library.json"
    library_dict = json.load(open(library_path, "r"))
    for k, entry in library_dict.items():
        if k == "GithubRepositoryReader":
            continue

        # make sure every entry has an "id" field
        assert "id" in entry
        entry_id = entry["id"]

        # make sure the loader directory exists
        entry_dir = hub_dir / entry_id
        assert entry_dir.exists()

        # make sure that the loader file exists
        entry_file = entry_dir / "base.py"
        assert entry_file.exists()

        # make sure that the README file exists
        readme_file = entry_dir / "README.md"
        assert readme_file.exists()

        spec = util.spec_from_file_location("custom_loader", location=str(entry_file))
        if spec is None:
            raise ValueError(f"Could not find file: {str(entry_file)}.")
        module = util.module_from_spec(spec)
        spec.loader.exec_module(module)  # type: ignore

        # make sure the specified class is in the loader file
        assert hasattr(module, k)


def test_tools_library_matches() -> None:
    """Check that library.json corresponds to valid files."""
    hub_dir = Path(__file__).parent.parent / "llama_hub"
    library_path = hub_dir / "tools" / "library.json"
    library_dict = json.load(open(library_path, "r"))
    for k, entry in library_dict.items():
        # make sure every entry has an "id" field
        assert "id" in entry
        entry_id = entry["id"]

        # make sure the tool directory exists
        entry_dir = hub_dir / entry_id
        assert entry_dir.exists()

        # make sure that the tool file exists
        entry_file = entry_dir / "base.py"
        assert entry_file.exists()

        # make sure that the README file exists
        readme_file = entry_dir / "README.md"
        assert readme_file.exists()

        spec = util.spec_from_file_location("custom_tool", location=str(entry_file))
        if spec is None:
            raise ValueError(f"Could not find file: {str(entry_file)}.")
        module = util.module_from_spec(spec)
        spec.loader.exec_module(module)  # type: ignore

        # make sure the specified class is in the loader file
        assert hasattr(module, k)
