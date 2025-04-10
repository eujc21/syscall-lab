use crate::collector::syscalls::collect_syscalls_with_threads;
use crate::redis_cl::client::RedisClient;
use chrono::Utc;

pub async fn push_syscalls_to_redis() {
    const REDIS_URL_1: &str = "redis://10.0.0.59:6379";
    const REDIS_URL_2: &str = "redis://10.0.0.60:6379";
    const REDIS_URL_3: &str = "redis://10.0.0.61:6379";
    // create a let variable for the redis url
    const REDIS_URL: &[&str] = &[REDIS_URL_1, REDIS_URL_2, REDIS_URL_3];
    let client = RedisClient::new(REDIS_URL.to_vec()).unwrap();
    let key = format!("syscalls:{}", Utc::now().timestamp());

    // Use the collec_and_push method to collect syscalls and push them to Redis
    // @param key: The key under which the data will be stored in Redis
    // @param collect_fn: The collect function that collects the syscalls
    // @return: A RedisResult indicating the success or failure of the operation
    client
        .collect_and_push(&key, || collect_syscalls_with_threads())
        .await;
}
