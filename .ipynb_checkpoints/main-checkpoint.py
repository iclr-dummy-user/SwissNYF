import random
from fastapi import FastAPI, Response, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import time
from pipeline import *
from retriever import *
from utils import *
from configs import *
from utils.tools_util import *
import argparse
import os
import sys
import copy
import pickle
import json
import re
from llama_index.embeddings import OpenAIEmbedding
from llama_index.agent import ReActAgent
import re
from tqdm import tqdm
from llama_index.tools.function_tool import FunctionTool
from typing import List
from llama_index.agent.react.formatter import  get_react_tool_descriptions
from llama_index.llms.base import LLM
from functools import wraps
from collections.abc import Iterable
import inspect, itertools 
from tqdm import tqdm
from typing import List

from functools import wraps
from collections.abc import Iterable
from abc import abstractclassmethod
from typing import Optional, Dict, List, Tuple
from sentence_transformers import SentenceTransformer, util
from llama_index.llms import AzureOpenAI, OpenAI
from llama_index.embeddings import OpenAIEmbedding
from sentence_transformers import SentenceTransformer, util
from collections import Counter
import os
import inspect
from io import BytesIO
from fastapi import Request

currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

from dotenv import load_dotenv, find_dotenv
dirname = os.path.join(currentdir, '.env')
load_dotenv(dirname)

# model = os.environ["OPENAI_API_MODEL"]
# llm = OpenAI(model=model, temperature=0.01)
# print("LLM is initalised")
model = os.environ["OPENAI_API_MODEL"]
deployment = os.environ["OPENAI_API_DEPLOYMENT"]
llm = AzureOpenAI(deployment_id=deployment, model=model, engine=deployment, temperature=0.01)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
class DummyRetriever:
    def __init__(self, all_tool_names):
        self.all_tool_names = all_tool_names
    def filter(self, query):
        return self.all_tool_names

tools = Tools("./data/tools.yaml")
# tools = Tools(load_raw="./data/local_tool_set.json")
all_tools_list = None
all_tools_names = None #python-app
all_tools_desc = None
retriever = DummyRetriever(tools)
pipeline_topgun = TopGun(filter_method=retriever, llm=llm)
pipeline_reverse = ReverseChain(filter_method=retriever, llm=llm)


from pydantic import BaseModel


class StreamPayload(BaseModel):
    query: str = ""
    planner: str = "topgun"

def set_tools_ret():
    global tools, all_tools_list, all_tools_names, all_tools_desc, retriever, pipeline_topgun, pipeline_reverse
    if tools.tools_raw is not None:
        pipeline_topgun.tool_defs = tools.tools_raw
        pipeline_topgun._topgun_corpus = tools.tools_raw
        pipeline_reverse.tool_defs = tools.tools_raw 
        pipeline_reverse._reverse_chain_corpus = tools.tools_raw 
        pipeline_reverse.set_raw_tools("\n\n".join(tools.tools_raw))
    else:
        tools.load_tools_yaml()
        all_tools_list = tools.get_tools_list()
        all_tools_names = tools.get_tool_names()
        all_tools_desc = tools.get_tools__desc_str()
        retriever = DummyRetriever(tools)
        pipeline_topgun.set_tools(all_tools_desc, all_tools_names)
        pipeline_reverse.set_tools(all_tools_desc, all_tools_names)

def run_query(query,planner):
    if all_tools_desc is None or all_tools_names is None:
        set_tools_ret()
    
    if planner== "reversechain":
        pipeline = pipeline_reverse
    elif planner == "topgun":
        pipeline = pipeline_topgun
    
    yield from pipeline.query(query)


@app.get('/')
async def hello_world():
    return {'message': 'Hello, World!'}

@app.post('/get_tools')
async def get_tools():
    return {'message': tools.get_tools() }

@app.post('/set_tools')
async def set_default_tools():
    
    return {'message': tools.get_tools()}

@app.get("/build_tools")
def get_build_tools(tools):
    if tools.tools is None:
        tools.load_tools_via_api(tools)
    else:
        curr_tool_names = tools.get_tool_names()
        for tool in tools:
            if tool['name']  not in curr_tool_names:
                tools.tools[tool['name']] = tool
    all_tools_list = tools.get_tools_list()
    all_tools_names = tools.get_tool_names()
    all_tools_desc = tools.get_tools__desc_str()

    # retriever = GearRet(top_k = 9, verbose = False)
    # retriever = InstructRet(top_k = 9, verbose = False)
    retriever = DummyRetriever(all_tools_list)
    # print("Retriever is initalised")
    # retriever.set_tool_def(all_tools_list)
    
    return {"message": "All tools are loaded and set up"}
    

@app.post("/stream_response")
async def stream_functions(body: StreamPayload):
    # print("this is the body", body)
    query = body.query
    planner = body.planner
    return StreamingResponse(run_query(query,planner), media_type="text/markdown")
# return StreamingResponse(run_query(query,planner), media_type="text/markdown")

@app.get("/markdown")
def generate_markdown():
    markdown_content = """
    # FastAPI Streaming Response Example
    
    This is a streaming response example using FastAPI.
    
    ## Streaming Markdown
    
    - Bullet point 1
    - Bullet point 2
    - Bullet point 3
    """
    
    # Convert the Markdown content to bytes
    markdown_bytes = markdown_content.encode("utf-8")
    
    # Create a BytesIO object to stream the content
    stream = BytesIO(markdown_bytes)
    
    # Return a StreamingResponse with the proper content type
    return StreamingResponse(stream, media_type="text/markdown")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(python-app, host="0.0.0.0", port=8000)
