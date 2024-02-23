from pathlib import Path
from typing import Dict, List, Optional

from llama_index.readers.base import BaseReader
from llama_index.readers.schema.base import Document, ImageDocument


class ImageCaptionReader(BaseReader):
    """Image parser.

    Caption image using Blip.

    """

    def __init__(
        self,
        parser_config: Optional[Dict] = None,
        keep_image: bool = False,
        prompt: str = None,
    ):
        """Init params."""
        self._keep_image = keep_image
        self._prompt = prompt
        if parser_config is None:
            try:
                import torch  # noqa: F401
            except ImportError:
                raise ImportError(
                    "install pytorch to use the model: `pip install torch`"
                )
            try:
                from transformers import BlipForConditionalGeneration, BlipProcessor
            except ImportError:
                raise ImportError(
                    "transformers is required for using BLIP model: "
                    "`pip install transformers`"
                )
            try:
                import sentencepiece  # noqa: F401
            except ImportError:
                raise ImportError(
                    "sentencepiece is required for using BLIP model: "
                    "`pip install sentencepiece`"
                )
            try:
                from PIL import Image  # noqa: F401
            except ImportError:
                raise ImportError(
                    "PIL is required to read image files: `pip install Pillow`"
                )

            device = "cuda" if torch.cuda.is_available() else "cpu"
            dtype = torch.float16 if torch.cuda.is_available() else torch.float32

            processor = BlipProcessor.from_pretrained(
                "Salesforce/blip-image-captioning-large"
            )
            model = BlipForConditionalGeneration.from_pretrained(
                "Salesforce/blip-image-captioning-large", torch_dtype=dtype
            )

            parser_config = {
                "processor": processor,
                "model": model,
                "device": device,
                "dtype": dtype,
            }

        self._parser_config = parser_config

    def load_data(
        self, file: Path, extra_info: Optional[Dict] = None
    ) -> List[Document]:
        """Parse file."""
        from llama_index.img_utils import img_2_b64
        from PIL import Image

        # load document image
        image = Image.open(file)
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Encode image into base64 string and keep in document
        image_str: Optional[str] = None
        if self._keep_image:
            image_str = img_2_b64(image)

        # Parse image into text
        model = self._parser_config["model"]
        processor = self._parser_config["processor"]

        device = self._parser_config["device"]
        dtype = self._parser_config["dtype"]
        model.to(device)

        # unconditional image captioning

        inputs = processor(image, self._prompt, return_tensors="pt").to(device, dtype)

        out = model.generate(**inputs)
        text_str = processor.decode(out[0], skip_special_tokens=True)

        return ImageDocument(
            text=text_str,
            image=image_str,
        )
