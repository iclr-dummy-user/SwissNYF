import torch
import pandas as pd
from tqdm import tqdm
from llama_index.llms import AzureOpenAI
import json

class BaseRetriever:
    def __init__(self, top_k:int = 5,device='cuda', verbose=True, model_name = 'model_name') -> None:
        self.model_name = model_name
        self.device = torch.device(device)
        self.model = None
        self.verbose = verbose
        self.top_k = top_k

    def set_tool_def(self, tool_def: list) -> None:
        """create a list of tools from json definition"""
        all_tools = []

        # print("setting tools for retriever via base")
        for obj in tool_def:
            if type(obj) is not dict:
                obj = json.loads(obj)
            api_name = obj['tool']
            api_desc = obj['description']
            if 'arguments' in obj:
                for args in obj['arguments']:
                    arg_name = args['name']
                    arg_desc = args['description']
                    arg_type = args['type']
            all_tools.append((api_name, api_desc))

        # print("All tools after being set in retriever")
        self.all_tools = all_tools
        

    def add_tool_def(self, new_tool_def: list) -> None:
        """add new tools, accepts a list of tools in json format """

        new_tools = []
        
        for obj in new_tool_def:
            if type(obj) is not dict:
                obj = json.loads(obj)
            api_name = obj['tool']
            api_desc = obj['description']
            for args in obj['arguments']:
                arg_name = args['name']
                arg_desc = args['description']
                arg_type = args['type']
            new_tools.append((api_name, api_desc))
        self.all_tools.extend(new_tools)


    def filter(self, query, top_k=5) -> list:
        """returns the top_k tools for a given query"""
        pass 

# import os
# os.environ["OPENAI_API_KEY"] = "dbcd08145e354de1ba620bff416de2c4"
# os.environ["OPENAI_API_BASE"] = "https://msri-openai-ifaq.azure-api.net"
# os.environ["OPENAI_API_TYPE"] = "azure"
# os.environ["OPENAI_API_VERSION"] = "2023-03-15-preview"
# llm2 = AzureOpenAI(deployment_id="gpt-35-turbo", model="gpt-35-turbo", engine="gpt-35-turbo", temperature=0.01 )

# obj = BaseRetriever(llm = llm2)
