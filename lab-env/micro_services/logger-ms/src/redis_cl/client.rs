use redis::{Commands, RedisResult, cluster::ClusterClient};
use serde::{Serialize, de::DeserializeOwned};
use std::error::Error;
use std::future::Future;

pub struct RedisClient {
    client: ClusterClient,
}

impl RedisClient {
    pub fn new(redis_nodes: Vec<&str>) -> Result<Self, Box<dyn Error>> {
        let client = ClusterClient::new(redis_nodes)?;
        Ok(RedisClient { client })
    }

    pub async fn push_data<T: Serialize>(&self, key: &str, data: &T) -> RedisResult<()> {
        let mut con = self.client.get_connection()?;
        let json = serde_json::to_string(data).map_err(|e| {
            redis::RedisError::from((
                redis::ErrorKind::TypeError,
                "serde_json error",
                e.to_string(),
            ))
        })?;
        println!("Pushing data to Redis: {}", json);
        let result: () = con.set(key, json)?;
        Ok(result)
    }
    pub async fn get_data<T: DeserializeOwned>(&self, key: &str) -> RedisResult<T> {
        let mut con = self.client.get_connection()?;
        let json: String = con.get(key)?;
        let data: T = serde_json::from_str(&json).map_err(|e| {
            redis::RedisError::from((
                redis::ErrorKind::TypeError,
                "serde_json error",
                e.to_string(),
            ))
        })?;
        Ok(data)
    }
    // make sure to have a redis return type
    pub async fn collect_and_push<T, Fut, F>(&self, key: &str, collect_fn: F) -> RedisResult<()>
    where
        F: Fn() -> Fut,
        Fut: Future<Output = T>,
        T: Serialize,
    {
        let result = collect_fn().await;
        self.push_data(key, &result).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{collector::syscalls::collect_syscalls_with_threads, models::syscall::SyscallInfo};
    const REDIS_URLS: &[&str] = &[
        "redis://10.0.0.59:6379",
        "redis://10.0.0.60:6379",
        "redis://10.0.0.61:6379",
    ];

    #[tokio::test]
    async fn test_push_and_get_data() {
        let client = RedisClient::new(REDIS_URLS.to_vec()).unwrap();
        let test_data = SyscallInfo {
            pid: 1234,
            syscall_line: "read".into(),
        };
        client.push_data("test:key", &test_data).await.unwrap();
        let result: SyscallInfo = client.get_data("test:key").await.unwrap();
        assert_eq!(result.pid, 1234);
    }

    #[test]
    fn test_redis_client_creation() {
        let result = RedisClient::new(REDIS_URLS.to_vec());
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_collect_and_push() {
        let client = RedisClient::new(REDIS_URLS.to_vec()).unwrap();
        client
            .collect_and_push("test:syscalls", || collect_syscalls_with_threads())
            .await;
        let result: SyscallInfo = client.get_data("test:key").await.unwrap();
        assert!(result.pid > 0);
    }
}
