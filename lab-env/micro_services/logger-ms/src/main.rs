use futures::future::join_all;
use std::error::Error;
use std::fmt::format;
use std::fs::{self};
use std::io::{self, Read};
use std::path::Path;
use std::process::Command;
use std::time::Duration;

use chrono::Utc;
use redis::{Commands, RedisResult, cluster::ClusterClient};
use serde::{Deserialize, Deserializer, Serialize, de::DeserializeOwned};
use tokio::{fs::read_to_string, task, time};

#[derive(Serialize, Deserialize, Debug)]
struct SyscallInfo {
    pid: i32,
    syscall_line: String,
}

// This is a struct to hold the redis client
// It is used to connect to the redis cluster
// It is used to push and get data from the redis cluster
// It is used to collect data from the redis cluster
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
    pub async fn collect_and_push<T, F>(&self, key: &str, collect_fn: F)
    where
        F: Fn() -> T,
        T: Serialize,
    {
        match self.push_data(key, &collect_fn()).await {
            Ok(_) => println!("✅ Pushed data to Redis."),
            Err(e) => eprintln!("Error pushing data to Redis: {:?}", e),
        }
    }
}

pub async fn push_syscalls_to_redis() -> RedisResult<()> {
    const REDIS_URL_1: &str = "redis://10.0.0.59:6379";
    const REDIS_URL_2: &str = "redis://10.0.0.60:6379";
    const REDIS_URL_3: &str = "redis://10.0.0.61:6379";
    // create a let variable for the redis url
    const REDIS_URL: &[&str] = &[REDIS_URL_1, REDIS_URL_2, REDIS_URL_3];
    let client = RedisClient::new(REDIS_URL.to_vec()).unwrap();
    loop {
        let syscall_data = collect_syscalls_with_threads().await;

        if !syscall_data.is_empty() {
            let json = serde_json::to_string(&syscall_data).map_err(|e| {
                redis::RedisError::from((
                    redis::ErrorKind::TypeError,
                    "serde_json error",
                    e.to_string(),
                ))
            })?;
            let key = format!("syscalls:{}", Utc::now().timestamp());
            client
                .push_data(&key, &json)
                .await
                .expect("Failed to push data to Redis");
            println!("✅ Pushed {} syscall entries to Redis.", syscall_data.len());
        } else {
            println!("⚠️  No syscalls collected this round.");
        }

        time::sleep(Duration::from_secs(30)).await;
    }
}

pub async fn collect_syscalls_with_threads() -> Vec<SyscallInfo> {
    let mut handles = Vec::new();

    if let Ok(entries) = fs::read_dir("/proc") {
        for entry in entries.flatten() {
            if let Ok(pid) = entry.file_name().to_string_lossy().parse::<i32>() {
                let path = format!("/proc/{}/syscall", pid);
                let path_exists = Path::new(&path).exists();
                println!("Path {} exists: {}", path, path_exists); // Add this line

                let handle = task::spawn(async move {
                    if path_exists {
                        match read_to_string(&path).await {
                            Ok(content) => Some(SyscallInfo {
                                pid,
                                syscall_line: content.trim().to_string(),
                            }),
                            Err(e) => {
                                eprintln!("Error reading {}: {:?}", path, e);
                                None
                            }
                        }
                    } else {
                        println!("Path {} does not exist", path);
                        None
                    }
                });
                handles.push(handle);
            }
        }
    } else {
        eprintln!("Error reading /proc directory"); // Add this line
    }

    let results = join_all(handles).await;
    results
        .into_iter()
        .filter_map(|res| match res {
            Ok(Some(syscall_info)) => Some(syscall_info),
            Ok(None) => None,
            Err(e) => {
                eprintln!("Task error: {:?}", e);
                None
            }
        })
        .collect()
}

#[tokio::main]
async fn main() {
    let mut interval = time::interval(Duration::from_secs(1));
    loop {
        interval.tick().await;
        if let Err(err) = push_syscalls_to_redis().await {
            eprintln!("Error: {:?}", err)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Create a constant String for the Redis URL
    const REDIS_URL_1: &str = "redis://10.0.0.59:6379";
    const REDIS_URL_2: &str = "redis://10.0.0.60:6379";
    const REDIS_URL_3: &str = "redis://10.0.0.61:6379";
    // create a let variable for the redis url
    const REDIS_URL: &[&str] = &[REDIS_URL_1, REDIS_URL_2, REDIS_URL_3];

    // I would like to create a test which checks that I can connect to redis with the redis client
    #[tokio::test]
    async fn check_connection_with_redis() {
        let redis = RedisClient::new(REDIS_URL.to_vec());
        assert!(redis.is_ok(), "Failed to connect to Redis");
    }

    // I would like to create a test which checks that I can push data to redis
    #[tokio::test]
    async fn test_redis_send_data() {
        let redis = RedisClient::new(REDIS_URL.to_vec()).unwrap();
        let data = SyscallInfo {
            pid: 1234,
            syscall_line: "sys_read".to_string(),
        };
        let result = redis.push_data("test_key", &data).await;
        println!("Result: {:?}", result);
        assert!(result.is_ok(), "Failed to push data to Redis");
    }
    // I would like to create a test which checks that I can get data from redis
    #[tokio::test]
    async fn test_redis_get_data() {
        let redis = RedisClient::new(REDIS_URL.to_vec()).unwrap();
        let data = SyscallInfo {
            pid: 1234,
            syscall_line: "sys_read".to_string(),
        };
        redis.push_data("test_key", &data).await.unwrap();
        let result: SyscallInfo = redis.get_data("test_key").await.unwrap();
        assert_eq!(result.pid, 1234);
        assert_eq!(result.syscall_line, "sys_read");
    }
    // Test that I can implement the SyscallInfo struct
    #[test]
    fn test_syscall_info_creation() {
        let syscall_info = SyscallInfo {
            pid: 1234,
            syscall_line: "sys_read".to_string(),
        };
        assert_eq!(syscall_info.pid, 1234);
        assert_eq!(syscall_info.syscall_line, "sys_read");
    }

    #[test]
    fn test_syscall_info_serialization() {
        let syscall_info = SyscallInfo {
            pid: 1234,
            syscall_line: "sys_read".to_string(),
        };
        let json = serde_json::to_string(&syscall_info).unwrap();
        assert!(json.contains("\"pid\":1234"));
        assert!(json.contains("\"syscall_line\":\"sys_read\""));
    }

    #[test]
    fn test_syscall_info_deserialization() {
        let json = r#"{"pid":1234,"syscall_line":"sys_read"}"#;
        let syscall_info: SyscallInfo = serde_json::from_str(json).unwrap();
        assert_eq!(syscall_info.pid, 1234);
        assert_eq!(syscall_info.syscall_line, "sys_read");
    }

    // Test that I can collected syscalls
    #[tokio::test]
    async fn test_collect_syscalls() {
        let syscalls = collect_syscalls_with_threads().await;
        assert!(!syscalls.is_empty(), "No syscalls collected");
        for syscall in &syscalls {
            assert!(syscall.pid > 0, "Invalid PID");
            assert!(!syscall.syscall_line.is_empty(), "Empty syscall line");
        }
    }
}
