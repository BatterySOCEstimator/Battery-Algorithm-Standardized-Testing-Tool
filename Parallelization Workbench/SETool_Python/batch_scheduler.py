"""
Resource Allocation Scheduler
Determines which "level" of allocation power to process submissions at.
Use the Complexity Grader to determine this dynamically, or obeys manual configuration
specified by the submitter.

Lies in between process_submission and obtain_output
"""

# critical imports
import dask.array as da

# simpler imports
import psutil
import random
import threading
import statistics as stat
import time
import os
import sys
import math

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

# our own imports
from obtain_output_data import obtain_output_data
from obtain_output_data_worker import distributed_output_data
from complexity_grader import grade_complexity


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
    # handle dynamic scaling first, adjust to the heuristic difficulty of the task submitted
    default_timeout = True
    timeout_schedule = "5 minutes"
    timeout = 0
    if processing_mode=="dynamic":
        level = grade_complexity(model_loc)
        processing_mode = "P" + str(level)
        default_timeout = False # schedule a timeout based on CPU and memory availability

        print("Dynamically Adjusting Resource Allocation Schedule...", file=sys.stderr)
        # we need to dynamically select a timeout period based on how active the server is:
        # RAM Utilization
        # .percent gives the used RAM as a percentage of total
        ram_usage = psutil.virtual_memory().percent

        # CPU Utilization
        # interval=0.5 blocks for half a second to get a stable average
        cpu_usage = psutil.cpu_percent(interval=0.5)

        # we allocate 10 minutes max per CPU or RAM usage, offset by 2 or 1 respectively
        # minimum allocation time is 3 minutes
        ram_score = math.floor(ram_usage / 20 + 2)
        cpu_score = math.floor(cpu_usage / 10 + 1)

        timeout = min(ram_score + cpu_score, 30)
        
        timeout_schedule = str(timeout) + " minutes"
        print(f"Task determined to be {processing_mode}, with allocation time of " + timeout_schedule, file=sys.stderr)


    if processing_mode=="P1":
        # we need to run the task on a cluster
        """ DASK WORKER AND SCHEDULER, using coiled """
        # First, we spin up the cluster
        # Using the named software environment is still the best way to 
        # ensure the Linux workers have the right libraries.
        print("Scheduler Activated - Processing mode P1", file=sys.stderr)
        print("Spinning up a cluster...", file=sys.stderr)
        cluster = coiled.Cluster(
            name="soc-data-cluster",
            n_workers=2,
            region="northamerica-northeast2",
            worker_memory="8 GiB",
            idle_timeout= "1 minute" if default_timeout else timeout_schedule
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
            print("Scattering data to workers...", file=sys.stderr)
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
            print("Force-syncing Model.py to worker disks...", file=sys.stderr)
            client.run(write_model_to_disk, content=model_code)

            # Submit the task
            # We pass the FUTURES as arguments. The worker will automatically
            # swap the future for the actual data once the task starts.
            print("Submitting task...", file=sys.stderr)
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
            print("Task Parallelization Complete, check for errors. Cleaning up...", file=sys.stderr)
            client.close()
            cluster.close()
            newBench.stop()
            newBench.report("PARALLELIZED CPU, 2 workers, 8GB memory each")

        return result
    elif processing_mode=="P2":
        # we need to run the task on a cluster
        """ DASK WORKER AND SCHEDULER, using coiled, now with GPUs """
        # First, we spin up the cluster
        # Using the named software environment is still the best way to 
        # ensure the Linux workers have the right libraries.
        print("Scheduler Activated - Processing mode P2", file=sys.stderr)
        print("Spinning up a cluster with GPUs...", file=sys.stderr)
        workers = 6 + math.floor(timeout / 14) # ranges between 4 and 6
        cluster = coiled.Cluster(
            name="soc-data-cluster-heavy-compute",
            n_workers=workers,
            worker_memory="8 GiB",
            region="northamerica-northeast2",
            # worker_gpu=1,  # single T4 per worker, remove if busy, costs are enormous
            idle_timeout="1 minute" if default_timeout else timeout_schedule
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
            print("Scattering data to workers...", file=sys.stderr)
            setups_future = client.scatter(setups)
            data_future = client.scatter(data)
            inputs_future = client.scatter(inputs)

            # THREE STEP PROCESS TO GET model.py FILES CORRECTLY SENT
            # 1. Read the local files into a dictionary
            model_dir = os.path.dirname(model_loc)
            payload = {}

            print(f"Reading files from {model_dir}...", file=sys.stderr)
            for filename in os.listdir(model_dir):
                file_path = os.path.join(model_dir, filename)
                if os.path.isfile(file_path):
                    with open(file_path, "rb") as f:
                        payload[filename] = f.read()

            print(f"Larger models may require data files; preparing files from {model_dir}...", file=sys.stderr)
            # 2. Define the function to write ALL files to the worker's CWD
            def write_files_to_disk(dask_worker, file_dict):
                import os
                results = []
                # Loop through the dictionary and write each one exactly like your old code
                for filename, content in file_dict.items():
                    with open(filename, "wb") as f:
                        f.write(content)
                    results.append(filename)
                return "Files written to " + os.getcwd() + ": " + ", ".join(results)

            # 3. Force the write across the whole cluster
            print(f"Force-syncing {len(payload)} files to worker disks...", file=sys.stderr)
            client.run(write_files_to_disk, file_dict=payload)

            # Submit the task
            # We pass the FUTURES as arguments. The worker will automatically
            # swap the future for the actual data once the task starts.
            print("Submitting task...", file=sys.stderr)
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
            print("Task Parallelization Complete, check for errors. Cleaning up...", file=sys.stderr)
            client.close()
            cluster.close()
            newBench.stop()
            newBench.report("PARALLELIZED CPU + NVDA T4 GPU, 4-6 workers, 8-16GB memory each")

        return result
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
 