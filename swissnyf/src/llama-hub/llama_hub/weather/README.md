# Weather Loader

This loader fetches the weather data from the [OpenWeatherMap](https://openweathermap.org/api)'s OneCall API, using the `pyowm` Python package. You must initialize the loader with your OpenWeatherMap API token, and then pass in the names of the cities you want the weather data for.

OWM's One Call API provides the following weather data for any geographical coordinate:
    - Current weather
    - Hourly forecast for 48 hours
    - Daily forecast for 7 days

## Usage

To use this loader, you need to pass in an array of city names (eg. [chennai, chicago]). Pass in the country codes as well for better accuracy.

```python
from llama_index import download_loader

WeatherReader = download_loader("WeatherReader")

loader = WeatherReader(token="[YOUR_TOKEN]")
documents = loader.load_data(places=['Chennai, IN','Dublin, IE'])
```

This loader is designed to be used as a way to load data into [LlamaIndex](https://github.com/jerryjliu/gpt_index/tree/main/gpt_index) and/or subsequently used as a Tool in a [LangChain](https://github.com/hwchase17/langchain) Agent. See [here](https://github.com/emptycrown/llama-hub/tree/main) for examples.
