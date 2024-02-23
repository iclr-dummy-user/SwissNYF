# Memos Loader

This loader fetchs text from self-hosted [memos](https://github.com/usememos/memos).

## Usage

To use this loader, you need to specify the host where memos is deployed. If you need to filter, pass the [corresponding parameter](https://github.com/usememos/memos/blob/4fe8476169ecd2fc4b164a25611aae6861e36812/api/memo.go#L76) in `load_data`.

```python
from llama_index import download_loader

MemosReader = download_loader("MemosReader")
loader = MemosReader("https://demo.usememos.com/")
documents = loader.load_data({"creatorId": 101})
```


This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.
