import os
from redis.cluster import RedisCluster as Redis
from dotenv import load_dotenv

# Use load_dotenv to use environment variables from .env file
# The variable looks like so VAR_NAME=HOST:PORT,HOST:PORT,...

# Use the RedisCluster class to connect to a Redis cluster
load_dotenv()


class RedisClient:
    """Print the class variables"""

    def __init__(self):
        # Get the Redis cluster nodes from the environment variable
        redis_nodes = os.getenv("REDIS_CLUSTER_NODES")
        if redis_nodes is None:
            raise ValueError("REDIS_NODES environment variable is not set")
        # Get one of the nodes to use as a seed
        seed_node = redis_nodes.split(",")[0]
        # Create a RedisCluster instance
        self.redis = Redis(host=seed_node.split(":")[0], port=int(
            seed_node.split(":")[1]), decode_responses=True)
