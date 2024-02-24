import os
import json
import time
import re
from pipeline.base_pipeline import BasePipeline
from pipeline.base_pipeline import CodeSynth
from llama_index.embeddings import OpenAIEmbedding
from llama_index.agent import ReActAgent
from llama_index.llms import AzureOpenAI
from llama_index.tools import FunctionTool
from llama_index.agent.react.formatter import  get_react_tool_descriptions
from functools import wraps
from collections.abc import Iterable
from abc import abstractclassmethod
from typing import Optional, Dict, List, Tuple, Any
import inspect, itertools 
from tqdm import tqdm
from typing import List
from functools import wraps
from collections.abc import Iterable
import inspect, itertools 
import traceback

from io import StringIO  

traverse_dict = {}
function_tree = []
## Wrapper
def update_traverse_dict(func):
    @wraps(func)  # This decorator preserves the original function's metadata.
    def wrapper(*args, **kwargs):
        # Update the traverse_dict for each argument
        args_name = inspect.getfullargspec(func)[0]
        
        function_tree.append(func.__name__)
        for name_arg, arg in zip(args_name, args):
            arg_id = id(arg)
            if arg_id in traverse_dict:
                traverse_dict[arg_id]["traj"].append(func.__name__)
                traverse_dict[arg_id]["arg_name"].append(name_arg)
            else:
                flag_iter = False
                if isinstance(arg, Iterable) and not isinstance(arg, str):
                    for arg_indv in arg:
                        arg_id = id(arg_indv)
                        if arg_id in traverse_dict:
                            flag_iter = True
                            traverse_dict[arg_id]["traj"].append(func.__name__)
                            traverse_dict[arg_id]["arg_name"].append(name_arg)
                if not flag_iter:
                    arg_id = id(arg)
                    traverse_dict[arg_id] = {"traj":[func.__name__], "value":arg, "arg_name": [name_arg] }
        for k, arg in kwargs.items():
            arg_id = id(arg)
            if arg_id in traverse_dict:
                traverse_dict[arg_id]["traj"].append(func.__name__)
                traverse_dict[arg_id]["arg_name"].append(k)
            else:
                flag_iter = False
                if isinstance(arg, Iterable) and not isinstance(arg, str):
                    for arg_indv in arg:
                        arg_id = id(arg_indv)
                        if arg_id in traverse_dict:
                            flag_iter = True
                            traverse_dict[arg_id]["traj"].append(func.__name__)
                            traverse_dict[arg_id]["arg_name"].append(k)
                if not flag_iter:
                    arg_id = id(arg)
                    traverse_dict[arg_id] = {"traj":[func.__name__], "value":arg, "arg_name": [k] }
        # Call the original function
        result = func(*args, **kwargs)
        result_id = id(result)

        # Update the traverse_dict for the result
        if result_id in traverse_dict:
            traverse_dict[result_id]["traj"].append(func.__name__)
            traverse_dict[result_id]["arg_name"].append("ret")            
        else:
            traverse_dict[result_id] = {"traj":[func.__name__], "value":result, "arg_name": ["ret"] }

        return result

    return wrapper

### Parser
def parse_output(traversed_dict, func_tree):
    answer = []
    prev_list = []
    for func_call in func_tree:
        answer.append(
            {
                "tool_name": func_call,
                "arguments": []
            }
        )

        for k, v in traversed_dict.items():
            if func_call in v["traj"]:
                idx = v["traj"].index(func_call)
                if v["arg_name"][idx] == "ret":
                    prev_list.append(k)
                    continue
                answer[-1]["arguments"].append({
                                            "argument_name": v["arg_name"][idx],
                                            "argument_value": v["value"] #if len(v["traj"])==1 else k
                                            } )

    for answer_call in answer:
        for args in answer_call["arguments"]:
            if args["argument_value"] in prev_list:
                idx = prev_list.index(args["argument_value"])
                args["argument_value"] = f"$$PREV[{idx}]"
    return answer, prev_list

### TOPGUN

