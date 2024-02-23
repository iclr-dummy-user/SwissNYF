# Pandas AI Loader

This loader is a light wrapper around the `PandasAI` Python package.

See here: https://github.com/gventuri/pandas-ai.

You can directly get the result of `pandasai.run` command, or
you can choose to load in `Document` objects via `load_data`.

## Usage

```python
from llama_index import download_loader
from pandasai.llm.openai import OpenAI
import pandas as pd

# Sample DataFrame
df = pd.DataFrame({
    "country": ["United States", "United Kingdom", "France", "Germany", "Italy", "Spain", "Canada", "Australia", "Japan", "China"],
    "gdp": [21400000, 2940000, 2830000, 3870000, 2160000, 1350000, 1780000, 1320000, 516000, 14000000],
    "happiness_index": [7.3, 7.2, 6.5, 7.0, 6.0, 6.3, 7.3, 7.3, 5.9, 5.0]
})

llm = OpenAI()

PandasAIReader = download_loader("PandasAIReader")

# use run_pandas_ai directly 
# set is_conversational_answer=False to get parsed output
loader = PandasAIReader(llm=llm)
response = reader.run_pandas_ai(
    df, 
    "Which are the 5 happiest countries?", 
    is_conversational_answer=False
)
print(response)

# load data with is_conversational_answer=False
# will use our PandasCSVReader under the hood
docs = reader.load_data(
    df, 
    "Which are the 5 happiest countries?", 
    is_conversational_answer=False
)

# load data with is_conversational_answer=True
# will use our PandasCSVReader under the hood
docs = reader.load_data(
    df, 
    "Which are the 5 happiest countries?", 
    is_conversational_answer=True
)


```

This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.
