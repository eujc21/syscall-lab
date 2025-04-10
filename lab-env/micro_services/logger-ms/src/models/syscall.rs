use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct SyscallInfo {
    pub pid: i32,
    pub syscall_line: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_syscall_info_creation() {
        let s = SyscallInfo {
            pid: 100,
            syscall_line: "read".to_string(),
        };
        assert_eq!(s.pid, 100);
    }

    #[test]
    fn test_syscall_info_serialization() {
        let s = SyscallInfo {
            pid: 1,
            syscall_line: "write".into(),
        };
        let json = serde_json::to_string(&s).unwrap();
        assert!(json.contains("\"pid\":1"));
    }

    #[test]
    fn test_syscall_info_deserialization() {
        let json = r#"{"pid":2,"syscall_line":"open"}"#;
        let s: SyscallInfo = serde_json::from_str(json).unwrap();
        assert_eq!(s.pid, 2);
        assert_eq!(s.syscall_line, "open");
    }
}
