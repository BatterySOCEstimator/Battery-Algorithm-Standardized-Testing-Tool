        # we need to run the task on a cluster
        """ DASK WORKER AND SCHEDULER, using coiled """

        # coiled.create_software_environment(
        #     name="soc-minimal-env",
        #     conda={
        #         "channels": ["conda-forge"],
        #         "dependencies": [
        #             "python=3.13", 
        #             "dask", 
        #             "distributed", 
        #             "pyarrow", 
        #             "numpy",
        #             "pandas", 
        #             "scipy", 
        #             "matplotlib"
        #         ]
        #     }
        # )

        # Create a remote cluster version of the existing task
        remote_process = coiled.function(
            region="us-east1",
            # software="soc-minimal-env",
            memory="8 GiB",
            name="SOC-submission-alpha", # the name is used to identify a shared resource for submissions, works with keepalive to use the same resources across different containers
            keepalive="1 minutes" # Keep the current cluster alive for future submissions
        )(task)

        # start timer after submission
        newBench = benchmarkCPU()
        newBench.start()
        try:
            result = remote_process(setups, data, inputs, user_model)
        finally:
            newBench.stop()
            newBench.report("DISTRIBUTED CPU")
        return result