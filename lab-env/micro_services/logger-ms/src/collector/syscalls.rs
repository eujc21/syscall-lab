use crate::models::syscall::SyscallInfo;
use futures::future::join_all;
use std::fs::{self};
use std::path::Path;
use tokio::{fs::read_to_string, task};
// This function collects syscalls from all processes
// It reads the /proc/<pid>/syscall file for each process
// @param pid: The process ID
// @return: A vector of SyscallInfo structs
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

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_collect_syscalls() {
        let result = collect_syscalls_with_threads().await;
        // It's okay if it's empty depending on the system, just make sure it runs
        assert!(
            result
                .iter()
                .all(|s| s.pid > 0 && !s.syscall_line.is_empty())
        );
    }
}
