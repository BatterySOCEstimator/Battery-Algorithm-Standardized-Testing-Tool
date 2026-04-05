# critical imports
import dask.array as da

# simpler imports
import psutil
import random
import threading
import statistics as stat
import time
import os

# dask and coiled imports
import numpy as np
import pandas as pd

import dask.dataframe as dd
import dask.array as da
import dask.bag as db
import dask.delayed as dy

from dask.distributed import Client, SSHCluster

import coiled
from coiled import Cluster

from obtain_output_data import obtain_output_data
from obtain_output_data_worker import distributed_output_data


# Class to benchmark CPU usage
class benchmarkCPU(threading.Thread):

    # Constructor to initialize the thread
    def __init__(self, intervalS=0.1):
        super().__init__()  # Initialize the thread
        self.running = False  # Control the running state, binary semaphore
        self.name = "unidentified process"
        self.interval = intervalS 
        self.performanceCPU = [] # array of performance (usage) over interval
        self.performanceMem = []
        self.elapsedTime = 0

    # Runs the benchmark when the thread starts
    def run(self):
        self.running = True
        currentProcess = psutil.Process()  # Get the current process
        self.name = currentProcess.name()

        self.elapsedTime = time.time()  # Record the start time of the benchmarking

        while self.running:
            # CPU usage percentage
            utilization = min(currentProcess.cpu_percent(self.interval), 100)
            memoryUt = currentProcess.memory_percent()
            self.performanceCPU.append(utilization) 
            self.performanceMem.append(memoryUt)

    # Stops the benchmark
    def stop(self):
        self.running = False  # Signal loop stop
        self.elapsedTime -= time.time()  # Record the end time of the benchmarking
        self.elapsedTime *= -1
        mCPU = stat.mean(self.performanceCPU)
        mMem = stat.mean(self.performanceMem)*100
        return self.name, round(mCPU,3), round(mMem,3), self.elapsedTime
    
    # generate a benchmarking report
    def report(self, name):
        # Open the file in 'a' mode (append), preserves prior results
        with open("performance.log", "a") as f:

            f.write(f"\nPerformance Metrics, report generated for {name}\n")
            f.write("Evaluated with psutil, threading, and time modules.\n")
            f.write("-" * 20 + "\n")
            
            mCPU = stat.mean(self.performanceCPU)
            mMem = stat.mean(self.performanceMem) * 100
            
            # Calculate values
            cpu_usage_time = mCPU * self.elapsedTime / 100
            mem_usage_time = mMem * self.elapsedTime / 100

            f.write(f"   Process Name:               {self.name}\n")
            f.write(f"   avg. CPU utilization:       {round(mCPU, 3)}%\n")
            f.write(f"   avg. memory utilization:    {round(mMem, 3)}%\n")
            f.write(f"   elapsed time:               {self.elapsedTime} s\n")
            f.write(f"   est. CPU usage time:        {cpu_usage_time} s\n")
            f.write(f"   est. memory usage time:     {mem_usage_time} s\n")
            f.write("-" * 20 + "\n")

# Function to schedule the evaluations
def evaluation_scheduler(setups, data, inputs, user_model, model_loc, processing_mode:str="Local") -> dict:
    if processing_mode=="P1":
        # we need to run the task on a cluster
        """ DASK WORKER AND SCHEDULER, using coiled """
        # First, we spin up the cluster
        # Using the named software environment is still the best way to 
        # ensure the Linux workers have the right libraries.
        print("Scheduler Activated - Processing mode P1")
        print("Spinning up a cluster...")
        cluster = coiled.Cluster(
            name="soc-data-cluster",
            n_workers=2,
            region="us-east1", # Corrected region string
            worker_memory="8 GiB",
            shutdown_on_close=True
        )
        client = cluster.get_client()

        # Start timer after submission
        newBench = benchmarkCPU()
        newBench.start()

        try:
            # "Scatter" the data
            # Instead of sending data inside the function call, we push it to 
            # the workers' memory. This returns a Future pointing to the data.
            # This is MUCH more stable for Windows-to-Linux transfers.
            print("Scattering data to workers...")
            setups_future = client.scatter(setups)
            data_future = client.scatter(data)
            inputs_future = client.scatter(inputs)

            # THREE STEP PROCESS TO GET model.py FILES CORRECTLY SENT
            # 1. Read the local file content
            with open(model_loc, "rb") as f:
                model_code = f.read()

            # 2. Define a function to write that code to every worker
            def write_model_to_disk(dask_worker, content):
                with open("Model.py", "wb") as f:
                    f.write(content)
                return "Model.py written to " + os.getcwd()

            # 3. Force the write across the whole cluster
            print("Force-syncing Model.py to worker disks...")
            client.run(write_model_to_disk, content=model_code)

            # Submit the task
            # We pass the FUTURES as arguments. The worker will automatically
            # swap the future for the actual data once the task starts.
            print("Submitting task...")
            future = client.submit(
                distributed_output_data,
                setups_future, 
                data_future, 
                inputs_future, 
                "."
            )

            # Gather the result
            result = client.gather(future)
        finally:
            # Clean up the clusters
            print("Task Parallelization Complete, check for errors. Cleaning up...")
            client.close()
            cluster.close()
            newBench.stop()
            newBench.report("PARALLELIZED CPU, 8GB memory")

        return result
    elif processing_mode=="P2":
        return {}
    else:
        # run the evaluation locally, as requested
        # --- start benchmarking
        log_cpu = benchmarkCPU()
        log_cpu.start()
        try:
            result = obtain_output_data(setups, data, inputs, user_model)
        finally:
            log_cpu.stop()
            log_cpu.report("LOCAL CPU")
        return result
 