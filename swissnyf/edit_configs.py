import tempfile
import subprocess
import os
import inspect
currentdir = os.path.dirname(os.path.abspath(
    inspect.getfile(inspect.currentframe())))
t = f'{currentdir}/configs/config.yaml'
try:
    editor = os.environ['EDITOR']
except KeyError:
    editor = 'nano'
subprocess.call([editor, t])
