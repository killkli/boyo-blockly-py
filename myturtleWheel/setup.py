from setuptools import setup, find_packages

setup(
    name = 'custom turtle for Pyodide', 
    version='1.0', 
    packages=find_packages(), #include/exclude arguments take * as wildcard, . for any sub-package names
)