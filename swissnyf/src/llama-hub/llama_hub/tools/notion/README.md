# Notion Tool

This tool loads and updates documents from Notion. The user specifies an API token to initialize the NotionToolSpec.


## Usage

This tool has more extensive example usage documented in a Jupyter notebook [here](https://github.com/emptycrown/llama-hub/tree/main/llama_hub/tools/notebooks/notion.ipynb)

Here's an example usage of the NotionToolSpec.

```python
from llama_hub.tools.notion import NotionToolSpec
from llama_index.agent import OpenAIAgent

tool_spec = NotionToolSpec()

agent = OpenAIAgent.from_tools(tool_spec.to_tool_list())

agent.chat("Append the heading 'I am legend' to the movies page")
```

`load_data`: Loads a list of page or databases by id
`search_data`: Searches for matching pages or databases
`append_data`: Appends content to the matching page or databse

This loader is designed to be used as a way to load data as a Tool in a Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.

