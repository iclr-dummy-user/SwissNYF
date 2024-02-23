# Rayyan Loader

This loader fetches review articles from [Rayyan](https://www.rayyan.ai/)
using the [Rayyan SDK](https://github.com/rayyansys/rayyan-python-sdk). All articles
for a given review are fetched by default unless a filter is specified.

## Usage

To use this loader, you need to specify the path to the Rayyan credentials file
and optionally the API server URL if different from the default. More details
about these parameters can be found in the official Rayyan SDK repository.


```python
from llama_index import download_loader

RayyanReader = download_loader("RayyanReader")
loader = RayyanReader(credentials_path="path/to/rayyan-creds.json")
```

Once the loader is initialized, you can load data from Rayyan, either all or filtered:
```python
# Load all documents for a review with ID 123456
documents = loader.load_data(review_id=123456)

# Load only those that contain the word "outcome"
documents = loader.load_data(review_id=123456, filters={"search[value]": "outcome"})
```

The Rayyan SDK has more information about the available filters.

This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.
