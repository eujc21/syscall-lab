from django.test import TestCase

# Test that I can import the worker
from workers.redis_client import RedisClient


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
