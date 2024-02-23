from setuptools import find_packages, setup

with open('requirements.txt') as f:
    required = f.read().splitlines()

setup(
    name='swissnyf',
    packages=find_packages(include=['swissnyf']),
    version='0.9.8',
    description='SwissNyf: Is to make use of the tools available to llm in efficient ways',
    author='Me',
    install_requires=required
)
