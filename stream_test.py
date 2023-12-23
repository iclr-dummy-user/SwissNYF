# using requests library to check the response
import requests
import urllib
from urllib.parse import unquote
# the stream has started in the local host
url = "http://127.0.0.1:80/stream_response/"

# data ={ 

data = {
    "query":"Given a customer meeting transcript T, create action items and add them to my current sprint",
"planner":"topgun",
}


# sending a request and fetching a response which is stored in r

with requests.post(url=url, json=data, stream=True) as r:
    # printing response of each stream
    for chunk in r.iter_content(1024):
        print(chunk)

# r = requests.post(url=url, json=data)
# print(r.status_code)
# print(r.content)
