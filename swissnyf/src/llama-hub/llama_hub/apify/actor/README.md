# Apify Actor Loader

[Apify](https://apify.com/) is a cloud platform for web scraping and data extraction,
which provides an [ecosystem](https://apify.com/store) of more than a thousand
ready-made apps called *Actors* for various scraping, crawling, and extraction use cases.

This loader runs a specific Actor and loads its results.

## Usage

In this example, we’ll use the [Website Content Crawler](https://apify.com/apify/website-content-crawler) Actor,
which can deeply crawl websites such as documentation, knowledge bases, help centers,
or blogs, and extract text content from the web pages.
The extracted text then can be fed to a vector index or language model like GPT
in order to answer questions from it.

To use this loader, you need to have a (free) Apify account 
and set your [Apify API token](https://console.apify.com/account/integrations) in the code.

```python
from llama_index import download_loader
from llama_index.readers.schema import Document

# Converts a single record from the Actor's resulting dataset to the LlamaIndex format
def tranform_dataset_item(item):
    return Document(
        text=item.get("text"),
        extra_info={
            "url": item.get("url"),
        },
    )

ApifyActor = download_loader("ApifyActor")

reader = ApifyActor("<My Apify API token>")
documents = reader.load_data(
    actor_id="apify/website-content-crawler",
    run_input={"startUrls": [{"url": "https://gpt-index.readthedocs.io/en/latest"}]},
    dataset_mapping_function=tranform_dataset_item,
)
```

This loader is designed to be used as a way to load data into
[LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently
used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent.
See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.
