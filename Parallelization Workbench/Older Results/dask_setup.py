""" DASK WORKER AND SCHEDULER """
import numpy as np
import pandas as pd

import dask.dataframe as dd
import dask.array as da
import dask.bag as db

from dask.distributed import Client, SSHCluster

myHosts = ["localhost", "localhost", "McSCert"]
worker_options={"nthreads": 6}
cluster = SSHCluster(hosts=myHosts, worker_options=worker_options)
client = Client(cluster)

# Set up the local cluster of machines on my house wifi