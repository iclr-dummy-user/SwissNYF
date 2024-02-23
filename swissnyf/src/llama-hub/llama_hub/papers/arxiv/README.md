# Arxiv Papers Loader

This loader fetchs the text from the most relevant scientific papers on Arxiv specified by a search query (e.g. "Artificial Intelligence"). For each paper, the abstract is extracted and put in a separate document. The search query may be any string, Arxiv paper id, or a general Arxiv query string (see the full list of capabilities [here](https://info.arxiv.org/help/api/user-manual.html#query_details)).

## Usage

To use this loader, you need to pass in the search query. You may also optionally specify a local directory to temporarily store the paper PDFs (they are deleted automatically) and the maximum number of papers you want to parse for your search query (default is 10).

```python
from llama_index import download_loader

ArxivReader = download_loader("ArxivReader")

loader = ArxivReader()
documents = loader.load_data(search_query='au:Karpathy')
```

Alternatively, if you would like to load papers and abstracts separately:

```python
from llama_index import download_loader

ArxivReader = download_loader("ArxivReader")

loader = ArxivReader()
documents, abstracts = loader.load_papers_and_abstracts(search_query='au:Karpathy')
```

This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.
