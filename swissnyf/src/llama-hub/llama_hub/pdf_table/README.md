# PDF Table Loader

This loader reads the tables included in the PDF.

Users can input the PDF `file` and the `pages` from which they want to extract tables, and they can read the tables included on those pages.

## Usage

Here's an example usage of the PDFTableReader.
`pages` parameter is the same as camelot's `pages`. Therefore, you can use patterns such as `all`, `1,2,3`, `10-20`, and so on.

```python
from llama_hub.pdf_table import PDFTableReader
from pathlib import Path

reader = PDFTableReader()
pdf_path = Path('/path/to/pdf')
documents = reader.load_data(file=pdf_path, pages='80-90')
```

## Example

This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent.