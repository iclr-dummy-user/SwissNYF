import re

class BasePipeline:
	def __init__(self, llms):
		pass

	def set_tools():
		pass

	def add_tools():
		pass

	def query():
		pass

class CodeSynth():

    TEXT_TO_FUNCTION_SYNTHESIS = """
    
                    You are a code generating wizard, today you have been assigned a 
                    task of generating a python function for a given function name, text input. 
                
                    function name: {}
                    text input: {}
                    
                    I need you to generate the python function implementation of the text input
                    that returns the same datatype you are allowed to return. Return a dummy named 
                    example that matches with the text description.
                
                    If the return is a string, use a named string
                    If the return is a list, use named items in the list
                    
                    Add the typing for the arguments according to their datatype in the function. Add Args 
                    and Returns in the docstring.
                    
                    Only generate the def function itself as instructed above, no typing imports or other code needed.
                    
                    Generate the function given the above instruction:
                    
                    Now after generating this function template, you are now challenged to refactor the logic of the function
                    which should contain only one line with the return statement that returns a dummy named example matching the
                    return datatype of the function and the description. Please avoid use of any codes or functions in return example.
                
                    Always keep the docstring with Args and Returns in the refactored version. 
                
                    Please avoid any extra comments.
                    
                    Refactor till everything is not satisfied
                    
                    """

    def parser(self, response):
        pattern = r'```python\n(.*?)\n```'
        matches = re.findall(pattern, response, re.DOTALL)
        try:
            if True:
                traverse_dict = {}
                function_tree = []
                if matches:
                    response = matches[-1]

                exec(f"""{response}""")
        except:
            pass

        return response

    def forward(self, function_name, text, llm):
        func_synth = self.TEXT_TO_FUNCTION_SYNTHESIS.format(function_name, text)
        response = llm.complete(func_synth)
        response = self.parser(response.text)
        return response