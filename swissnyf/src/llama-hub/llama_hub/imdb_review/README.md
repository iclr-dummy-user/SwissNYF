## IMDB MOVIE REVIEWS LOADER

This loader fetches all the reviews of a movie or a TV-series from IMDB official site. This loader is working on Windows machine and it requires further debug on Linux. Fixes are on the way

Install the required dependencies

```
pip install -r requirements.txt
```

The IMDB downloader takes in two attributes
* movie_name_year: The name of the movie or series and year
* webdriver_engine: To use edge, google or gecko (mozilla) webdriver

## Usage
```python
from llama_index import download_loader

IMDBReviewsloader = download_loader('IMDBReviews')

loader = IMDBReviews(movie_name_year="The Social Network 2010",webdriver_engine='edge')
docs = loader.load_data()
```

It will download the files inside the folder `movie_reviews` with the filename as the movie name

## EXAMPLES

This loader can be used with both Langchain and LlamaIndex.

### LlamaIndex
```python
from llama_index import GPTVectorStoreIndex, download_loader
from llama_index import VectorStoreIndex

IMDBReviewsloader = download_loader('IMDBReviews')

loader = IMDBReviewsloader(movie_name_year="The Social Network 2010",webdriver_engine='edge')
docs = loader.load_data()

index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()

response = query_engine.query(
    "What did the movie say about Mark Zuckerberg?",
)
print(response)

```

### Langchain

```python
from llama_index import download_loader
from langchain.llms import OpenAI
from langchain.agents.agent_toolkits.pandas import create_pandas_dataframe_agent
from langchain.agents import Tool
from langchain.agents import initialize_agent
from langchain.chat_models import ChatOpenAI

IMDBReviewsloader = download_loader('IMDBReviews')

loader = IMDBReviewsloader(movie_name_year="The Social Network 2010",webdriver_engine='edge')
docs = loader.load_data()
tools = [
    Tool(
        name="LlamaIndex",
        func=lambda q: str(index.as_query_engine().query(q)),
        description="useful for when you want to answer questions about the movies and their reviews. The input to this tool should be a complete english sentence.",
        return_direct=True,
    ),
]
llm = ChatOpenAI(temperature=0)
agent = initialize_agent(
    tools, llm, agent="conversational-react-description"
)
agent.run("What did the movie say about Mark Zuckerberg?")
```
