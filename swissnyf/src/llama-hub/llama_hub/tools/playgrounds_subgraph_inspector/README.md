# playgrounds_subgraph_inspector

Playgrounds API is a service provided by [Playgrounds Analytics](https://playgrounds.network) to facilitate interactions with decentralized subgraphs (indexed blockchain datasets).

The `PlaygroundsSubgraphInspectorToolSpec` is a tool designed for LLM agents to introspect and understand the schema of subgraphs on The Graph's decentralized network via the Playgrounds API.

This tool is specifically designed to be used alongside [Llama index](https://github.com/jerryjliu/llama_index) or [langchain](https://python.langchain.com/docs/modules/agents/tools/custom_tools).

- To learn more about Playgrounds API, please visit our website: [Playgrounds Network](https://playgrounds.network/)
- Obtain your Playgrounds API Key and get started for free [here](https://app.playgrounds.network/signup).
- Discover any Subgraph (dataset) you need [here](https://thegraph.com/explorer).

## Advantages of this tool:

- **Introspection of Decentralized Subgraphs (Datasets)**: Understand the schema of any subgraph without hassle.
- **LLM x Blockchain Data**: Develop AI applications that leverage introspective insights from blockchain data.

## Basic Usage:

To utilize the tool, initialize it with the appropriate `identifier` (Subgraph ID or Deployment ID), `api_key`, and specify if you're using a deployment ID.

```python
import openai
from llama_index.agent import OpenAIAgent
from llama_hub.tools.playgrounds_subgraph_inspector import PlaygroundsSubgraphInspectorToolSpec

def inspect_subgraph(
    openai_api_key: str,
    playgrounds_api_key: str,
    identifier: str,
    use_deployment_id: bool,
    user_prompt: str
):
    """
    Introspect a subgraph using OpenAIAgent and Playgrounds API with the provided parameters.
    
    Args:
        openai_api_key (str): API key for OpenAI.
        playgrounds_api_key (str): API key for Playgrounds.
        identifier (str): Identifier for the subgraph or deployment.
        use_deployment_id (bool): If True, uses deployment ID in the URL.
        user_prompt (str): User's question or prompt for the agent.
        
    Returns:
        str: Agent's response.
    """
    # Set the OpenAI API key
    openai.api_key = openai_api_key
    
    # Initialize the inspector with the provided parameters
    inspector_spec = PlaygroundsSubgraphInspectorToolSpec(
        identifier=identifier, 
        api_key=playgrounds_api_key, 
        use_deployment_id=use_deployment_id
    )
    
    # Integrate the tool with the agent
    agent = OpenAIAgent.from_tools(inspector_spec.to_tool_list())
    
    # Send the user prompt to the agent
    response = agent.chat(user_prompt)
    return response


if __name__ == "__main__":
    query = inspect_subgraph(
        openai_api_key='YOUR_OPENAI_API_KEY',
        playgrounds_api_key="YOUR_PLAYGROUNDS_API_KEY",
        identifier="YOUR_SUBGRAPH_OR_DEPLOYMENT_IDENTIFIER",
        use_deployment_id=False,
        user_prompt='Which entities will help me understand the usage of Uniswap V3?'
    )
```
Visit here for more in-depth [Examples](https://github.com/Tachikoma000/playgrounds_subgraph_connector/blob/main/introspector_agent_tool/examples.ipynb).

This inspector is designed to be used as a way to understand the schema of subgraphs and subgraph data being loaded into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent. 
