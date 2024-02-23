from sentence_transformers import SentenceTransformer, util
from swissnyf.retriever.base_retriever import BaseRetriever
import pprint

class ToolBenchRet(BaseRetriever):
    
    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        # Set model name
        self.model_name = 'ToolBench/ToolBench_IR_bert_based_uncased'
        
        # Load the trained model
        self.model = SentenceTransformer(self.model_name).to(self.device) 

    def set_tool_def(self, tool_def) -> None:
        super().set_tool_def(tool_def)
        self.create_tool_embeddings()
        
    def add_tool_def(self, new_tool_def) -> None:
        super().add_tool_def(new_tool_def)
        self.create_tool_embeddings()
        

    def create_tool_embeddings(self) -> None:
        """create a list of tools and generate their embeddings"""
        # Create mappings, get 'api_name' and 'description_name' from the document_content
        self.tools = [' '.join([x[0] + ':', x[1]]) for x in self.all_tools]
        self.description_emb = self.model.encode(self.tools, convert_to_tensor=True).to(self.device)
    
    
    def filter(self, query: int) -> list:
        """filter out a the tools for a query based on cosine-similarity search"""
        ir_test_queries = [query]
        # Convert queries and documents to embeddings
        test_query_embeddings = self.model.encode(ir_test_queries, convert_to_tensor=True).to(self.device)
        
        # Compute cosine similarity between queries and documents
        cos_scores = util.pytorch_cos_sim(test_query_embeddings, self.description_emb)

        top_results = {}
        
        for query_index, query in enumerate(ir_test_queries):
            relevant_docs_indices = cos_scores[query_index].topk(self.top_k).indices
            relevant_docs_scores = cos_scores[query_index].topk(self.top_k).values
            relevant_docs = [(index, self.tools[index]) for index in relevant_docs_indices]
            relevant_docs_with_scores = {tool_name_api_name.split(':')[0]: float(score) for (doc_id, tool_name_api_name), score in zip(relevant_docs, relevant_docs_scores)}
        
            
            # Save query, original docs, top 5 docs with scores, and successful match count
            # top_results[query] = {
            #     'top_docs': relevant_docs_with_scores,
            # }
            top_results = relevant_docs_with_scores
        if self.verbose:
            pp = pprint.PrettyPrinter(depth=4)
            pp.pprint(top_results)
            
        return [api_name for api_name in top_results.keys()]

# if __name__ == "__main__":
#     import os
#     from helper import *
    
#     obj = ToolBenchRet()
#     obj.set_tool_def(all_tools)
#     print(obj.filter("What is the highest grossing movie of all time?"))
#     obj.add_tool_def([tool1])
#     print(obj.filter("What is the highest grossing movie of all time?"))
    
    
