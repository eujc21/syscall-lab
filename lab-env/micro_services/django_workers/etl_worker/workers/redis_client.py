import os
from redis.cluster import RedisCluster as Redis
from dotenv import load_dotenv
from pymongo import MongoClient

# Use load_dotenv to use environment variables from .env file
# The variable looks like so VAR_NAME=HOST:PORT,HOST:PORT,...

# Use the RedisCluster class to connect to a Redis cluster
load_dotenv()


class RedisMongoClient:
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
        # Create a MongoClient instance
        mongo_uri = os.getenv("MONGO_URI")

    def __init__mongo__(self):
        if mongo_uri is None:
            raise ValueError("MONGO_URI environment variable is not set")
        # Create a MongoClient instance
        self.mongo = MongoClient(mongo_uri)
        # Get the database name from the environment variable
        mongo_db_name = os.getenv("MONGO_DB_NAME")
        if mongo_db_name is None:
            raise ValueError("MONGO_DB_NAME environment variable is not set")
        # Get the database
        self.mongo_db = self.mongo[mongo_db_name]
