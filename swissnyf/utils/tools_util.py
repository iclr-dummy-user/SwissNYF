# make Tools class
import yaml
import json

class Tools:
    def __init__(self, tools_file):
        self.tools_file = tools_file
        self.tools = self.load_tools()

    # add either tools in yaml format or json format
    def load_tools(self):
        if self.tools_file.endswith(".yaml"):
            tools = self.load_tools_yaml()
        elif self.tools_file.endswith(".json"):
            tools = self.load_tools_json()
        else:
            print("tools file not supported")
            return
        return tools
    
    # add tools in yaml format
    def load_tools_yaml(self):
        with open(self.tools_file, "r") as f:
            tools = yaml.safe_load(f)
        return tools
    
    # add tools in json format
    def load_tools_json(self):
        with open(self.tools_file, "r") as f:
            tools = json.load(f)
        return tools

    # remove tool in exisiting tools.yaml file
    def remove_tool(self,tool_name):
        del self.tools[tool_name]

        if self.tools_file.endswith(".yaml"):
            with open(self.tools_file, "w") as f:
                yaml.dump(self.tools, f, default_flow_style=False)
        elif self.tools_file.endswith(".json"):
            with open(self.tools_file, "w") as f:
                json.dump(self.tools, f)
    
    # update tool in exisiting tools.yaml file
    def update_tool(self,tool_name,tool_str):

        # Parse each tool string and add it to the dictionary
        tool_lines = tool_str.split('\n')
        tool_data = {'tool': tool_name}
        
        for line in tool_lines[1:]:
            if line.strip():
                key, value = line.split(': ')
                tool_data[key.strip().lower()] = yaml.safe_load(value.strip())

        self.tools[tool_name] = tool_data

        if self.tools_file.endswith(".yaml"):
            with open(self.tools_file, "w") as f:
                yaml.dump(self.tools, f, default_flow_style=False)
        elif self.tools_file.endswith(".json"):
            with open(self.tools_file, "w") as f:
                json.dump(self.tools, f)
    
    
    def get_tools(self):
        return self.tools
    
    def get_tools_list(self):
        return [self.tools[tool_name] for tool_name in self.get_tool_names()]
    
    def get_tools__desc_str(self):
        # return list of string of each tool dictionary
        return [yaml.dump(self.tools[tool_name], default_flow_style=False) for tool_name in self.get_tool_names()]

    def get_tool(self, tool_name):
        return self.tools[tool_name]

    def get_tool_names(self):
        return list(self.tools.keys())

    def get_tool_descriptions(self):
        return [self.tools[tool_name]["description"] for tool_name in self.get_tool_names()]

    def get_tool_descriptions_by_name(self, tool_name):
        return self.tools[tool_name]["description"]

    def get_tool_descriptions_by_names(self, tool_names):
        return [self.tools[tool_name]["description"] for tool_name in tool_names]

    def get_tool_names_by_description(self, description):
        return [tool_name for tool_name in self.get_tool_names() if self.tools[tool_name]["description"] == description]

    def get_tool_name_by_description(self, description):
        return self.get_tool_names_by_description(description)[0]

    def get_tool_names_by_descriptions(self, descriptions):
        return [tool_name for tool_name in self.get_tool_names() if self.tools[tool_name]["description"] in descriptions]