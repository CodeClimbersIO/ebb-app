fn test_log() {
    cc_logger::log("Hello, world!");
    cc_logger::log_indent("Hello, world!", 3, "red");
}

fn main() {
    // do_some_work();
    test_log();
    cc_logger::log_indent("Hello, world!", 3, "red");
}