class TopGun(BasePipeline):
    
    QUERY_CODE_INTERPRETER_PROMPT = """
                    You are a Python code assistant. Today you are challenged to generate a
                    python code for executing a query. You will be given a list of pseudo functions
                    which you will use in your python code to help you in solving the query correctly.
                    Understand the query properly and use the required function to solve it. 
                    
                    We have following pseudo functions:
                    =====
                    {}
                    =====

                    You have to make sure to follow the below guardrails:
                    - Do not use double quotes only use single quotes.
                    - You are not allowed to define any functions, always must use the given functions in the code.
                    - If in case you end up creating a function please rememeber to have a decorator named @update_traverse_dict on them.
                    - Do not create a main function script and using 'if __name__ == "__main__"' is strictly prohibited. 
                    - Always have to the code within ```python\n<--Your Code-->\n```
                    - Always remember to use .get() to fetch values from a dictionary or a json.
                    - Always remember to replace the values in .get() of the generated code with a value
                      that matches the description of its key and dictionary whose argument it is. Use your knowledge of the world
                      to replace the value with a good real example. 
                      Example:
                          contact = company_info.get('contact_number', '999991999')
                          name = company_info.get('name', 'indigo')

                      Remember to Keep the values inside single quotes' '. 
                    - This is also required when accessing value of list use try: except: and in except: use a value that matches the description of the output.
                    - Never use print statement the user can use the variables in the code to infer himself of the code.
                    
                    You have to remember the below to solve the query:
                    - Always remember if a function is to input or output an object assume object to be an string.
                    - Always remember to use the API key that has been porvided above, if required.  

                    If the query is {}
                    Return the python code to excute it with help of given pseudo functions.
                    """
    
    REFLEXION_PROMPT = """
                    
                    You are a Python code assistant. You will be given your previous chat history, your 
                    previous code implementation of solving a query and, error in your implementation.
                    Taking the error into account, refactor the code for correctly solving the user query.
                    
                    Previous chat: {}
                    Previous code implementation: {}
                    Error: {}
                    
                    Refactored code:
                    
                    """
    
    code_synth = CodeSynth()
    _topgun_corpus = []
    tool_defs = []
    tool_dict = {}

    def __init__(self, filter_method, llm, codesynth_cache=False):
        self.filter_method = filter_method
        self.llm = llm
        self.codesynth_cache = codesynth_cache
    
    def save_cache(self):
        self.code_synth.save_cache()
    
    def set_tools(self, tool_descs:List[str], tool_names:List[str]):
        for tool_desc, tool_name in tqdm(zip(tool_descs,tool_names)):
            self.add_tool(tool_desc, tool_name)

    def init_tools(self, mapping=None):
        exec_string_tool_def = "\n\n\n".join(self._topgun_corpus)
        if mapping:
            for k,v in mapping.items():
                exec_string_tool_def = exec_string_tool_def.replace(v,k)
        exec(f"""{exec_string_tool_def}""", globals())
    
    def __set_tools(self, tool_defs:List[str] ):
        self.tool_defs = tool_defs
        self._topgun_corpus = self.tool_defs
        
    def add_tool(self, new_tool_desc, tool_name, max_retries=10):
        completed = False
        retries = 0
        while not completed and retries<max_retries:
            try:
                tool_def = self.code_synth.forward(tool_name, new_tool_desc, self.llm, cache=self.codesynth_cache)
                formated_tool_def = self.format_tool_def(tool_def, tool_name)
                completed = True
            except Exception as e:
                print(f"Retrying with new tool def for {tool_name}, {e}")
                retries+=1
        try:
            exec(formated_tool_def)
        except Exception as e:
            print(e)
            print(formated_tool_def)
            
        self.tool_defs.append(formated_tool_def)
        self._topgun_corpus.append(formated_tool_def)
        self.tool_dict[tool_name] = formated_tool_def
    
    def format_tool_def(self, new_tool_def, tool_name):
        idx = new_tool_def.find(f"def {tool_name}")
        if idx==-1:
            raise Exception("This tool is not in a good format")
        if idx == 0 :
            new_tool_def = f"@update_traverse_dict\n{new_tool_def}"
        else:
            new_tool_def = f"{new_tool_def[:idx-1]}@update_traverse_dict\n{new_tool_def[idx:]}"
        return new_tool_def
        
        
    def parser(self, response, mapping = None):
        pattern = r'```python\n(.*?)\n```'
        matches = re.findall(pattern, response, re.DOTALL)
        try:
            if True:
                global function_tree, traverse_dict
                traverse_dict = {}
                function_tree = []
                if matches:
                    response = matches[-1]
                    
                corpus_lib = "\n\n\n".join(self._topgun_corpus)
                # print(f"""{corpus_lib}\n\n\n{response}""")
                
                if mapping is None:
                    exec(f"""{corpus_lib}\n\n\n{response}""", globals())
                else:
                    response_replaced = response
                    corpus_lib_replaced = corpus_lib
                    for k,v in mapping.items():
                        response_replaced = response_replaced.replace(v,k)
                        corpus_lib_replaced = corpus_lib_replaced.replace(v,k)
                    
                    exec(f"""{corpus_lib_replaced }\n\n{response_replaced}""", globals())
                
                answer, prev_list = parse_output(traverse_dict, function_tree)
                return answer
                
        except Exception as ex:
            temp_out = StringIO()
            temp_out.write(traceback.format_exc())
            # print("\nException:",e, "\n")
            # self.feedback = traceback.format_exc()
            self.feedback = temp_out.getvalue()
            return None
        
        return response
    

    def query(self, query, mapping=None, max_retries=5):

        # possible_tools_names = self.filter_method.filter(query)
        # filtered_tools_corpus = [self.tool_dict[t] for t in possible_tools_names]
        query_code_interpreter = self.QUERY_CODE_INTERPRETER_PROMPT.format("\n\n\n".join(self._topgun_corpus).replace("@update_traverse_dict", ""), query)

        completed = False
        retries = 0

        response = self.llm.complete(query_code_interpreter)
        yield f"{response.text}\n"
        parsed_response = self.parser(response.text, mapping)
        
        while not completed and retries<max_retries:
            if parsed_response is None:
                retries+=1
                # print(response.text, "\n")
                yield f"\n```python\n{self.feedback}\n```\n"
                response = self.llm.complete(self.REFLEXION_PROMPT.format(query_code_interpreter, response.text, self.feedback))
                yield f"{response.text}\n"
                parsed_response = self.parser(response.text, mapping)
                
            else:
                completed = True
                self.feedback = None
                
        if completed:
            yield f"\n```javascript\n{json.dumps(parsed_response, indent=4)}\n```\n"
            return json.dumps(parsed_response, indent=4) # ToDO: Check
        else:
            return response.text