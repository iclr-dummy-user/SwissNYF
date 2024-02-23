# Yelp Tool

This tool connects to Yelp and allows the Agent to search for business and fetch the reviews.

## Usage

This tool has more extensive example usage documented in a Jupyter notebook [here](https://github.com/emptycrown/llama-hub/tree/main/llama_hub/tools/notebooks/yelp.ipynb)

Here's an example usage of the YelpToolSpec.

```python
from llama_hub.tools.yelp import YelpToolSpec


tool_spec = YelpToolSpec(api_key='your-key', client_id='your-id')

agent = OpenAIAgent.from_tools(zapier_spec.to_tool_list(), verbose=True)

agent.chat('what good resturants are in toronto')
agent.chat('what are the details of lao lao bar')
```

`business_search`: Use a natural langauage query to search for businesses
`business_reviews`: Use a business id to fetch reviews

This loader is designed to be used as a way to load data as a Tool in a Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.

