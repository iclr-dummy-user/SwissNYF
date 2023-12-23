import json
import yaml

class Config:
    def __init__(self, **args):
        for key, value in args.items():
            if type(value) == dict:
                args[key] = Config(**value)
            if type(value)==list:
              args[key]=[]
              for val in value:
                if type(val)==dict:
                  args[key].append(Config(**val))
                else:
                  args[key].append(val)
        self.__dict__.update(args)

    def __repr__(self):
        return str(self.__dict__)
    
    def __getitem__(self, key):
        return self.__dict__[key]
    
    def __setitem__(self, key, value):
        self.__dict__[key] = value
    
    def __contains__(self, key):
        return key in self.__dict__
    
    def __iter__(self):
        return iter(self.__dict__)
    
    def __len__(self):
        return len(self.__dict__)
    
    def __delitem__(self, key):
        del self.__dict__[key]
    
    def __eq__(self, other):
        return self.__dict__ == other.__dict__
    
    def __ne__(self, other):
        return not self.__eq__(other)
    
    def __getstate__(self):
        return self.__dict__
    
    def __setstate__(self, d):
        self.__dict__.update(d)
    
    def __hash__(self):
        return hash(tuple(sorted(self.__dict__.items())))
    
    def __dir__(self):
        return self.__dict__.keys()
    

    def read_jsonl(file_path):
        with open(file_path, "r") as f:
            data = []
            for line in f:
                data.append(json.loads(line))
        return data
    
    def parse_yaml_file(file_path):
        with open(file_path, 'r') as file:
            yaml_data = yaml.safe_load(file)
        return Config(**yaml_data)

    def dump_config_to_yaml(config, file_path):
        with open(file_path, 'w') as file:
            yaml.dump(config.__dict__, file, default_flow_style=False)
    

# Example usage:
# 1. Parse YAML file into Config object
#config_object = parse_yaml_file('example.yaml')

# 2. Modify the Config object as needed
# config_object.some_key = 'new_value'

# 3. Dump Config object to YAML file
#dump_config_to_yaml(config_object, 'output.yaml')

    