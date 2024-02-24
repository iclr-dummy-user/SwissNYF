import re
import os
import json
from typing import Optional, Dict, List, Tuple, Any
from llama_index.prompts import PromptTemplate

class BasePipeline:
	def __init__(self, llms):
		pass

	def set_tools():
		pass

	def add_tools():
		pass

	def query():
		pass

class CacheResponse:
    cache_json = "./.cache/codesynth.json"
    def __init__(self):
        self.cache = {}
        if os.path.isfile(self.cache_json):
            with open(self.cache_json, "r") as f:
                self.cache = json.load(f)
        
    def save(self):
        if not os.path.exists("/".join(self.cache_json.split("/")[:-1])):
            os.makedirs("/".join(self.cache_json.split("/")[:-1]))
        with open(self.cache_json, "w") as f:
            json.dump(self.cache, f)

class CodeSynth():

    TEXT_TO_FUNCTION_SYNTHESIS = """ 

                    You are a Python code assistant that can generate a 
                    pseudo-Python function given its name, description, and arguments.
                    
                    function name: {}
                    function description: {}
                    Provided Libraries: {}

                    Always remember to import the required classes from one of the provided library, 
                    according to the function arguments and the provided documentation.

                    documentation is supposed to be fetched using the query engine tool.

                    If any library is not provided ignore any imports.
                    
                    The function arguments and returns are clearly defined 
                    in the function description. Use as provided in the description.
                    
                    You have to generate a pseudo-Python function that only contains docstring and a dummy return
                    object matching the actual return datatype. No need to use the provided arguments. Just return a dummy object
                    that matches the actual return datatype of the function.
                    
                    Maintain the actual return datatype in the return object. Docsrting contains Args and Returns. Maintain the
                    arguments are typing.
                    
                    Only generate the def function as instructed above, no typing imports or other code is needed.

                    Always have to the code within ```python\n<--Your Code-->\n```

                    Pseudo Function: 
                    
                    """
    FUNCTION_CALL_PROMPT = """
                  
                  You are a Python code assistant. You are given a function. 
                  For the given function, write an executable function call using
                  dummy argument values. 

                  Provided Libraries: {}

                  Details of the provided library can be only fetched using the query engine tool feel free to use it.
                  
                  -You can import the required classes from one of the provided library, 
                    according to the function arguments and the provided documentation.
                  -If any library is not provided ignore any imports.
                  -Do not import {} function, for which you are generating the function call.
                  -Do not generate any unnecessary import statements.
                  -No print statements are needed.
                  -Always have to code within ```python\n<--Your Code-->\n```
                  
                  Example:
                  
                  Given Function: 
                      def add(a: int, b: int) -> int:
                            Given integers a and b, return the total value of a and b.
                            return a + b
                        
                  Function Call:
                      a = 1
                      b = 4
                      add(a, b)
                  
                  The function name is: {}
                  The function description is: {}
                  The Function is: {}
                  Function Call:

                  """
    REFLEXION_PROMPT = """
                    
                    You are a Python code assistant. You will be given your last
                    python code implementation, and, an error in your last implementation 
                    will be provided. Taking the error into account, refactor your python 
                    code.

                    Use the query engine to export the information needed to resolve.

                    Always have to code within ```python\n<--Your Code-->\n```
                    
                    Previous python code implementation: {}
                    Self-reflection: {}
                    
                    Refactored python code:
                    
                    """
    
    new_prompt_tmpl_str = (
        "The library documentation of a subpart is as below.\n"
        "---------------------\n"
        "{context_str}\n"
        "---------------------\n"
        "Given the above documentation snippet, "
        "follow the below instruction to the best of your knowledge, if you believe you need any extra documentation .\n"
        "of other functions or classes just use a dummy class/function so that you can reiterate on your answer and give a final answer.\n"
        "Do not define an extra function, you can only call an extra function if you need.\n"
        "Instruction: {query_str}\n"
        "Answer: "
        )

    CUSTOM_REFINE_PROMPT_TMPL_STR = (
        "The original instruction is as follows: {query_str}\n"
        "The previous answer is: {existing_answer}\n"
        "You have to reiterate on it to replace the dummy functions/classes to give the final answer"
        "if you need to retain previous dummy classes/function or call a new dummy function that you believe you can reiterate then do the needful else give me the final  answer.\n"
        "------------\n"
        "{context_msg}\n"
        "------------\n"
        "Given the new documentation snippet and using the best of your knowledge, reiterate on the existing answer. "
        "If you can't improve the existing answer, just repeat it again."
        )
    
    feedback = None
    new_prompt_tmpl = PromptTemplate(new_prompt_tmpl_str)
    custom_refined_prompt = PromptTemplate(CUSTOM_REFINE_PROMPT_TMPL_STR)
    cache = CacheResponse()
    
    def parser(self, response, function_name, function_desc, llm, library_index=None, mapping=None, agent=None):
        pattern = r'```python\n(.*?)\n```'
        matches = re.findall(pattern, response, re.DOTALL)
        # agent = None
        try:
            if True:
                traverse_dict = {}
                function_tree = []
                if matches:
                    response = matches[-1]

                if mapping is None:
                    func_call = llm.complete(self.FUNCTION_CALL_PROMPT.format(" ", function_name, function_name, function_desc, response)).text
                else:
                    # agent = library_index.as_chat_engine(chat_mode = "react",
                    # text_qa_template=self.new_prompt_tmpl, refine_template=self.custom_refined_prompt, response_mode="refine", verbose = True
                    # )
                    func_call = str(agent.chat(self.FUNCTION_CALL_PROMPT.format("monkey, beatnum",function_name, function_name, function_desc, response)))

         
                func_matches = re.findall(pattern, func_call, re.DOTALL)
                if func_matches:
                    func_call = func_matches[-1]
                    
                print("\n-------------------------------------\n", "Function Call:\n", func_call,"\n-------------------------------------\n")
                
                if mapping is None:
                    exec(f"""{response}\n\n{func_call}""", globals())
                else:
                    response_replaced = response
                    func_call_replaced = func_call
                    for k,v in mapping.items():
                        response_replaced = response_replaced.replace(v,k)
                        func_call_replaced = func_call_replaced.replace(v,k)

                    exec(f"""{response_replaced}\n\n{func_call_replaced}""", globals())            
        except Exception as e:
            print("\n-------------------------------------\n", "Exception:",e,"\n-------------------------------------\n")

            self.feedback = e
            return None

        return response



    def forward(self, function_name, text, llm, library_index = None, mapping = None, max_retries = 5, cache=False):
        
        if cache and f"{function_name}: {text}" in self.cache.cache.keys():
            return self.cache.cache[f"{function_name}: {text}"]
        
        agent = None

        if library_index is None:
            func_synth = self.TEXT_TO_FUNCTION_SYNTHESIS.format(function_name, text, " ")
            response = llm.complete(func_synth)
            parsed_response = self.parser(response.text, function_name, text, llm)
        else:
        
            # Initialize the query engine with the new prompt
            agent = library_index.as_chat_engine(chat_mode = "react",
                 response_mode="compact", similarity_top_k=5, verbose = True
            )
            # text_qa_template=self.new_prompt_tmpl, refine_template=self.custom_refined_prompt,
            
            func_synth = self.TEXT_TO_FUNCTION_SYNTHESIS.format(function_name, text, "monkey, beatnum")
            response = agent.chat(func_synth)
            parsed_response = self.parser(str(response), function_name, text, llm, library_index, mapping, agent)
            
        
        completed = False
        retries = 0

        
        while not completed and retries<max_retries:
            if parsed_response is None:
                retries+=1
                print("\n-------------------------------------\n", "Predicted output:", response,"\n-------------------------------------\n")

                
                if mapping is None:
                    response = llm.complete(self.REFLEXION_PROMPT.format(response.text, self.feedback)) 
                    parsed_response = self.parser(response.text, function_name, text, llm)
                else:
                    fb_replaced = repr(self.feedback)
                    for k,v in mapping.items():
                        fb_replaced = fb_replaced.replace(k,v)
                        
                    
                    response = agent.chat(self.REFLEXION_PROMPT.format(str(response), fb_replaced)) 
                    parsed_response = self.parser(str(response), function_name, text, llm, library_index, mapping, agent)  
            else:
                completed = True
                self.feedback = None
       
        
        if completed:
            print("\n-------------------------------------\n", "Final output:", parsed_response,"\n-------------------------------------\n"*3)
            
            self.cache.cache[f"{function_name}: {text}"] = str(parsed_response)
                
            return str(parsed_response)
        else:
            return str(response)
    
    def save_cache(self):
        self.cache.save()
        
    # def parser(self, response):
    #     pattern = r'```python\n(.*?)\n```'
    #     matches = re.findall(pattern, response, re.DOTALL)
    #     try:
    #         if True:
    #             traverse_dict = {}
    #             function_tree = []
    #             if matches:
    #                 response = matches[-1]

    #             exec(f"""{response}""")
    #     except:
    #         pass

    #     return response

    # def forward(self, function_name, text, llm):
    #     func_synth = self.TEXT_TO_FUNCTION_SYNTHESIS.format(function_name, text)
    #     response = llm.complete(func_synth)
    #     response = self.parser(response.text)
    #     return response