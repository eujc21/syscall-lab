use logger_ms::collector::syscalls::collect_syscalls_with_threads;
use logger_ms::models::syscall::SyscallInfo;
use logger_ms::redis_cl::client::RedisClient;

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn test_end_to_end_flow() {
        let client = RedisClient::new(vec![
            "redis://10.0.0.59:6379",
            "redis://10.0.0.60:6379",
            "redis://10.0.0.61:6379",
        ])
        .unwrap();

        let syscalls = collect_syscalls_with_threads().await;
        if !syscalls.is_empty() {
            client.push_data("e2e_test", &syscalls).await.unwrap();
            let fetched: Vec<SyscallInfo> = client.get_data("e2e_test").await.unwrap();
            assert_eq!(fetched.len(), syscalls.len());
        }
    }
}
