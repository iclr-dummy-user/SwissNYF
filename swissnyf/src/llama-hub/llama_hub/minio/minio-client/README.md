# Minio File or Directory Loader

This loader parses any file stored on Minio, or the entire Bucket (with an optional prefix filter) if no particular file is specified. When initializing `MinioReader`, you may pass in your `minio_access_key` and `minio_secret_key`.

All files are temporarily downloaded locally and subsequently parsed with `SimpleDirectoryReader`. Hence, you may also specify a custom `file_extractor`, relying on any of the loaders in this library (or your own)!

## Usage

To use this loader, you need to pass in the name of your Minio Bucket. After that, if you want to just parse a single file, pass in its key. Note that if the file is nested in a subdirectory, the key should contain that, so like `subdirectory/input.txt`.

Otherwise, you may specify a prefix if you only want to parse certain files in the Bucket, or a subdirectory.

```python
from llama_index import download_loader

MinioReader = download_loader("MinioReader")
loader = MinioReader(
    bucket="documents",
    minio_endpoint="localhost:9000",
    minio_secure=False,
    minio_access_key="minio_access_key",
    minio_secret_key="minio_secret_key",
)
documents = loader.load_data()
```

This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.
