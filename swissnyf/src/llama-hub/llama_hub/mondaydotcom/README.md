# Monday Loader

This loader loads data from monday.com. The user specifies an API token to initialize the MondayReader. They then specify a monday.com board id to load in the corresponding Document objects.

## Usage

Here's an example usage of the MondayReader.

```python
from llama_index import download_loader

MondayReader = download_loader('MondayReader')

reader = MondayReader("<monday_api_token>")
documents = reader.load_data("<board_id: int>")

```

Check out monday.com API docs - [here](https://developer.monday.com/apps/docs/mondayapi)

This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent. See [here](https://github.com/jerryjliu/llama_index) for examples.
