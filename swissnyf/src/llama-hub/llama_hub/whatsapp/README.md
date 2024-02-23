# Whatsapp chat loader

## Export a Whatsapp chat

1. Open a chat
2. Tap on the menu > More > Export chat
3. Select **Without media**
4. Save the `.txt` file in your working directory

For more info see [Whatsapp's Help Center](https://faq.whatsapp.com/1180414079177245/)


## Usage

- Messages will get saved in the format: `{timestamp} {author}: {message}`. Useful for when you want to ask about specific people in a group chat.
- Metadata automatically included: `source` (file name), `author` and `timesamp`.

```python
from pathlib import Path
from llama_index import download_loader

WhatsappChatLoader = download_loader("WhatsappChatLoader")

path = "whatsapp.txt"
loader = WhatsappChatLoader(path=path)
documents = loader.load_data()

# see what's created
documents[0]
>>> Document(text='2023-02-20 00:00:00 ur mom: Hi 😊', doc_id='e0a7c508-4ba0-48e1-a2ba-9af133225636', embedding=None, extra_info={'source': 'WhatsApp Chat with ur mom', 'author': 'ur mom', 'date': '2023-02-20 00:00:00'})
```

This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.
