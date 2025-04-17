from django.test import TestCase

# Test that I can import the worker
from workers.redis_client import RedisClient

from hashlib import sha256
import os
from time import time


def get_hash():
    # random hash based on machine name and time
    ht = os.system("echo $(hostname)$(date +%s) > /tmp/redis_key")
    # hash the ht value with sha256
    h = sha256(str(ht).encode()).hexdigest()
    return h


class RedisClientTestCase(TestCase):
    def test_worker_import(self):
        # Test that the Worker class can be imported
        self.assertIsNotNone(RedisClient)

    def test_get_cluster_nodes(self):
        # Test that the RedisClient class can be instantiated
        redis_client = RedisClient()
        # Test that the get_list_of_cluster_nodes method returns a list
        cluster_nodes = redis_client.redis.get_nodes()
        self.assertIsInstance(cluster_nodes, list)

    def test_get_cluster_keyspace(self):
        # Test that the RedisClient class can be instantiated
        redis_client = RedisClient()
        # Test that the get_list_of_cluster_nodes method returns a list
        rc_list = redis_client.redis.keys()
        self.assertIsInstance(rc_list, list)

    def test_populate_redis(self):
        hash_key = get_hash()
        print(hash_key)
        hash_value = get_hash() + str(time())
        # Test that the RedisClient class can be instantiated
        redis_client = RedisClient()
        # Test that the get_list_of cluster_nodes method returns a list
        redis_client.redis.set(hash_key, hash_value)
        # Test that the value is set
        value = redis_client.redis.get(hash_key)
        print(value)
        self.assertEqual(value, hash_value)
