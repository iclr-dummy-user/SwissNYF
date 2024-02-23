# Outlook Local Calendar Loader

This loader reads your past and upcoming Calendar events from your local Outlook .ost or .pst and parses the relevant info into `Documents`. 

It runs on Windows only and has only been tested with Windows 11. It has been designed to have a supoerset of the functionality of the Google Calendar reader.

## Usage

Here's an example usage of the OutlookCalendar Reader. It will retrieve up to 100 future events, unless an optional `number_of_results` argument is passed. It will also retrieve only future events, unless an optional `start_date` argument is passed. Optionally events can be restricted to those which occur on or before a specific date by specifying the optional `end-date` parameter. By default, `end-date` is 2199-01-01.

It always returns  Start, End, Subject, Location, and Organizer attributes and optionally returns additional attributes specified in the `more_attributes` parameter, which, if specified, must be a list of strings eg. ['Body','someotherattribute',...]. Attributes which don't exist in a calendar entry are ignored without warning.

```python
from llama_index import download_loader

OutlookCalendarReader = download_loader('OutlookLocalCalendarReader')

loader = OutlookCalendarReader()
documents = loader.load_data()
```

## Example

This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent.

### LlamaIndex

```python
from llama_index import GPTVectorStoreIndex, download_loader

OutlookCalendarReader = download_loader('OutlookLocalCalendarReader')

loader = OutlookCalendarReader(start_date='2022-01-01',number_of_documents=1000)

documents = loader.load_data()
index = GPTVectorStoreIndex.from_documents(documents)
index.query('When did I last see George Guava? When do I see him again?')
```
Note: it is actually better to give s structured prompt with this data and be sure to it is clear what today's date is and whether you want any data besides the indexed data used in answering the prompt.
