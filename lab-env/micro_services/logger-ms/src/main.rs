// use futures::future::join_all;
use std::time::Duration;
use tokio::time;
mod collector;
mod models;
mod redis_cl;
mod tasks;
use crate::tasks::push_loop::push_syscalls_to_redis;

#[tokio::main]
async fn main() {
    let mut interval = time::interval(Duration::from_secs(1));
    loop {
        interval.tick().await;
        push_syscalls_to_redis().await;
    }
}
