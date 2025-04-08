use futures::future::join_all;
use std::error::Error;
use std::fmt::format;
use std::fs::{self};
use std::io::{self, Read};
use std::path::Path;
use std::process::Command;
use std::time::Duration;

use chrono::Utc;
use redis::{Client, Commands, RedisResult};
use serde::{Deserialize, Serialize};
use tokio::{fs::read_to_string, task, time};

#[derive(Serialize, Deserialize, Debug)]
struct SyscallInfo {
    pid: i32,
    syscall_line: String,
}

// #[derive(Serialize, Deserialize, Debug)]
// struct Argument {
//     name: Option<String>,
//     value: String,
//     #[serde(rename = "type")] // Use rename attribute to handle the 'type' field
//     arg_type: Option<String>,
// }
//
// #[derive(Serialize, Deserialize, Debug)]
// struct SyscallData {
//     pid: i32,
//     timestamp: String,
//     syscall_number: i32,
//     syscall_name: String,
//     arguments: Vec<Argument>,
//     return_value: Option<String>,
//     error: Option<String>,
//     kernel_version: Option<String>,
//     architecture: Option<String>,
// }

pub async fn push_syscalls_to_redis() -> RedisResult<()> {
    let client = Client::open("redis://10.0.0.59:6379")?;
    let mut con = client.get_connection()?;
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
            let _: () = con.set(key, json)?;
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
