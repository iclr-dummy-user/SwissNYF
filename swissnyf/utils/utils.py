import yaml
import os
import json

def read_jsonl(file_path):
    with open(file_path, "r") as f:
        data = []
        for line in f:
            data.append(json.loads(line))
    return data


def parse_yaml(yaml_file):
    with open(yaml_file, 'r') as stream:
        try:
            return yaml.safe_load(stream)
        except yaml.YAMLError as exc:
            print(exc)
    return None






