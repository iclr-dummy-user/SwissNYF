# Airtable Loader

This loader loads documents from Airtable. The user specifies an API token to initialize the AirtableReader. They then specify a `table_id` and a `base_id` to load in the corresponding Document objects.

## Usage

Here's an example usage of the AirtableReader.

```python
from llama_index import download_loader
import os

AirtableReader = download_loader('AirtableReader')

reader = AirtableReader("<Airtable_TOKEN">)
documents = reader.load_data(table_id="<TABLE_ID>",base_id="<BASE_ID>")

```

This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.
