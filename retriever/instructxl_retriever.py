from sentence_transformers import SentenceTransformer, util
from collections import Counter
from InstructorEmbedding import INSTRUCTOR
from retriever.base_retriever import BaseRetriever
import pprint
import torch

import replicate



class InstructorXLReplicate:
    def __init__(self):
        self.rep_id = "hex-plex/instructor-xl:5df148623d8c849d7d0dc8e7986ed0d7d33a3f90799da745260f4d020e97591c"

    def encode_single(self, text, *args, **kwargs):
        output = replicate.run(
            self.rep_id,
            input={
                "text": text,
            }
        )
        vec = output.get('vectors')
        if kwargs.get("convert_to_tensor"):
            vec = torch.tensor(vec)
        return vec
    
    def encode(self, texts, *args, **kwargs):
        if isinstance(texts, str):
            return self.encode_single(texts, *args, **kwargs)
        elif isinstance(texts, list):
            vecs = []
            for text in texts:
                vecs.append(self.encode_single(texts, *args, **kwargs))
            if kwargs.get("convert_to_tensor"):
                vecs = torch.stack(vecs)
            return vecs

class InstructRet(BaseRetriever):
    
    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        # Set model name
        self.model_name  = 'hkunlp/instructor-xl'
        
        # Load the trained model
        self.model = InstructorXLReplicate()

    def set_tool_def(self, tool_def) -> None:
        super().set_tool_def(tool_def)
        self.create_tool_embeddings()
        
    def add_tool_def(self, new_tool_def) -> None:
        super().add_tool_def(new_tool_def)
        self.create_tool_embeddings()
    
    def create_tool_embeddings(self) -> None:
        """create a list of tools and generate their embeddings"""
        
        # self.all_tools = tool_def
        description_batch = [tool[1] for tool in self.all_tools]
        self.description_emb = self.model.encode(description_batch, convert_to_tensor=True).to(self.device)
    

    def semantic_similarity_score(self, input_str: str, top_K) -> list:
        """
        Compute the semantic score between the input and the API description. 
        Args:
            input_str (str): the input string to be matched with the API description.
            top_k (int): number of top results
        Returns:
            List[(tool_name, float)]: the semantic similarity score between the input and the API description.
        """
        
        input_batch = [input_str] * len(self.all_tools)
        input_emb = self.model.encode(input_batch, convert_to_tensor=True)
        
        #Compute cosine-similarities
        cosine_scores = util.cos_sim(input_emb, self.description_emb)
        retrieved_scores = {}
        
        for res_idx in range(len(input_batch)):
            retrieved_scores[self.all_tools[res_idx][0]] = cosine_scores[res_idx][res_idx].cpu().numpy().item()

        if self.verbose:
            pp = pprint.PrettyPrinter(depth=4)
            pp.pprint(retrieved_scores)
        
        k = Counter(retrieved_scores)
 
        # Finding highest values
        high = k.most_common(top_K) 
        
        return [(i[0], i[1]) for i in high]


    def filter(self, query: str) -> list:
        """returns the top_k tools for a given query"""
        
        filtered_tools = self.semantic_similarity_score(query, self.top_k)
        return [tools[0] for tools in filtered_tools]

# if __name__ == "__main__":
#     import os
#     from helper import *
    
#     obj = InstructRet()
#     obj.set_tool_def(all_tools)
#     print(obj.filter("What is the highest grossing movie of all time?"))
#     obj.add_tool_def([tool2])
#     print(obj.filter("What is the highest grossing movie of all time?"))
    


        
    
